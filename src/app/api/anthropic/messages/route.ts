import { buildAnthropicUserContent, SYSTEM_PROMPT } from '@/prompts/system';
import { createAnthropicClient } from '@/server/anthropic/client';
import { getAnthropicApiKey, getDefaultAnthropicModelId } from '@/server/anthropic/env';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Body = {
  prdText?: string;
  systemPrompt?: string;
  model?: string;
  max_tokens?: number;
  templateKey?: string;
};

export async function POST(req: Request) {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: '缺少网关 API Key，请在 src/config/server.config.ts 中配置' },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prdText = typeof body.prdText === 'string' ? body.prdText : '';
  const systemFromBody =
    typeof body.systemPrompt === 'string' && body.systemPrompt.length > 0
      ? body.systemPrompt
      : SYSTEM_PROMPT;
  const model =
    typeof body.model === 'string' && body.model.length > 0 ? body.model : getDefaultAnthropicModelId();
  const maxTokens =
    typeof body.max_tokens === 'number' && body.max_tokens > 0 ? body.max_tokens : 8192;

  const templateKey =
    typeof body.templateKey === 'string' && body.templateKey.length > 0 ? body.templateKey : undefined;

  const userContent = buildAnthropicUserContent({ prdText, templateKey });

  const anthropic = createAnthropicClient();

  let stream;
  try {
    stream = anthropic.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemFromBody,
      messages: [{ role: 'user', content: userContent }],
      thinking: { type: 'disabled' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        stream.on('text', (delta: string) => {
          controller.enqueue(encoder.encode(delta));
        });
        stream.on('error', (err: Error) => {
          controller.error(err);
        });
        await stream.done();
        controller.close();
      } catch (e) {
        controller.error(e instanceof Error ? e : new Error(String(e)));
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
