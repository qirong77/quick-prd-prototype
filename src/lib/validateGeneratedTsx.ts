const FORBIDDEN = /\b(fetch|axios|XMLHttpRequest|localStorage|sessionStorage)\b|\beval\s*\(|\bFunction\s*\(|import\s*\(/;

const FROM_RE = /from\s+['"]([^'"]+)['"]/g;
const BARE_IMPORT_RE = /import\s+['"]([^'"]+)['"]\s*;/g;

const ALLOWED = new Set(['react', 'antd', '@ant-design/icons', 'moment']);

export function validateGeneratedTsx(code: string): string | null {
  if (FORBIDDEN.test(code)) {
    return '生成代码包含被禁止的 API（网络、存储、eval、动态 import 等），请调整描述后重试。';
  }
  let m: RegExpExecArray | null;
  const fromCopy = new RegExp(FROM_RE.source, FROM_RE.flags);
  while ((m = fromCopy.exec(code)) !== null) {
    const src = m[1];
    if (!ALLOWED.has(src)) {
      return `不允许的 import 来源: ${src}`;
    }
  }
  const bareCopy = new RegExp(BARE_IMPORT_RE.source, BARE_IMPORT_RE.flags);
  while ((m = bareCopy.exec(code)) !== null) {
    const src = m[1];
    if (!ALLOWED.has(src)) {
      return `不允许的 import 来源: ${src}`;
    }
  }
  return null;
}
