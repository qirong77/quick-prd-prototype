/**
 * PM2：生产环境预览（remote 构建产物 server/remote-dist）
 *
 * 首次或代码更新后请先构建：
 *   npm ci && npm run build:remote
 *
 * 启动：
 *   pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'quick-prd-preview-remote',
      cwd: __dirname,
      script: 'npm',
      args: 'run preview:remote',
      interpreter: 'none',
    },
  ],
};
