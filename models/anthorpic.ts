import OpenAI from "openai";

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

function buildMessages(
  system: string,
  userQuery: string,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (system.trim()) {
    messages.push({ role: "system", content: system });
  }
  messages.push({ role: "user", content: userQuery });
  return messages;
}

/**
 * 使用 OpenAI 兼容 Chat Completions 流式接口（网关需暴露 `/v1/chat/completions`）。
 */
async function streamChatCompletion(options: {
  baseURL: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userQuery: string;
  maxTokens?: number;
  onDelta?: (piece: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const {
    baseURL,
    apiKey,
    model,
    systemPrompt: sys,
    userQuery,
    maxTokens = 8192,
    onDelta,
    signal,
  } = options;

  const client = new OpenAI({
    apiKey,
    baseURL: `${baseURL.replace(/\/$/, "")}/v1`,
  });

  const stream = await client.chat.completions.create(
    {
      model,
      messages: buildMessages(sys, userQuery),
      max_tokens: maxTokens,
      stream: true,
    },
    { signal },
  );

  let full = "";
  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content ?? "";
    if (piece.length > 0) {
      full += piece;
      onDelta?.(piece);
    }
  }

  return full;
}

async function main() {
  const { baseURL, apiKey } = getKeyAndUrl();
  const text = await streamChatCompletion({
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
