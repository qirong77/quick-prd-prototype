import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';
import { getAnthropicApiKey, getAnthropicBaseUrl, getDefaultAnthropicModelId } from '@/server/anthropic/env';
import {
  generateId,
  pipeAnthropicSseToUiWriter,
  uiMessagesToAnthropicMessages,
} from '@/server/anthropic/uiStream';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return Response.json({ error: '缺少 ANTHROPIC_API_KEY，请在 .env 中配置' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const messagesRaw = body.messages;
  if (!Array.isArray(messagesRaw)) {
    return Response.json({ error: '缺少 messages 数组' }, { status: 400 });
  }

  const modelDefault = getDefaultAnthropicModelId();
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

  const apiRoot = getAnthropicBaseUrl();
  const url = `${apiRoot}/v1/messages`;

  const uiMessages = messagesRaw as UIMessage[];
  const anthropicMessages = uiMessagesToAnthropicMessages(uiMessages);
  if (anthropicMessages.length === 0) {
    return Response.json({ error: '没有可发送的对话消息' }, { status: 400 });
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

  return createUIMessageStreamResponse({ stream, status: 200 });
}
