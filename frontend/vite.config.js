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

// GitHub login (Spring's oauth2Login). Host kept as localhost:5173, since Spring builds the callback URL
// sent to GitHub from it, and the dev OAuth app on GitHub is registered for http://localhost:5173
const oauthProxy = { ...backendProxy, changeOrigin: false };

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
      '/oauth2': oauthProxy,
      '/login/oauth2': oauthProxy,
    },
  },
});
