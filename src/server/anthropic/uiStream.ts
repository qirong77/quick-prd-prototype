import type { ContentBlockParam, MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { isFileUIPart, isTextUIPart, type UIMessage } from 'ai';
import { fileAttachmentToAnthropicBlocks } from './fileAttachmentToContentBlocks';

export function uiMessagesToAnthropicMessages(messages: UIMessage[]): MessageParam[] {
  const out: MessageParam[] = [];
  for (const m of messages) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    if (m.role === 'assistant') {
      const text = m.parts.filter(isTextUIPart).map((p) => p.text).join('');
      if (text === '') continue;
      out.push({ role: 'assistant', content: text });
      continue;
    }

    const blocks: ContentBlockParam[] = [];
    for (const part of m.parts) {
      if (isTextUIPart(part) && part.text) {
        blocks.push({ type: 'text', text: part.text });
      } else if (isFileUIPart(part)) {
        blocks.push(
          ...fileAttachmentToAnthropicBlocks({
            mediaType: part.mediaType,
            filename: part.filename,
            url: part.url,
          }),
        );
      }
    }
    if (blocks.length === 0) continue;
    out.push({ role: 'user', content: blocks });
  }
  return out;
}
