import { generateId, isTextUIPart, type UIMessage, type UIMessageChunk } from 'ai';

export function uiMessagesToAnthropicMessages(
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

/** 只取正文 text_delta；忽略 thinking / tool 等 */
export function extractAnthropicTextDelta(evt: unknown): string {
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

export async function pipeAnthropicSseToUiWriter(
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

export { generateId };
