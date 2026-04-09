export type StreamRequestBody = {
  prdText: string;
  model?: string;
  max_tokens?: number;
};

/**
 * 解析 Anthropic Messages SSE，拼接 assistant 文本增量。
 */
export async function streamAnthropicAssistantText(
  body: StreamRequestBody,
  onDelta: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch('/api/anthropic/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `请求失败: ${res.status}`);
  }

  if (!res.body) {
    throw new Error('响应无 body');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let carry = '';
  let full = '';

  const flushLine = (line: string) => {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trimStart();
    if (!payload || payload === '[DONE]') return;
    try {
      const evt = JSON.parse(payload) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };
      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        const piece = evt.delta.text ?? '';
        full += piece;
        onDelta(full);
      }
    } catch {
      /* 忽略非 JSON 行 */
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const parts = carry.split('\n');
    carry = parts.pop() ?? '';
    for (const p of parts) {
      flushLine(p);
    }
  }
  if (carry.trim()) flushLine(carry);

  return full;
}
