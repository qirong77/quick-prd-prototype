/**
 * 模型层：Anthropic Messages 由 API 路由使用；OpenAI 兼容见 `openai-compatible.ts`。
 */
export {
  getOpenAICompatCredentialsFromConfig,
  getOpenAICompatModelIdsFromConfig,
  streamChatCompletion,
  type OpenAICompatCredentials,
} from './openai-compatible';
