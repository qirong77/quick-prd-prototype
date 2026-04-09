export type TemplateDef = {
  key: string;
  label: string;
  /** 拼入用户消息的引导说明 */
  instruction: string;
  /** 展示给用户的需求描述范例（应与该模板章节结构一致） */
  prdOutlineExample: string;
  /** 需求输入框占位提示 */
  prdPlaceholder: string;
};

/** 唯一内置模板：标准列表页 */
export const TEMPLATE: TemplateDef = {
  key: 'list_standard',
  label: '标准列表页（搜索 + 表格 + 抽屉）',
  instruction:
    '根据下方【产品描述 / PRD】生成「标准后台列表页」：实现 PRD 中各节的控件与交互；将「一、搜索栏」映射为页顶筛选表单，「二、操作栏」为表格上方按钮区，「三、表格项」为 Table 列与单元格展示，「四、表格操作」为行内或批量操作（查看/编辑等用 Drawer 或 Modal）。若某节在 PRD 中未出现，可省略或极简占位。',
  prdOutlineExample: `
# 一、搜索栏
| 名称 | 类型 |
| ---- | ---- |
| 订单号 | 选择框 |
| 供应商 | 输入框 |
| 取车时间 | 时间选择框 |

# 二、操作栏
| 按钮 | 功能描述 |
| ---- | ---- |
| 新建订单按钮 | 点击后弹出一个弹窗，内容是展示'新建订单单窗' |

# 三、表格项
| 名称 | 类型 |
| ---- | ---- |
| 订单号 | 文本 |
| 供应商 | 文本 |
| 取车时间 | 日期时间 |
| 订单状态 | 已完成或者已取消 |

# 四、表格操作
| 操作 | 描述 |
| ---- | ---- |
| 查看 | 展示一个侧拉抽屉，抽屉的内容为字段展示： |
| 编辑 | 内容同查看，但是可以编辑，有一个提交按钮 |
`,
  prdPlaceholder:
    '建议按范例分节撰写：一、搜索栏 → 二、操作栏 → 三、表格项 → 四、表格操作（含查看/编辑等行为说明）。可参考界面上的结构范例。',
};

export function getTemplate(): TemplateDef {
  return TEMPLATE;
}
