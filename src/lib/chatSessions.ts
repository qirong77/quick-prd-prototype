import { DEFAULT_TEMPLATE } from '../template/default';
import { COMPLICATED_TEMPLATE } from '../template/complicated';

export type SerializedMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type ChatSession = {
  id: string;
  name: string;
  messages: SerializedMessage[];
  createdAt: number;
  /** 内置会话不可删除 */
  builtIn?: boolean;
  /** 关联模板 key，用于预览面板的骨架代码 fallback */
  templateKey?: string;
};

const STORAGE_KEY = 'quick-prd-chat-sessions-v1';
const ACTIVE_SESSION_KEY = 'quick-prd-active-session-v1';

export const PAGE_GENERATOR_SKILL_ID = '__builtin_page_generator';

export const BUILTIN_SESSIONS: ChatSession[] = [
  {
    id: '__builtin_list_standard',
    name: DEFAULT_TEMPLATE.label,
    templateKey: DEFAULT_TEMPLATE.key,
    messages: DEFAULT_TEMPLATE.initialMessages.map((m) => ({ ...m })),
    builtIn: true,
    createdAt: 0,
  },
  {
    id: '__builtin_list_complicated',
    name: COMPLICATED_TEMPLATE.label,
    templateKey: COMPLICATED_TEMPLATE.key,
    messages: COMPLICATED_TEMPLATE.initialMessages.map((m) => ({ ...m })),
    builtIn: true,
    createdAt: 0,
  },
];

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getBuiltInSessions(): ChatSession[] {
  return BUILTIN_SESSIONS.map((s) => ({ ...s, messages: s.messages.map((m) => ({ ...m })) }));
}

export function loadSessions(): ChatSession[] {
  const builtIns = getBuiltInSessions();
  if (typeof window === 'undefined') return builtIns;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return builtIns;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return builtIns;
    const userSessions = parsed.filter(
      (s: unknown) =>
        s &&
        typeof s === 'object' &&
        typeof (s as ChatSession).id === 'string' &&
        typeof (s as ChatSession).name === 'string' &&
        !(s as ChatSession).builtIn,
    ) as ChatSession[];
    return [...builtIns, ...userSessions];
  } catch {
    return builtIns;
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    const userOnly = sessions.filter((s) => !s.builtIn);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
  } catch {
    // silent
  }
}

export function loadActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function saveActiveSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } catch {
    // silent
  }
}

export function createSession(name: string): ChatSession {
  return {
    id: newSessionId(),
    name,
    messages: [],
    createdAt: Date.now(),
  };
}
