export type ChatSkillDef = {
  id: string;
  name: string;
  /** 简短说明，用于列表与提示 */
  description?: string;
  /** 注入模型上下文的完整指令正文 */
  body: string;
};
