/** 从模型完整输出中提取第一个 tsx 代码块（闭合后可用） */
export function tryExtractClosedTsxBlock(fullText: string): string | null {
  return tryExtractModelTsx(fullText);
}

const FENCE_PATTERNS: RegExp[] = [
  /```tsx\s*\r?\n([\s\S]*?)```/,
  /```\s*tsx\s*\r?\n([\s\S]*?)```/i,
  /```tsx\s*([\s\S]*?)```/,
  /```typescript\s*\r?\n([\s\S]*?)```/i,
  /```typescript\s*([\s\S]*?)```/i,
];

/**
 * 尽量从模型输出中取出可运行的 tsx（多组 fence 写法 + 无 fence 时的兜底）。
 * 避免 ```tsx 后无换行、语言标记大小写等导致回退到旧模板。
 */
export function tryExtractModelTsx(fullText: string): string | null {
  const t = fullText.replace(/^\uFEFF/, '').trim();
  if (!t) return null;

  for (const re of FENCE_PATTERNS) {
    const m = t.match(re);
    if (m?.[1]) {
      const inner = m[1].trim();
      if (inner.length > 0) return inner;
    }
  }

  if (!/```/.test(t) && /\bexport\s+default\b/.test(t)) {
    const looksLikeModule =
      /^import\s|^export\s|^\/\/|^\s*\/\*|^'use client'|^"use client"/m.test(t.trim());
    if (looksLikeModule) return t.trim();
  }

  return null;
}

/** 流式阶段：是否已经出现闭合的 tsx 代码块 */
export function hasClosedTsxFence(fullText: string): boolean {
  return tryExtractClosedTsxBlock(fullText) !== null;
}
