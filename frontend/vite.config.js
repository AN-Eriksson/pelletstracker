import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const backendProxy = {
  target: 'http://localhost:3000',
  changeOrigin: true,
  secure: false,
  // The browser only talks to Vite, so drop its Origin header: otherwise Spring's CORS check rejects
  // any dev address not in CORS_ALLOWED_ORIGINS (another port, or the LAN IP when testing on a phone)
  configure: proxy => {
    proxy.on('proxyReq', proxyReq => proxyReq.removeHeader('origin'));
  },
};

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
    // Fail instead of quietly moving to another port
    strictPort: true,
    proxy: {
      '/api': backendProxy,
      '/auth': backendProxy,
    },
  },
});
