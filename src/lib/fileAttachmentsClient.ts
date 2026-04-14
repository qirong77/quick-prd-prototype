import { convertFileListToFileUIParts, type FileUIPart } from 'ai';

export const ATTACHMENT_INPUT_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/gif,image/webp,text/plain,text/markdown,text/csv,text/html,text/css,text/xml,application/json,.txt,.md,.markdown,.json,.csv,.ts,.tsx,.js,.jsx,.mjs,.cjs,.css,.html,.htm,.xml,.yaml,.yml,.toml,.log,.sql,.env,.sh,.ini,.graphql,.prisma';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_BYTES = 512 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);

function baseMime(file: File): string {
  return file.type.split(';')[0]?.trim().toLowerCase() ?? '';
}

export function validateClientAttachmentFile(file: File): string | null {
  const mime = baseMime(file);
  if (mime.startsWith('image/')) {
    if (!ALLOWED_IMAGE_TYPES.has(mime)) {
      return `不支持的图片格式（仅 PNG / JPEG / GIF / WebP）：${file.name}`;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `图片过大（≤5MB）：${file.name}`;
    }
    return null;
  }
  if (file.size > MAX_TEXT_BYTES) {
    return `文本文件过大（≤512KB）：${file.name}`;
  }
  return null;
}

export async function filesToFileUIParts(files: File[]): Promise<FileUIPart[]> {
  const dt = new DataTransfer();
  for (const f of files) {
    dt.items.add(f);
  }
  return convertFileListToFileUIParts(dt.files);
}
