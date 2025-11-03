import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  build: {
    outDir: '../src/main/resources/static', // Write build ouput to be served by Spring Boot
    sourcemap: false,
  },
  esbuild: {
    keepNames: true,
  },
  plugins: [tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
