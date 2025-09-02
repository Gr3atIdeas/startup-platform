# Используем официальный Python образ
FROM python:3.11-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY requirements.txt .
COPY package.json .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Устанавливаем Node.js зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем фронтенд
RUN npm run build

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
