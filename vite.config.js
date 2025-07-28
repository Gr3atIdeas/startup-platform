import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
export default defineConfig({
  plugins: [vue()],
  base: '/static/',
  build: {
    outDir: './static/dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: [
        './static/src/js/moderator_main.js',
      ],
      output: {
      },
    },
  },
})
