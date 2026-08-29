import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: null,
      // The backend is now the separate Spring Boot app in /backend-java
      // (port 8080) instead of the old Node server that served the
      // frontend and API from one process. The React code still calls
      // relative paths like fetch("/api/auth/login") unchanged, so this
      // proxy forwards those to Spring Boot in dev - no frontend code
      // needed to change.
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
