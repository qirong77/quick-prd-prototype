import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** 生成 `.next/standalone`，供 `npm run build:remote` 复制到 `server/remote-dist/` 部署 */
  output: 'standalone',
};

export default nextConfig;
