import fs from 'node:fs';
import path from 'node:path';

/** 使用 cwd：避免 Vite 打包配置时 import.meta.url 落在临时目录导致读盘失败。 */
const templatePath = path.join(process.cwd(), 'src/template/list_standard.tsx');

let cache: string | null = null;

/** 读取标准列表页模板的完整源码（供生成请求作为默认骨架）。 */
export function getDefaultTemplateCode(): string {
  if (cache !== null) {
    return cache;
  }
  if (!fs.existsSync(templatePath)) {
    cache = '';
    return '';
  }
  const text = fs.readFileSync(templatePath, 'utf8');
  cache = text;
  return text;
}
