import type { FileUIPart } from 'ai';

/** 与聊天附件结构一致，随 PRD 提交给 `/api/anthropic/messages` */
export type StreamAttachment = FileUIPart;

export type StreamRequestBody = {
  prdText: string;
  /** 为空时由服务端回退为默认 SYSTEM_PROMPT */
  systemPrompt?: string;
  model?: string;
  max_tokens?: number;
  /** 与 `src/template` 中模板 key 一致 */
  templateKey?: string;
  /** 随 PRD 一并提交的参考图、文本文件等 */
  attachments?: StreamAttachment[];
};

/**
 * 读取 PRD 流式接口返回的纯文本正文（UTF-8），按增量累积。
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
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onDelta(full);
  }
  full += decoder.decode();

  return full;
}
