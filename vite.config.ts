import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import { aiChatProxyPlugin } from './vite/ai-chat-proxy-plugin';
import { anthropicProxyPlugin } from './vite/anthropic-proxy-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 与 package.json 对齐，便于 esm.sh 解析依赖 */
const V = {
  react: '18.2.0',
  antd: '4.24.16',
  moment: '2.30.1',
  icons: '4.8.3',
} as const;

const DEPS_ANTD = `react@${V.react},react-dom@${V.react},moment@${V.moment}`;
const DEPS_ICONS = `react@${V.react},react-dom@${V.react}`;

function cdnPath(id: string): string | undefined {
  switch (id) {
    case 'react':
      return `https://esm.sh/react@${V.react}`;
    case 'react/jsx-runtime':
      return `https://esm.sh/react@${V.react}/jsx-runtime`;
    case 'react/jsx-dev-runtime':
      return `https://esm.sh/react@${V.react}/jsx-dev-runtime`;
    case 'react-dom':
      return `https://esm.sh/react-dom@${V.react}`;
    case 'react-dom/client':
      return `https://esm.sh/react-dom@${V.react}/client`;
    case 'moment':
      return `https://esm.sh/moment@${V.moment}`;
    case 'antd':
      return `https://esm.sh/antd@${V.antd}?deps=${DEPS_ANTD}`;
    case '@ant-design/icons':
      return `https://esm.sh/@ant-design/icons@${V.icons}?deps=${DEPS_ICONS}`;
    default:
      break;
  }
  if (id.startsWith('moment/locale/')) {
    return `https://esm.sh/moment@${V.moment}/${id.slice('moment/'.length)}`;
  }
  if (id.startsWith('antd/')) {
    return `https://esm.sh/antd@${V.antd}/${id.slice(5)}?deps=${DEPS_ANTD}`;
  }
  if (id.startsWith('@ant-design/icons/')) {
    return `https://esm.sh/${id}?deps=${DEPS_ICONS}`;
  }
  return undefined;
}

/** remote 构建不打包 antd.css（见 alias），需在 HTML 中注入 CDN 样式 */
function remoteAntdCssInjectPlugin(version: string): Plugin {
  const href = `https://cdn.jsdelivr.net/npm/antd@${version}/dist/antd.min.css`;
  return {
    name: 'remote-antd-css-inject',
    transformIndexHtml(html) {
      if (html.includes(href)) return html;
      return html.replace(
        '</head>',
        `    <link rel="stylesheet" href="${href}" crossorigin="anonymous" referrerpolicy="no-referrer" />\n  </head>`,
      );
    },
  };
}

/** 将 react / antd / moment / icons 留在 bundle 外，由 CDN 加载 */
function remoteExternalPlugin(): Plugin {
  const bare = new Set([
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ]);
  return {
    name: 'remote-cdn-external',
    enforce: 'pre',
    resolveId(source) {
      if (bare.has(source)) return { id: source, external: true };
      if (source === 'antd' || source.startsWith('antd/')) return { id: source, external: true };
      if (source === 'moment' || source.startsWith('moment/')) return { id: source, external: true };
      if (source === '@ant-design/icons' || source.startsWith('@ant-design/icons/')) {
        return { id: source, external: true };
      }
      return null;
    },
  };
}

const sharedBuild = {
  target: 'es2020' as const,
  minify: 'esbuild' as const,
  sourcemap: false as const,
  cssMinify: true as const,
  chunkSizeWarningLimit: 1500,
};

/** 仅 `vite build --mode remote`：产物在 server/remote-dist，依赖走 esm.sh CDN */
const isRemoteBuild = (command: string, mode: string) =>
  command === 'build' && mode === 'remote';

export default defineConfig(({ command, mode }) => {
  const remote = isRemoteBuild(command, mode);

  const plugins = [
    ...(remote ? [remoteExternalPlugin(), remoteAntdCssInjectPlugin(V.antd)] : []),
    react(),
    anthropicProxyPlugin(),
    aiChatProxyPlugin(),
  ];

  const alias: Record<string, string> = {
    '@': path.resolve(__dirname, 'src'),
  };
  if (remote) {
    alias['antd/dist/antd.css'] = path.resolve(__dirname, 'src/shims/remote-empty.css');
  }

  return {
    /** 必须顶层配置；静态目录 / 子路径部署时资源用相对路径 */
    base: './',
    plugins,
    resolve: { alias },
    preview: {
      allowedHosts: true,
      port: 4096,
    },
    build: remote
      ? {
          outDir: 'server/remote-dist',
          emptyOutDir: true,
          ...sharedBuild,
          rollupOptions: {
            input: path.resolve(__dirname, 'index.html'),
            output: {
              paths: (id) => cdnPath(id) ?? id,
              manualChunks(id) {
                const m = id.replace(/\\/g, '/');
                if (!m.includes('node_modules')) return;
                return undefined;
              },
            },
          },
        }
      : {
          outDir: 'dist',
          emptyOutDir: true,
          ...sharedBuild,
        },
  };
});
