import type { ChatSkillDef } from './types';

const STORAGE_KEY = 'quick-prd-chat-skills-v1';

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sk_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const BUILTIN_SKILLS: ChatSkillDef[] = [
  {
    id: '__builtin_prd_analyst',
    name: '产品需求分析师',
    description: '以资深产品经理视角分析需求，输出结构化评审意见',
    builtIn: true,
    body: `## 角色
你是一位拥有 10 年经验的资深产品经理，擅长需求拆解、用户故事编写与优先级判断。

## 工作流程
1. **理解需求**：仔细阅读用户提供的需求描述或 PRD 片段，归纳核心目标与目标用户。
2. **结构化拆解**：将需求拆分为「用户故事 → 验收标准 → 技术要点」三层结构。
3. **风险与建议**：指出需求中的模糊点、遗漏项、潜在风险，并给出改进建议。
4. **优先级建议**：使用 MoSCoW 方法（Must / Should / Could / Won't）给出优先级排序建议。

## 输出格式
使用 Markdown，包含以下章节：
- **需求概述**：一句话概括核心目标
- **用户故事列表**：以「作为 \\<角色\\>，我希望 \\<功能\\>，以便 \\<价值\\>」格式列出
- **验收标准**：每个故事附带可量化的验收条件
- **风险与建议**：以表格形式列出（风险项 | 影响程度 | 建议）
- **优先级排序**：MoSCoW 分类

## 约束
- 保持客观中立，不替用户做商业决策，只提供分析与建议
- 如果信息不足，明确列出需要补充的问题而非自行假设
- 回复使用中文`.trim(),
  },
];

export function loadChatSkills(): ChatSkillDef[] {
  if (typeof window === 'undefined') return [...BUILTIN_SKILLS];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const userSkills: ChatSkillDef[] = [];
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item || typeof item !== 'object') continue;
          const o = item as Record<string, unknown>;
          const id = typeof o.id === 'string' && o.id ? o.id : newId();
          if (BUILTIN_SKILLS.some((b) => b.id === id)) continue;
          const name = typeof o.name === 'string' ? o.name.trim() : '';
          const body = typeof o.body === 'string' ? o.body : '';
          const description =
            typeof o.description === 'string' && o.description.trim() ? o.description.trim() : undefined;
          if (!name || !body) continue;
          userSkills.push({ id, name, description, body });
        }
      }
    }
    return [...BUILTIN_SKILLS, ...userSkills];
  } catch {
    return [...BUILTIN_SKILLS];
  }
}

export function saveChatSkills(skills: ChatSkillDef[]): void {
  if (typeof window === 'undefined') return;
  try {
    const userOnly = skills.filter((s) => !s.builtIn);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
  } catch {
    // 存储失败时静默忽略，避免打断聊天
  }
}

export { newId as newChatSkillId };
