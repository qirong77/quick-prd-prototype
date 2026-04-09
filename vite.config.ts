import react from '@vitejs/plugin-react';
import {
  defineConfig,
  loadEnv,
  type PluginOption,
  type PreviewServer,
  type ViteDevServer,
} from 'vite';
import type { IncomingMessage } from 'http';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'url';
import path from 'path';
import { buildAnthropicUserContent, SYSTEM_PROMPT } from './src/prompts/system';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function attachAnthropicProxy(
  server: ViteDevServer | PreviewServer,
) {
  const { mode, root } = server.config;
  server.middlewares.use('/api/anthropic/messages', async (req, res, next) => {
    if (req.method !== 'POST') {
      next();
      return;
    }
    const env = loadEnv(mode, root, '');
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: '缺少 ANTHROPIC_API_KEY，请在 quick-prd-image/.env 中配置' }));
      return;
    }
    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(req);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    const prdText = typeof body.prdText === 'string' ? body.prdText : '';
    const model =
      typeof body.model === 'string' && body.model.length > 0
        ? body.model
        : env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    const maxTokens =
      typeof body.max_tokens === 'number' && body.max_tokens > 0 ? body.max_tokens : 8192;

    const userContent = buildAnthropicUserContent({ prdText });

    const baseUrl = (env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
    const url = `${baseUrl}/v1/messages`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    res.statusCode = upstream.status;
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      res.end(errText || JSON.stringify({ error: upstream.statusText }));
      return;
    }

    const nodeReadable = Readable.fromWeb(
      upstream.body as import('node:stream/web').ReadableStream,
    );
    nodeReadable.pipe(res);
    nodeReadable.on('error', () => {
      if (!res.writableEnded) res.end();
    });
  });
}

function anthropicProxyPlugin(): PluginOption {
  return {
    name: 'anthropic-proxy',
    configureServer(server: ViteDevServer) {
      attachAnthropicProxy(server);
    },
    configurePreviewServer(server: PreviewServer) {
      attachAnthropicProxy(server);
    },
  };
}

export default defineConfig({
  plugins: [react(), anthropicProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        // @codemirror/language-data 为每种语言单独 dynamic import，会拆成上百个 chunk。
        // 将 CodeMirror / Lezer / Milkdown 生态分别打成少数 vendor 包，显著减少请求数。
        experimentalMinChunkSize: 80_000,
        manualChunks(id) {
          const m = id.replace(/\\/g, '/');
          if (!m.includes('node_modules')) return;
          if (m.includes('@lezer') || m.includes('@codemirror')) return 'codemirror';
          if (m.includes('@milkdown') || m.includes('prosemirror')) return 'milkdown';
          if (m.includes('monaco-editor') || m.includes('@monaco-editor')) return 'monaco';
          if (m.includes('katex')) return 'katex';
          if (m.includes('/antd/') || m.includes('@ant-design') || m.includes('node_modules/rc-')) {
            return 'antd';
          }
          if (m.includes('node_modules/react-dom/')) return 'react';
          if (m.includes('node_modules/react/')) return 'react';
        },
      },
    },
  },
});
