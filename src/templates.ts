export type TemplateDef = {
  key: string;
  label: string;
  /** 任务说明与 PRD 结构范例（合并后一并作为用户消息中的引导） */
  taskGuide: string;
  /** 需求输入框占位提示 */
  prdPlaceholder: string;
};

/** 唯一内置模板：标准列表页 */
export const TEMPLATE: TemplateDef = {
  key: 'list_standard',
  label: '标准列表页（搜索 + 表格 + 抽屉）',
  taskGuide: `根据下方【产品描述 / PRD】生成「标准后台列表页」：实现 PRD 中各节的控件与交互；将「一、搜索栏」映射为页顶筛选表单，「二、操作栏」为表格上方按钮区，「三、表格项」为 Table 列与单元格展示，「四、表格操作」为行内或批量操作（查看/编辑等用 Drawer 或 Modal）。若某节在 PRD 中未出现，可省略或极简占位。

以下为与用户输入格式对齐的 PRD 结构范例（实现以用户正文为准）：

# 一、搜索栏
- 订单号：选择框
- 供应商：输入框
- 取车时间：时间选择框

# 二、操作栏
- 新建订单按钮：点击后弹出弹窗，展示新建订单单窗

# 三、表格项
- 订单号：文本
- 供应商：文本
- 取车时间：日期时间
- 订单状态：已完成或者已取消

# 四、表格操作
- 查看：点击后展示侧拉抽屉，抽屉内以只读形式展示该订单的全部字段信息，仅用于查看详情，不可进行修改操作。
- 编辑：点击后同样展示侧拉抽屉，抽屉内展示内容与查看页面一致，所有字段支持编辑修改，抽屉底部设有提交按钮，编辑完成后点击提交可保存修改内容。
`,
  prdPlaceholder:
    '建议按范例分节撰写：一、搜索栏 → 二、操作栏 → 三、表格项 → 四、表格操作（含查看/编辑等行为说明）。可参考界面上的结构范例。',
};

export function getTemplate(): TemplateDef {
  return TEMPLATE;
}

/** 从 taskGuide 中取出「# 一、…」起的范例正文，作为需求框初始值 */
export function getDefaultPrdText(): string {
  const g = getTemplate().taskGuide;
  const marker = '\n# 一、';
  const i = g.indexOf(marker);
  if (i >= 0) return g.slice(i + 1).trim();
  return g.trim();
}
