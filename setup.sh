#!/usr/bin/env bash
# 在服务器上一键：安装依赖、构建、用 PM2 启动 vite preview（对外可访问需 0.0.0.0）
#
# 用法：
#   chmod +x setup.sh && ./setup.sh
#
# 可选环境变量：
#   PM2_APP_NAME   进程名，默认 quick-prd-image
#   PORT           监听端口，默认 4173（与 vite preview 一致）
#   SKIP_BUILD=1   跳过 npm run build（仅重装依赖并重启 PM2，需已有 dist/）
#   PM2_INSTALL_GLOBAL=0  若未安装 pm2，不自动 npm install -g pm2，直接报错退出

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

die() { echo -e "${RED}错误:${NC} $*" >&2; exit 1; }
info() { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[setup]${NC} $*"; }

PM2_APP_NAME="${PM2_APP_NAME:-quick-prd-image}"
PORT="${PORT:-4173}"
PM2_INSTALL_GLOBAL="${PM2_INSTALL_GLOBAL:-1}"

# --- 依赖检测：Node / npm ---
if ! command -v node >/dev/null 2>&1; then
  die "未检测到 Node.js。请先安装 Node 18 或更高版本（例如 https://nodejs.org 或 nvm）。"
fi

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
if [ "${NODE_MAJOR}" -lt 18 ]; then
  die "Node.js 版本过低（当前 $(node -v)），本项目需要 >= 18。"
fi
info "Node.js $(node -v)"

if ! command -v npm >/dev/null 2>&1; then
  die "未检测到 npm（通常随 Node 一起安装）。"
fi
info "npm $(npm -v)"

# --- 可选：git（便于排查部署来源，非必须）---
if ! command -v git >/dev/null 2>&1; then
  warn "未检测到 git（可选，不影响构建）。"
fi

# --- .env：API 密钥 ---
if [ ! -f "${ROOT}/.env" ]; then
  warn "未找到 .env，/api/anthropic 代理将无法使用。请在项目根目录创建 .env 并配置 ANTHROPIC_*。"
fi

# --- PM2 ---
if ! command -v pm2 >/dev/null 2>&1; then
  if [ "${PM2_INSTALL_GLOBAL}" = "1" ]; then
    warn "未检测到 pm2，正在执行: npm install -g pm2"
    npm install -g pm2
  else
    die "未检测到 pm2。请执行: npm install -g pm2"
  fi
fi
info "pm2 $(pm2 -v)"

# --- 安装依赖 ---
if [ -f "${ROOT}/package-lock.json" ]; then
  info "安装依赖（优先 npm ci）..."
  npm ci || { warn "npm ci 失败，改用 npm install"; npm install; }
else
  info "安装依赖（npm install）..."
  npm install
fi

# --- 构建 ---
if [ "${SKIP_BUILD:-0}" = "1" ]; then
  warn "已设置 SKIP_BUILD=1，跳过构建。请确认 dist/ 已存在且为最新。"
  if [ ! -f "${ROOT}/dist/index.html" ]; then
    die "dist/index.html 不存在，无法跳过构建。请去掉 SKIP_BUILD 后重新运行。"
  fi
else
  info "执行生产构建..."
  npm run build
fi

# --- 重启 PM2 ---
pm2 delete "${PM2_APP_NAME}" 2>/dev/null || true

info "启动 PM2：${PM2_APP_NAME}（vite preview，0.0.0.0:${PORT}）"
# 说明：与 package.json 中 "preview": "vite preview" 一致，并绑定所有网卡以便服务器外网访问
pm2 start npm --name "${PM2_APP_NAME}" -- run preview -- --host 0.0.0.0 --port "${PORT}"

pm2 save 2>/dev/null || warn "pm2 save 失败（可稍后手动执行 pm2 save）"

echo ""
info "部署完成。"
echo "  访问: http://<服务器IP>:${PORT}/"
echo "  日志: pm2 logs ${PM2_APP_NAME}"
echo "  状态: pm2 status"
echo "  重启: pm2 restart ${PM2_APP_NAME}"
echo "开机自启（在服务器上执行一次，按提示操作）: pm2 startup && pm2 save"
