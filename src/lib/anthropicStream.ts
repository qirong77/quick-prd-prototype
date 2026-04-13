export type StreamRequestBody = {
  prdText: string;
  /** 为空时由服务端回退为默认 SYSTEM_PROMPT */
  systemPrompt?: string;
  model?: string;
  max_tokens?: number;
};

/**
 * 从单条 SSE JSON 中取出 assistant 文本增量（官方 Anthropic + 常见兼容网关）。
 */
function extractStreamTextPiece(evt: unknown): string {
  if (evt == null) return '';
  if (typeof evt === 'string') return evt;
  if (Array.isArray(evt)) {
    let acc = '';
    for (const item of evt) {
      acc += extractStreamTextPiece(item);
    }
    return acc;
  }
  if (typeof evt !== 'object') return '';
  const e = evt as Record<string, unknown>;

  const dataField = e.data;
  if (typeof dataField === 'string' && dataField.trim()) {
    try {
      const nested = extractStreamTextPiece(JSON.parse(dataField) as unknown);
      if (nested) return nested;
    } catch {
      /* 非 JSON 字符串则忽略 */
    }
  }

  if (e.type === 'content_block_delta') {
    const delta = e.delta as Record<string, unknown> | undefined;
    if (!delta) return '';
    const dType = delta.type;
    if (dType === 'text_delta') {
      const text = delta.text;
      if (typeof text === 'string') return text;
      return '';
    }
    // Claude extended thinking：先流式输出整块 thinking，再输出正文 text_delta
    if (dType === 'thinking_delta') {
      const thinking = delta.thinking;
      if (typeof thinking === 'string') return thinking;
      return '';
    }
    if (dType === undefined) {
      const text = delta.text;
      if (typeof text === 'string') return text;
      const thinking = delta.thinking;
      if (typeof thinking === 'string') return thinking;
    }
    return '';
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
      const piece = extractStreamTextPiece(evt);
      if (piece.length > 0) {
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
    const parts = carry.split(/\r?\n/);
    carry = parts.pop() ?? '';
    for (const p of parts) {
      flushLine(p);
    }
  }
  if (carry.trim()) flushLine(carry);

  return full;
}
