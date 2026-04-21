import { getDefaultTemplateKey, getTemplate } from '../template';
import { getDefaultTemplateCode } from '../template/readDefaultCode';

export type BuildUserContentParams = {
  prdText: string;
  templateKey?: string;
};

export function buildAnthropicUserContent(params: BuildUserContentParams): string {
  const t = getTemplate(params.templateKey ?? getDefaultTemplateKey());
  const prd = params.prdText.trim();
  const parts: string[] = [
    '---',
    `模板：${t.label}`,
    '---',
    '【产品描述 / PRD】',
    prd || '（用户未填写：请根据业务自行构思合理的列表页需求，并写出完整 tsx。）',
  ];
  const baseline = String(getDefaultTemplateCode(t.key) ?? '').trim();
  if (baseline) {
    parts.push(
      '',
      '【默认骨架代码】',
      '以下为当前模板对应骨架源码。请在其基础上按 PRD 修改：增删搜索项、操作按钮、表格列与抽屉/弹窗字段；保持默认导出组件与整体页面结构。',
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
