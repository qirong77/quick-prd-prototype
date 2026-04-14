/**
 * 仅允许在服务端或 Node 脚本中引用（API Route、server/*、scripts）。
 * 勿在客户端组件中 import 本文件，否则密钥会进入浏览器打包。
 */

export type GatewaySupplierId = 'uyilink' | 'tokencheap';

/** 切换供应商：改此处即可，无需改多处 baseURL / apiKey */
export const ACTIVE_GATEWAY_SUPPLIER: GatewaySupplierId = 'uyilink';

const GATEWAY_BY_SUPPLIER: Record<GatewaySupplierId, { baseURL: string; apiKey: string }> = {
  uyilink: {
    baseURL: 'https://sz.uyilink.com',
    apiKey: 'sk-AYXSw3YKzghPShfoWAwFBFtJT7EVrj9xYtgIFGvJqFtvBNgE',
  },
  tokencheap: {
    baseURL: 'https://tokencheap.ai',
    apiKey: 'sk-76746bc7b87ca8c9fc699fd0932b38957da90ed923aa48a3',
  },
};

export type GatewayCredentials = {
  baseURL: string;
  apiKey: string;
};

/**
 * 按供应商取网关 baseURL 与 apiKey（Anthropic Messages 与 OpenAI 兼容 chat 共用同一套网关）。
 * @param supplier 省略时使用 {@link ACTIVE_GATEWAY_SUPPLIER}
 */
export function getGatewayCredentials(
  supplier: GatewaySupplierId = ACTIVE_GATEWAY_SUPPLIER,
): GatewayCredentials {
  const row = GATEWAY_BY_SUPPLIER[supplier];
  return {
    baseURL: row.baseURL.replace(/\/$/, ''),
    apiKey: row.apiKey,
  };
}
