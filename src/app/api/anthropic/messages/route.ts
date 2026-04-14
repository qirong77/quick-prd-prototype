import { buildAnthropicUserContent, SYSTEM_PROMPT } from '@/prompts/system';
import { getAnthropicApiKey, getAnthropicBaseUrl, getDefaultAnthropicModelId } from '@/server/anthropic/env';
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
      { error: '缺少 ANTHROPIC_API_KEY，请在 .env 中配置' },
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

  const baseUrl = getAnthropicBaseUrl();
  const url = `${baseUrl}/v1/messages`;

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system: systemFromBody,
      messages: [{ role: 'user', content: userContent }],
      thinking: { type: 'disabled' },
    }),
  });

  const ct = upstream.headers.get('content-type');
  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text();
    return new NextResponse(errText || JSON.stringify({ error: upstream.statusText }), {
      status: upstream.status,
      headers: ct ? { 'Content-Type': ct } : undefined,
    });
  }

  const headers = new Headers();
  if (ct) headers.set('Content-Type', ct);
  return new Response(upstream.body, { status: upstream.status, headers });
}
