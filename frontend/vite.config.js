import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  build: {
    outDir: '../src/main/resources/static', // Write build ouput to be served by Spring Boot
    sourcemap: false,
  },
  esbuild: {
    keepNames: true,
  },
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    // Fail instead of moving to another port: the backend's CORS_ALLOWED_ORIGINS only allows 5173
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
