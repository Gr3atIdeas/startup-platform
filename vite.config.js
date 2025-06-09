import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: './static/src', // Указываем корень, где лежат исходники фронтенда
  base: '/static/', // Указываем базовый URL для собранных ассетов
  build: {
    outDir: '../dist', // Собираем в static/dist
    manifest: true,
    rollupOptions: {
      input: {
        main: 'js/main.js', // Точка входа относительно root
      },
    },
  },
}) 