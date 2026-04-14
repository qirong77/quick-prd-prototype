import Anthropic from '@anthropic-ai/sdk';
import { getGatewayCredentials } from '@/config/server.config';

export function createAnthropicClient(): Anthropic {
  const { apiKey, baseURL } = getGatewayCredentials();
  return new Anthropic({
    apiKey,
    baseURL,
  });
}
