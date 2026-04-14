function getKeyAndUrl(supplier: "uyilink" | "tokencheap" = "uyilink") {
  if (supplier === "uyilink") {
    return {
      apiKey: "sk-AYXSw3YKzghPShfoWAwFBFtJT7EVrj9xYtgIFGvJqFtvBNgE",
      baseURL: "https://sz.uyilink.com",
    };
  }
  return {
    apiKey: "sk-76746bc7b87ca8c9fc699fd0932b38957da90ed923aa48a3",
    baseURL: "https://tokencheap.ai",
  };
}

const models: string[] = [
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-5-20250929",
  "claude-sonnet-4-6",
];
const systemPrompt = ``;
const query = `你是什么模型？模型的型号是多少？`;

/** 从单条 SSE JSON 中取出 assistant 文本增量（官方 Anthropic + 常见兼容网关）。 */
function extractStreamTextPiece(evt: unknown): string {
  if (evt == null) return "";
  if (typeof evt === "string") return evt;
  if (Array.isArray(evt)) {
    let acc = "";
    for (const item of evt) {
      acc += extractStreamTextPiece(item);
    }
    return acc;
  }
  if (typeof evt !== "object") return "";
  const e = evt as Record<string, unknown>;

  const dataField = e.data;
  if (typeof dataField === "string" && dataField.trim()) {
    try {
      const nested = extractStreamTextPiece(JSON.parse(dataField) as unknown);
      if (nested) return nested;
    } catch {
      /* 非 JSON 字符串则忽略 */
    }
  }

  if (e.type === "content_block_delta") {
    const delta = e.delta as Record<string, unknown> | undefined;
    if (!delta) return "";
    const dType = delta.type;
    if (dType === "text_delta") {
      const text = delta.text;
      if (typeof text === "string") return text;
      return "";
    }
    if (dType === "thinking_delta") {
      const thinking = delta.thinking;
      if (typeof thinking === "string") return thinking;
      return "";
    }
    if (dType === undefined) {
      const text = delta.text;
      if (typeof text === "string") return text;
      const thinking = delta.thinking;
      if (typeof thinking === "string") return thinking;
    }
    return "";
  }

  const choices = e.choices as
    | Array<{ delta?: { content?: string | null } }>
    | undefined;
  if (Array.isArray(choices) && choices.length > 0) {
    const content = choices[0]?.delta?.content;
    if (typeof content === "string") return content;
  }

  if (typeof e.text === "string") return e.text;

  return "";
}

/**
 * 流式调用 `/v1/messages`，边收边解析 SSE，并通过 onDelta 回调增量文本。
 */
async function streamAnthropicMessages(options: {
  baseURL: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userQuery: string;
  maxTokens?: number;
  onDelta?: (piece: string, accumulated: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { baseURL, apiKey, model, systemPrompt, userQuery, maxTokens = 8192, onDelta, signal } =
    options;

  const res = await fetch(`${baseURL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
      thinking: { type: "disabled" },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }

  if (!res.body) {
    throw new Error("响应无 body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  let full = "";

  const flushLine = (rawLine: string) => {
    const line = rawLine.replace(/^\uFEFF/, "").trim();
    if (!line || line.startsWith(":")) return;

    let payload: string | null = null;
    if (line.startsWith("data:")) {
      payload = line.slice(5).trimStart();
    } else if (line.startsWith("{") || line.startsWith("[")) {
      payload = line;
    }
    if (!payload || payload === "[DONE]") return;

    try {
      const evt = JSON.parse(payload) as unknown;
      const piece = extractStreamTextPiece(evt);
      if (piece.length > 0) {
        full += piece;
        onDelta?.(piece, full);
      }
    } catch {
      /* 忽略非 JSON 行 */
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const parts = carry.split(/\r?\n/);
    carry = parts.pop() ?? "";
    for (const p of parts) {
      flushLine(p);
    }
  }
  if (carry.trim()) flushLine(carry);

  return full;
}

async function main() {
  const { baseURL, apiKey } = getKeyAndUrl();
  const text = await streamAnthropicMessages({
    baseURL,
    apiKey,
    model: models[0],
    systemPrompt,
    userQuery: query,
    onDelta: (piece) => {
      process.stdout.write(piece);
    },
  });
  console.log("\n--- full ---\n", text);
}

main().catch((err) => {
  console.error("error", err);
});
