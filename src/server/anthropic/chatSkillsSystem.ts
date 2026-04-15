export type ChatSkillPayload = {
  name: string;
  description?: string;
  body: string;
};

const MAX_SKILLS = 16;
const MAX_NAME = 120;
const MAX_DESC = 400;
const MAX_BODY = 24_000;
const MAX_TOTAL = 80_000;

function clampStr(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n…（已截断）`;
}

export function normalizeChatSkillsPayload(raw: unknown): ChatSkillPayload[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatSkillPayload[] = [];
  for (const item of raw) {
    if (out.length >= MAX_SKILLS) break;
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const body = typeof o.body === 'string' ? o.body : '';
    if (!name || !body.trim()) continue;
    const description =
      typeof o.description === 'string' && o.description.trim() ? o.description.trim() : undefined;
    out.push({
      name: clampStr(name, MAX_NAME),
      description: description ? clampStr(description, MAX_DESC) : undefined,
      body: clampStr(body.trim(), MAX_BODY),
    });
  }
  return out;
}

export function buildSystemPromptFromSkills(skills: ChatSkillPayload[]): string {
  const chunks = skills.map((s, i) => {
    const head = `### Skill ${i + 1}：${s.name}`;
    const sub = s.description ? `\n说明：${s.description}` : '';
    return `${head}${sub}\n\n${s.body.trim()}`;
  });
  let joined = [
    '以下为用户启用的 Skills（可复用指令）。请在不与对话事实冲突的前提下遵循；若与最新消息矛盾，以用户最新消息为准。',
    '',
    chunks.join('\n\n---\n\n'),
  ].join('\n');
  if (joined.length > MAX_TOTAL) {
    joined = `${joined.slice(0, MAX_TOTAL)}\n…（系统指令总长已截断）`;
  }
  return joined;
}
