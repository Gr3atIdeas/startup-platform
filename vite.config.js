import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: './static/src', // Указываем корень, где лежат исходники фронтенда
  build: {
    outDir: '../dist', // Куда Vite будет собирать билд
    manifest: true,
    rollupOptions: {
      input: {
        main: './static/src/js/main.js', // Основной входной файл
      },
    },
  },
  server: {
    port: 3000, // Порт для dev-сервера
    open: false,
  },
}) 