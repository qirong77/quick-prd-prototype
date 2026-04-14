import { getDefaultTemplateKey, getTemplateByKey } from './index';

function skeletonForKey(key: string): string {
  return (getTemplateByKey(key)?.skeletonCode ?? '').trim();
}

/** 与预览、用户消息中的「默认骨架代码」同源 */
export function getDefaultTemplateCode(templateKey?: string): string {
  return skeletonForKey(templateKey ?? getDefaultTemplateKey());
}

export function getDefaultCodeForTemplateKey(key: string): string {
  return skeletonForKey(key);
}

export function getDefaultCodeForTemplate(): string {
  return skeletonForKey(getDefaultTemplateKey());
}
