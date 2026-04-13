/**
 * @deprecated 请优先从 `src/template` 引用；此处保留 barrel 以兼容旧 import。
 */
export type { TemplateDef } from './template';
export {
  TEMPLATES,
  getDefaultInstructions,
  getDefaultTemplateKey,
  getTemplate,
  getTemplateByKey,
} from './template';

/** @deprecated 使用 getDefaultInstructions */
export { getDefaultInstructions as getDefaultPrdText } from './template';
