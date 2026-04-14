import { ANTHROPIC_MODEL_IDS, DEFAULT_ANTHROPIC_MODEL_ID } from '@/config/public.config';

export function getAnthropicModelIds(): string[] {
  return [...ANTHROPIC_MODEL_IDS];
}

export function getDefaultAnthropicModelId(ids: string[]): string {
  if (ids.includes(DEFAULT_ANTHROPIC_MODEL_ID)) return DEFAULT_ANTHROPIC_MODEL_ID;
  return ids[0] ?? DEFAULT_ANTHROPIC_MODEL_ID;
}
