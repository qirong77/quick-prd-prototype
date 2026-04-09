import { getTemplate } from "../templates";
import { getDefaultTemplateCode } from "../template/readDefaultCode";

export const SYSTEM_PROMPT = `
你是「后台管理系统原型生成器」。你的输出用于产品/研发快速看界面结构，不是生产代码。且尽量少地输出代码，保证最基本的功能和交互即可。

### 输出格式（硬性）
- 只输出 **一个** Markdown 代码块，语言标记必须是 tsx。
- 代码块内是 **完整单文件**：包含必要的 import、一个 \`export default function Prototype()\`（或同名）组件。
- 不要在代码块外输出任何文字、解释或第二个代码块。

### 技术约束（硬性）
- 仅允许从这些模块 import：\`react\`、\`antd\`、\`@ant-design/icons\`、\`moment\`（若用到日期）。
- 使用 antd 4.x API（如 Form、Table、Drawer、Modal、Tag、Space、Button、Input、Select、DatePicker 等）。
- 使用中文文案；mock 数据放在组件内 useState。
- 禁止：fetch/axios/XMLHttpRequest、动态 import、eval、Function、localStorage/sessionStorage、外链脚本。

### 代码质量
- 组件命名清晰；关键交互要有 onClick 等（可 toast 用 message.info 简要提示）。
- 表格列宽合理；避免无意义占位符文案。

### 其他约束
- antd 表单不使用 vertical 布局（layout!="vertical"）
`.trim();

export type BuildUserContentParams = {
  prdText: string;
};

export function buildAnthropicUserContent(params: BuildUserContentParams): string {
  const t = getTemplate();
  const parts: string[] = [
    `【模板】${t.label}`,
    t.instruction,
    '',
    '',
    '【该模板的结构范例（仅作格式参考；实现以用户实际填写为准）】',
    '```',
    t.prdOutlineExample.trim(),
    '```',
    '',
    '【产品描述 / PRD】',
    params.prdText.trim() || '（请根据模板自由发挥一个合理的示例业务页面）',
  ];
  const baseline = getDefaultTemplateCode().trim();
  if (baseline) {
    parts.push(
      '',
      '【本模板默认代码（src/template/list_standard.tsx；请以此为骨架按 PRD 增删改字段与交互，保留 MIS 布局范式）】',
      '```tsx',
      baseline,
      '```',
    );
  }
  parts.push('', '请严格按系统提示只输出一个 ```tsx 代码块。');
  return parts.join('\n');
}
