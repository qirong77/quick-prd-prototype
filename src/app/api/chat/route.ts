import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type UIMessage,
} from 'ai';
import { createAnthropicClient } from '@/server/anthropic/client';
import { getAnthropicApiKey, getDefaultAnthropicModelId } from '@/server/anthropic/env';
import { uiMessagesToAnthropicMessages } from '@/server/anthropic/uiStream';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return Response.json(
      { error: '缺少网关 API Key，请在 src/config/server.config.ts 中配置' },
      { status: 500 },
    );
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
  const maxOutputTokens =
    typeof body.maxOutputTokens === 'number' && body.maxOutputTokens > 0
      ? body.maxOutputTokens
      : 8192;

  const uiMessages = messagesRaw as UIMessage[];
  const anthropicMessages = uiMessagesToAnthropicMessages(uiMessages);
  if (anthropicMessages.length === 0) {
    return Response.json({ error: '没有可发送的对话消息' }, { status: 400 });
  }

  const anthropic = createAnthropicClient();

  const stream = createUIMessageStream({
    originalMessages: uiMessages,
    onError: (err) => (err instanceof Error ? err.message : '生成失败'),
    execute: async ({ writer }) => {
      let ms;
      try {
        ms = anthropic.messages.stream({
          model,
          max_tokens: maxOutputTokens,
          messages: anthropicMessages,
          thinking: { type: 'disabled' },
        });
      } catch (e) {
        writer.write({
          type: 'error',
          errorText: e instanceof Error ? e.message : String(e),
        });
        return;
      }

      writer.write({ type: 'start' });
      const textId = generateId();
      writer.write({ type: 'text-start', id: textId });
      try {
        ms.on('text', (delta: string) => {
          writer.write({ type: 'text-delta', id: textId, delta });
        });
        await ms.done();
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
