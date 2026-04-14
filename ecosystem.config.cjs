/**
 * PM2 示例
 *
 * 本机 / CI 全量构建：
 *   npm ci && npm run build && pm2 start ecosystem.config.cjs --only quick-prd-prototype
 *
 * 远程仅跑已上传的 standalone（server/remote-dist/，由本地 npm run build:remote 生成）：
 *   cd /path/to/app && pm2 start ecosystem.config.cjs --only quick-prd-remote
 */
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'quick-prd-prototype',
      cwd: __dirname,
      script: 'npm',
      args: 'run start',
      interpreter: 'none',
    },
    {
      name: 'quick-prd-remote',
      cwd: path.join(__dirname, 'server', 'remote-dist'),
      script: 'server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '4096',
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
