# Этап 1: Сборка фронтенда
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем Node.js зависимости
RUN npm ci --only=production

# Копируем исходный код фронтенда
COPY static/ ./static/
COPY vite.config.js ./

# Собираем фронтенд
RUN npm run build

# Этап 2: Финальный образ с Python
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY requirements.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код Django
COPY marketplace/ ./marketplace/
COPY accounts/ ./accounts/
COPY manage.py .
COPY health_check.py .

# Копируем собранный фронтенд из первого этапа
COPY --from=frontend-builder /app/static/dist ./static/dist/

# Делаем скрипт проверки здоровья исполняемым
RUN chmod +x health_check.py

# Создаем пользователя для безопасности
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Открываем порт
EXPOSE 3000

# Добавляем health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python health_check.py

# Запускаем Django приложение с улучшенными настройками Gunicorn
CMD ["sh", "-c", "python manage.py collectstatic --noinput --clear && python -m gunicorn --bind 0.0.0.0:3000 --workers 2 --worker-class sync --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 50 marketplace.wsgi:application"]
