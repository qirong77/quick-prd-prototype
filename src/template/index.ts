import { DEFAULT_TEMPLATE } from './default';

export type TemplateDef = {
  key: string;
  label: string;
  /** 左侧「系统提示词」；留空则使用应用内置默认 */
  systemPrompt: string;
  /** 左侧「需求描述」初始正文 */
  instructions: string;
  /** 预览与用户消息用的默认骨架 TSX */
  skeletonCode: string;
};

export const TEMPLATES: TemplateDef[] = [DEFAULT_TEMPLATE as TemplateDef];

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
