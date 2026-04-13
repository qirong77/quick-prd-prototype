import { getTemplate } from "../templates";
import { getDefaultTemplateCode } from "../template/readDefaultCode";

/**
 * 系统提示：稳定规则与输出契约，与 validateGeneratedTsx 的允许 import / 禁止 API 对齐。
 */
export const SYSTEM_PROMPT = `
## 角色与目标
你是「后台管理系统原型生成器」。产出供产品/研发快速扫一眼的界面结构，不是可上线生产代码。
优先：**少而完整**——只实现 PRD 里提到的区块与关键交互，避免堆砌无关功能。

## 输出契约（违反即失败）
1. **只输出一个** Markdown 代码块，语言标记必须是 \`tsx\`。
2. 代码块内必须是**可单独运行的单文件**：含必要 import、默认导出组件（推荐 \`export default function Prototype()\`）。
3. 代码块**之外**不得出现任何字符（含说明、道歉、第二个代码块、Markdown 标题）。

## 技术栈（硬性）
- **antd 4.x** + React（函数组件 + Hooks）。
- **仅允许**从这些包名 import（禁止子路径如 \`antd/es/...\`）：\`react\`、\`antd\`、\`@ant-design/icons\`、\`moment\`（日期/DatePicker 需要时）。
- 文案用**简体中文**；数据用组件内 \`useState\` 的 mock，不写死「待补充」类空话。

## 禁止（与校验器一致）
- 网络：fetch、axios、XMLHttpRequest。
- 存储：localStorage、sessionStorage。
- 动态 import、eval、\`new Function\`、外链脚本。

## 页面与交互
- 标准列表范式：**顶部筛选** → **操作按钮行** → **Table** → **查看/编辑用 Drawer 或 Modal**（与用户消息中的默认骨架一致时，沿用其布局与 Form 用法）。
- 表格列宽合理；主要按钮、行操作要有可点的 handler；反馈可用 \`message.info\` 等简短提示。

`.trim();

export type BuildUserContentParams = {
  prdText: string;
};

export function buildAnthropicUserContent(params: BuildUserContentParams): string {
  const t = getTemplate();
  const prd = params.prdText.trim();
  const parts: string[] = [
    '---',
    `模板：${t.label}`,
    '---',
    '【任务说明与结构范例】',
    t.taskGuide.trim(),
    '',
    '【产品描述 / PRD】',
    prd || '（用户未填写：请根据模板自行构思一个合理的示例业务列表页，并写出完整 tsx。）',
  ];
  const baseline = String(getDefaultTemplateCode() ?? '').trim();
  if (baseline) {
    parts.push(
      '',
      '【默认骨架代码】',
      '以下为 `src/template/list_standard.tsx` 当前内容。请在其基础上按 PRD 修改：增删搜索项、操作按钮、表格列与抽屉/弹窗字段；保持默认导出组件与整体页面结构。',
      '```tsx',
      baseline,
      '```',
    );
  }
  parts.push(
    '',
    '【最终要求】只输出一个 ```tsx 代码块，块外零字。',
  );
  return parts.join('\n');
}
