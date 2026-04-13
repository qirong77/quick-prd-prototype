import { DEFAULT_TEMPLATE } from './default';

export type TemplateDef = {
  key: string;
  label: string;
  taskGuide: string;
  prdPlaceholder: string;
  systemPrompt: string;
  instructions: string;
  code: string;
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

/** 从 taskGuide 中取出「# 一、…」起的范例正文，作为需求框初始值 */
export function getDefaultPrdText(templateKey?: string): string {
  const t = getTemplate(templateKey);
  const g = t.taskGuide;
  const marker = '\n# 一、';
  const i = g.indexOf(marker);
  if (i >= 0) return g.slice(i + 1).trim();
  return g.trim();
}
