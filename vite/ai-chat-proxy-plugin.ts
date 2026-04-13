import type { IncomingMessage } from 'http';
import {
  createUIMessageStream,
  generateId,
  isTextUIPart,
  pipeUIMessageStreamToResponse,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import {
  loadEnv,
  type PluginOption,
  type PreviewServer,
  type ViteDevServer,
} from 'vite';

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function uiMessagesToAnthropicMessages(
  messages: UIMessage[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const m of messages) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    const text = m.parts.filter(isTextUIPart).map((p) => p.text).join('');
    if (text === '' && m.role === 'assistant') continue;
    out.push({ role: m.role, content: text });
  }
  return out;
}

/** 只取正文 text_delta；忽略 thinking / tool 等，避免依赖 @ai-sdk/anthropic 对流事件的严格校验 */
function extractAnthropicTextDelta(evt: unknown): string {
  if (evt == null) return '';
  if (typeof evt === 'string') return evt;
  if (typeof evt !== 'object') return '';
  const e = evt as Record<string, unknown>;

  const dataField = e.data;
  if (typeof dataField === 'string' && dataField.trim()) {
    try {
      return extractAnthropicTextDelta(JSON.parse(dataField) as unknown);
    } catch {
      return '';
    }
  }

  if (e.type === 'content_block_delta') {
    const delta = e.delta as Record<string, unknown> | undefined;
    if (!delta || delta.type !== 'text_delta') return '';
    const text = delta.text;
    return typeof text === 'string' ? text : '';
  }

  const choices = e.choices as
    | Array<{ delta?: { content?: string | null } }>
    | undefined;
  if (Array.isArray(choices) && choices.length > 0) {
    const content = choices[0]?.delta?.content;
    if (typeof content === 'string') return content;
  }

  if (typeof e.text === 'string') return e.text;
  return '';
}

async function pipeAnthropicSseToUiWriter(
  body: ReadableStream<Uint8Array>,
  write: (part: UIMessageChunk) => void,
  textId: string,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let carry = '';

  const flushLine = (rawLine: string) => {
    const line = rawLine.replace(/^\uFEFF/, '').trim();
    if (!line || line.startsWith(':')) return;

    let payload: string | null = null;
    if (line.startsWith('data:')) {
      payload = line.slice(5).trimStart();
    } else if (line.startsWith('{') || line.startsWith('[')) {
      payload = line;
    }
    if (!payload || payload === '[DONE]') return;

    try {
      const evt = JSON.parse(payload) as unknown;
      const piece = extractAnthropicTextDelta(evt);
      if (piece.length > 0) {
        write({ type: 'text-delta', id: textId, delta: piece });
      }
    } catch {
      /* 忽略非 JSON 行 */
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const parts = carry.split(/\r?\n/);
    carry = parts.pop() ?? '';
    for (const p of parts) {
      flushLine(p);
    }
  }
  if (carry.trim()) flushLine(carry);
}

function attachAiChatProxy(server: ViteDevServer | PreviewServer) {
  const { mode, root } = server.config;
  server.middlewares.use('/api/chat', async (req, res, next) => {
    if (req.method !== 'POST') {
      next();
      return;
    }
    const env = loadEnv(mode, root, '');
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '缺少 ANTHROPIC_API_KEY，请在 .env 中配置' }));
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(req);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    const messagesRaw = body.messages;
    if (!Array.isArray(messagesRaw)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '缺少 messages 数组' }));
      return;
    }

    const modelDefault = env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    const model =
      typeof body.model === 'string' && body.model.length > 0 ? body.model : modelDefault;
    const system =
      typeof body.system === 'string' && body.system.trim().length > 0
        ? body.system.trim()
        : undefined;
    const maxOutputTokens =
      typeof body.maxOutputTokens === 'number' && body.maxOutputTokens > 0
        ? body.maxOutputTokens
        : 8192;

    const apiRoot = (env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
    const url = `${apiRoot}/v1/messages`;

    const uiMessages = messagesRaw as UIMessage[];
    const anthropicMessages = uiMessagesToAnthropicMessages(uiMessages);
    if (anthropicMessages.length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '没有可发送的对话消息' }));
      return;
    }

    const stream = createUIMessageStream({
      originalMessages: uiMessages,
      onError: (err) => (err instanceof Error ? err.message : '生成失败'),
      execute: async ({ writer }) => {
        const upstream = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxOutputTokens,
            stream: true,
            ...(system ? { system } : {}),
            messages: anthropicMessages,
            thinking: { type: 'disabled' },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text();
          writer.write({
            type: 'error',
            errorText: t || `请求失败: ${upstream.status}`,
          });
          return;
        }

        writer.write({ type: 'start' });
        const textId = generateId();
        writer.write({ type: 'text-start', id: textId });
        try {
          await pipeAnthropicSseToUiWriter(upstream.body, (p) => writer.write(p), textId);
        } catch (e) {
          writer.write({
            type: 'error',
            errorText: e instanceof Error ? e.message : '流读取失败',
          });
          return;
        }
        writer.write({ type: 'text-end', id: textId });
        writer.write({ type: 'finish', finishReason: 'stop' });
      },
    });

    pipeUIMessageStreamToResponse({
      response: res,
      stream,
      status: 200,
    });
  });
}

export function aiChatProxyPlugin(): PluginOption {
  return {
    name: 'ai-chat-proxy',
    configureServer(server: ViteDevServer) {
      attachAiChatProxy(server);
    },
    configurePreviewServer(server: PreviewServer) {
      attachAiChatProxy(server);
    },
  };
}
