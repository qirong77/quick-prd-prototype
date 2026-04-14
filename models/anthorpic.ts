import Anthropic from '@anthropic-ai/sdk';
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
  
const client = new Anthropic({
  apiKey: getKeyAndUrl().apiKey,
  baseURL: getKeyAndUrl().baseURL,
});

const message = await client.messages.create({
  max_tokens: 1024,
  messages: [{ role: 'user', content: '你是什么模型？' }],
  model: 'claude-sonnet-4-6',
});

console.log(message.content);