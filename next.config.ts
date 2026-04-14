import type { NextConfig } from 'next';

/** 打包/启动 dev 时写入客户端，使用 Asia/Shanghai（北京时间） */
function buildTimeBeijing(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** 生成 `.next/standalone`，供 `npm run build:remote` 复制到 `server/remote-dist/` 部署 */
  output: 'standalone',
  env: {
    NEXT_PUBLIC_BUILD_TIME_BJ: buildTimeBeijing(),
  },
};

export default nextConfig;
