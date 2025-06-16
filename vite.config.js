import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

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
      // Указываем входной файл в виде массива, чтобы ключ в манифесте совпадал с путем.
      input: [
        './static/src/js/moderator_main.js',
      ],
      output: {
        // ... existing code ...
      },
    },
  },
}) 