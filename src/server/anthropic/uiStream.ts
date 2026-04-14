import { isTextUIPart, type UIMessage } from 'ai';

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
