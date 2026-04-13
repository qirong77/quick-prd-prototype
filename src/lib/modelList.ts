/**
 * 模型列表来自 .env 的 VITE_ANTHROPIC_MODELS（逗号分隔）。
 * 默认选中 VITE_ANTHROPIC_MODEL（须为列表中一项）；未配置则用列表首项。
 */
export function getAnthropicModelIds(): string[] {
  const raw = import.meta.env.VITE_ANTHROPIC_MODELS;
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = import.meta.env.VITE_ANTHROPIC_MODEL?.trim();
  if (single) return [single];
  return ['claude-haiku-4-5-20251001'];
}

export function getDefaultAnthropicModelId(ids: string[]): string {
  const preferred = import.meta.env.VITE_ANTHROPIC_MODEL?.trim();
  if (preferred && ids.includes(preferred)) return preferred;
  return ids[0] ?? 'claude-haiku-4-5-20251001';
}
