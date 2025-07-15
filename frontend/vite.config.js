import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  build: {
    sourcemap: false
  },
  esbuild: {
    keepNames: true
  },
  plugins: [
    tailwindcss(),
  ],
})