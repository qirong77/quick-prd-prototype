import { SKELETON_TSX_BY_KEY } from './default/skeletonCode';
import { DEFAULT_TEMPLATE } from './default';

function skeletonForKey(key: string): string {
  return (SKELETON_TSX_BY_KEY[key] ?? '').trim();
}

/** 与预览、用户消息中的「默认骨架代码」同源 */
export function getDefaultTemplateCode(templateKey?: string): string {
  return skeletonForKey(templateKey ?? DEFAULT_TEMPLATE.key);
}

export function getDefaultCodeForTemplateKey(key: string): string {
  return skeletonForKey(key);
}

export function getDefaultCodeForTemplate(): string {
  return skeletonForKey(DEFAULT_TEMPLATE.key);
}
