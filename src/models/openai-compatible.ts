import OpenAI from 'openai';
import { ANTHROPIC_MODEL_IDS } from '@/config/public.config';
import { getGatewayCredentials } from '@/config/server.config';

export type OpenAICompatCredentials = {
  baseURL: string;
  apiKey: string;
};

/** 与当前 {@link getGatewayCredentials} 一致。勿在客户端引用。 */
export function getOpenAICompatCredentialsFromConfig(): OpenAICompatCredentials | null {
  const { baseURL, apiKey } = getGatewayCredentials();
  if (!apiKey.trim() || !baseURL.trim()) return null;
  return { baseURL, apiKey };
}

export function getOpenAICompatModelIdsFromConfig(): string[] {
  return [...ANTHROPIC_MODEL_IDS];
}

function buildMessages(
  system: string,
  userQuery: string,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (system.trim()) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: userQuery });
  return messages;
}

/**
 * 使用 OpenAI 兼容 Chat Completions 流式接口（网关需暴露 `/v1/chat/completions`）。
 */
export async function streamChatCompletion(options: {
  baseURL: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userQuery: string;
  maxTokens?: number;
  onDelta?: (piece: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const {
    baseURL,
    apiKey,
    model,
    systemPrompt: sys,
    userQuery,
    maxTokens = 8192,
    onDelta,
    signal,
  } = options;

  const client = new OpenAI({
    apiKey,
    baseURL: `${baseURL.replace(/\/$/, '')}/v1`,
  });

  const stream = await client.chat.completions.create(
    {
      model,
      messages: buildMessages(sys, userQuery),
      max_tokens: maxTokens,
      stream: true,
    },
    { signal },
  );

  let full = '';
  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content ?? '';
    if (piece.length > 0) {
      full += piece;
      onDelta?.(piece);
    }
  }

  return full;
}
