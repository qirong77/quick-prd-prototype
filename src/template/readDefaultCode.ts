import { getDefaultCodeForTemplate } from './defaultCodeRaw';

/** 与预览侧同源：标准列表页模板源码（Vite `?raw` 构建时内联，无 Node 读盘）。 */
export function getDefaultTemplateCode(): string {
  return getDefaultCodeForTemplate();
}
