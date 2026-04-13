import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import { anthropicProxyPlugin } from './vite/anthropic-proxy-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), anthropicProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['@ant-design/icons'],
  },
  preview: {
    allowedHosts: true,
    port:4096
  },
  build: {
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 80_000,
        manualChunks(id) {
          const m = id.replace(/\\/g, '/');
          if (!m.includes('node_modules')) return;
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
