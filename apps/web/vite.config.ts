import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@bethflow/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://api:4000',
        changeOrigin: true,
        xfwd: true, // Forward real client IP via X-Forwarded-For
      },
      '/socket.io': {
        target: 'http://api:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
