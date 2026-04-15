import type { ChatSkillDef } from './types';

const STORAGE_KEY = 'quick-prd-chat-skills-v1';

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sk_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function loadChatSkills(): ChatSkillDef[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: ChatSkillDef[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === 'string' && o.id ? o.id : newId();
      const name = typeof o.name === 'string' ? o.name.trim() : '';
      const body = typeof o.body === 'string' ? o.body : '';
      const description =
        typeof o.description === 'string' && o.description.trim() ? o.description.trim() : undefined;
      if (!name || !body) continue;
      out.push({ id, name, description, body });
    }
    return out;
  } catch {
    return [];
  }
}

export function saveChatSkills(skills: ChatSkillDef[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  } catch {
    // 存储失败时静默忽略，避免打断聊天
  }
}

export { newId as newChatSkillId };
