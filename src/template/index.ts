import { COMPLICATED_TEMPLATE } from './complicated';
import { DEFAULT_TEMPLATE } from './default';
import type { SerializedMessage } from '../lib/chatSessions';

export type TemplateDef = {
  key: string;
  label: string;
  /** 左侧「需求描述」初始正文 */
  instructions: string;
  /** 预览与用户消息用的默认骨架 TSX */
  skeletonCode: string;
  /** 内置会话填充的初始聊天记录 */
  initialMessages?: readonly SerializedMessage[];
};

export const TEMPLATES: TemplateDef[] = [
  DEFAULT_TEMPLATE as TemplateDef,
  COMPLICATED_TEMPLATE as TemplateDef,
];

export function getDefaultTemplateKey(): string {
  return DEFAULT_TEMPLATE.key;
}

export function getTemplateByKey(key: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

export function getTemplate(key?: string): TemplateDef {
  const k = key ?? getDefaultTemplateKey();
  return getTemplateByKey(k) ?? TEMPLATES[0];
}

/** 模板中的需求描述初始值 */
export function getDefaultInstructions(templateKey?: string): string {
  return getTemplate(templateKey).instructions;
}
