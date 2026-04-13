import { DEFAULT_TEMPLATE } from './default';
import { getTemplateByKey } from './index';

function templateCode(key: string): string {
  return (getTemplateByKey(key)?.code ?? '').trim();
}

/** 与预览、用户消息中的「默认骨架代码」同源（来自模板定义中的 `code` 字符串） */
export function getDefaultTemplateCode(templateKey?: string): string {
  return templateCode(templateKey ?? DEFAULT_TEMPLATE.key);
}

export function getDefaultCodeForTemplateKey(key: string): string {
  return templateCode(key);
}

export function getDefaultCodeForTemplate(): string {
  return templateCode(DEFAULT_TEMPLATE.key);
}
