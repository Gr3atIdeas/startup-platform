import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Не указываем `root`, поэтому Vite будет работать из корня проекта.
  base: '/static/', // Базовый URL для ассетов остается прежним.

  build: {
    // Путь для собранных файлов, относительно корня проекта.
    outDir: './static/dist',
    // Очищать папку `dist` перед каждой сборкой.
    emptyOutDir: true,
    // Манифест для интеграции с Django.
    manifest: true,
    rollupOptions: {
      // Указываем полный путь к входному файлу, относительно корня проекта.
      input: {
        main: './static/src/js/main.js',
      },
    },
  },
}) 