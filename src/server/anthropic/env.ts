import { DEFAULT_ANTHROPIC_MODEL_ID } from '@/config/public.config';
import { getGatewayCredentials } from '@/config/server.config';

export function getAnthropicApiKey(): string | undefined {
  const k = getGatewayCredentials().apiKey.trim();
  return k.length > 0 ? k : undefined;
}

export function getAnthropicBaseUrl(): string {
  return getGatewayCredentials().baseURL;
}

export function getDefaultAnthropicModelId(): string {
  return DEFAULT_ANTHROPIC_MODEL_ID;
}
