import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages';

export type FileAttachmentInput = {
  mediaType: string;
  filename?: string;
  url: string;
};

const ANTHROPIC_IMAGE_MEDIA = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const MAX_DOCUMENT_CHARS = 200_000;

function parseDataUrl(dataUrl: string): { mime: string; isBase64: boolean; payload: string } | null {
  const comma = dataUrl.indexOf(',');
  if (comma < 0 || !dataUrl.startsWith('data:')) return null;
  const header = dataUrl.slice(5, comma);
  const payload = dataUrl.slice(comma + 1);
  const mime = header.split(';')[0]?.trim().toLowerCase() ?? '';
  const isBase64 = /;base64$/i.test(header) || /;base64;/i.test(header);
  return { mime, isBase64, payload };
}

function normalizeImageMediaType(mime: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | null {
  const m = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  if (m === 'image/jpg') return 'image/jpeg';
  if (ANTHROPIC_IMAGE_MEDIA.has(m)) return m as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  return null;
}

const TEXT_FILE_EXT =
  /\.(txt|md|markdown|json|csv|ts|tsx|js|jsx|mjs|cjs|css|html|htm|xml|yaml|yml|toml|env|log|sh|ini|gitignore|prisma|graphql|sql)$/i;

function isProbablyTextMime(mime: string, filename?: string): boolean {
  const m = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  if (m.startsWith('text/')) return true;
  if (
    m === 'application/json' ||
    m === 'application/xml' ||
    m === 'application/javascript' ||
    m === 'application/x-yaml' ||
    m === 'application/sql' ||
    m === 'application/csv'
  ) {
    return true;
  }
  if ((m === '' || m === 'application/octet-stream') && filename && TEXT_FILE_EXT.test(filename)) {
    return true;
  }
  return false;
}

function utf8FromDataUrlPayload(payload: string, isBase64: boolean): string {
  if (isBase64) {
    return Buffer.from(payload.replace(/\s/g, ''), 'base64').toString('utf8');
  }
  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}

function imageBase64FromDataUrl(parsed: { isBase64: boolean; payload: string }): string {
  if (parsed.isBase64) {
    return parsed.payload.replace(/\s/g, '');
  }
  const text = utf8FromDataUrlPayload(parsed.payload, false);
  return Buffer.from(text, 'utf8').toString('base64');
}

/**
 * 将前端 FileUIPart（通常为 data URL）转为 Anthropic user content blocks。
 */
export function fileAttachmentToAnthropicBlocks(part: FileAttachmentInput): ContentBlockParam[] {
  const label = part.filename?.trim() || '附件';
  if (!part.url.startsWith('data:')) {
    return [
      {
        type: 'text',
        text: `[${label}] 无法处理：仅支持浏览器内联 data URL。`,
      },
    ];
  }

  const parsed = parseDataUrl(part.url);
  if (!parsed) {
    return [{ type: 'text', text: `[${label}] 无法解析 data URL。` }];
  }

  const mimeFromPart = part.mediaType.split(';')[0]?.trim().toLowerCase() ?? '';
  const mime = mimeFromPart || parsed.mime;

  const imageMedia = normalizeImageMediaType(mime);
  if (imageMedia) {
    const data = imageBase64FromDataUrl(parsed);
    return [
      {
        type: 'image',
        source: { type: 'base64', media_type: imageMedia, data },
      },
    ];
  }

  if (isProbablyTextMime(mime, part.filename)) {
    let text = utf8FromDataUrlPayload(parsed.payload, parsed.isBase64);
    let truncated = false;
    if (text.length > MAX_DOCUMENT_CHARS) {
      text = text.slice(0, MAX_DOCUMENT_CHARS);
      truncated = true;
    }
    const title = truncated ? `${label}（已截断）` : label;
    return [
      {
        type: 'document',
        source: { type: 'text', media_type: 'text/plain', data: text },
        title,
      },
    ];
  }

  return [
    {
      type: 'text',
      text: `[${label}] 类型「${mime}」暂不支持；请上传 PNG/JPEG/GIF/WebP 图片或常见文本类文件。`,
    },
  ];
}
