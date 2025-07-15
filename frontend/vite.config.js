import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  build: {
    sourcemap: true
  },
  esbuild: {
    keepNames: true
  },
  plugins: [
    tailwindcss(),
  ],
})