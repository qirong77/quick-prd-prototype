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
#   NODE_AUTO_INSTALL=0  禁止自动安装/升级 Node（仅检测，失败则退出）

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
NODE_AUTO_INSTALL="${NODE_AUTO_INSTALL:-1}"

node_major() {
  if command -v node >/dev/null 2>&1; then
    node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0
  else
    echo 0
  fi
}

load_nvm() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "${NVM_DIR}/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "${NVM_DIR}/nvm.sh"
    return 0
  fi
  return 1
}

install_nvm_and_node_lts() {
  if ! command -v curl >/dev/null 2>&1; then
    return 1
  fi
  info "未检测到可用 Node，正在通过 nvm 安装 LTS（用户目录，无需系统包管理器中的 node）..."
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if ! load_nvm; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    load_nvm || return 1
  fi
  nvm install --lts
  nvm alias default 'lts/*' 2>/dev/null || true
  nvm use --lts
  return 0
}

ensure_node_18() {
  local major
  major="$(node_major)"
  if [ "${major}" -ge 18 ]; then
    return 0
  fi

  if [ "${NODE_AUTO_INSTALL}" != "1" ]; then
    if [ "${major}" -eq 0 ]; then
      die "未检测到 Node.js，且 NODE_AUTO_INSTALL=0。"
    fi
    die "Node.js 版本过低（当前 $(node -v 2>/dev/null || echo 未知)），需要 >= 18，且 NODE_AUTO_INSTALL=0。"
  fi

  if [ "${major}" -gt 0 ] && [ "${major}" -lt 18 ]; then
    warn "Node 版本过低（$(node -v)），将尝试安装 Node 18+..."
  fi

  if load_nvm; then
    info "使用已安装的 nvm 安装 Node LTS..."
    nvm install --lts
    nvm use --lts
    major="$(node_major)"
    if [ "${major}" -ge 18 ]; then
      return 0
    fi
  fi

  if command -v brew >/dev/null 2>&1; then
    info "使用 Homebrew 安装 node..."
    brew install node
    major="$(node_major)"
    if [ "${major}" -ge 18 ]; then
      return 0
    fi
  fi

  if command -v apt-get >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    if command -v curl >/dev/null 2>&1; then
      info "使用 NodeSource 仓库安装 Node 20.x（需要 sudo）..."
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
      major="$(node_major)"
      if [ "${major}" -ge 18 ]; then
        return 0
      fi
    fi
    warn "NodeSource 不可用，尝试 apt 中的 nodejs/npm（版本可能偏旧）..."
    sudo apt-get update -qq
    sudo apt-get install -y nodejs npm || true
    major="$(node_major)"
    if [ "${major}" -ge 18 ]; then
      return 0
    fi
  fi

  if install_nvm_and_node_lts; then
    major="$(node_major)"
    if [ "${major}" -ge 18 ]; then
      return 0
    fi
  fi

  die "无法自动安装 Node.js 18+。请手动安装：https://nodejs.org 或 https://github.com/nvm-sh/nvm"
}

ensure_npm() {
  if command -v npm >/dev/null 2>&1; then
    return 0
  fi
  warn "未检测到 npm，尝试安装..."
  if command -v apt-get >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    sudo apt-get install -y npm || true
  fi
  if command -v npm >/dev/null 2>&1; then
    return 0
  fi
  die "未检测到 npm。请安装 Node.js 官方包（内含 npm）。"
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    return 0
  fi
  info "未检测到 git，尝试安装..."
  if command -v brew >/dev/null 2>&1; then
    brew install git && return 0
  fi
  if command -v apt-get >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    sudo apt-get update -qq && sudo apt-get install -y git && return 0
  fi
  if command -v yum >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    sudo yum install -y git && return 0
  fi
  warn "无法自动安装 git（可选，不影响构建与运行）。"
}

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    return 0
  fi
  info "未检测到 pm2，正在执行: npm install -g pm2"
  npm install -g pm2
}

# --- 依赖：Node / npm / git / pm2 ---
ensure_node_18
info "Node.js $(node -v)"
ensure_npm
info "npm $(npm -v)"
ensure_git
ensure_pm2
info "pm2 $(pm2 -v)"

# --- .env：API 密钥 ---
if [ ! -f "${ROOT}/.env" ]; then
  warn "未找到 .env，/api/anthropic 代理将无法使用。请在项目根目录创建 .env 并配置 ANTHROPIC_*。"
fi

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
pm2 start npm --name "${PM2_APP_NAME}" -- run preview -- --host 0.0.0.0 --port "${PORT}"

pm2 save 2>/dev/null || warn "pm2 save 失败（可稍后手动执行 pm2 save）"

echo ""
info "部署完成。"
echo "  访问: http://<服务器IP>:${PORT}/"
echo "  日志: pm2 logs ${PM2_APP_NAME}"
echo "  状态: pm2 status"
echo "  重启: pm2 restart ${PM2_APP_NAME}"
echo "开机自启（在服务器上执行一次，按提示操作）: pm2 startup && pm2 save"
