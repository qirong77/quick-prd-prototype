/** 与 src/template/list_standard.tsx 同源，供前端预览默认骨架（Vite ?raw） */
import list_standard from './list_standard.tsx?raw';

/** 预打包 vite.config 依赖时，`?raw` 偶发为 `{ default: string }`，需归一成 string */
function normalizeRawImport(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw != null && typeof raw === 'object' && 'default' in raw) {
    const d = (raw as { default: unknown }).default;
    if (typeof d === 'string') return d;
  }
  return '';
}

export function getDefaultCodeForTemplate(): string {
  return normalizeRawImport(list_standard);
}
