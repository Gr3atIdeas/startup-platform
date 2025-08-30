# Используем официальный Python образ
FROM python:3.11-slim

# Устанавливаем Node.js
RUN apt-get update && apt-get install -y \
    curl \
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
RUN npm install

# Копируем исходный код
COPY . .

# Собираем фронтенд
RUN npm run build

# Создаем пользователя для безопасности
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Открываем порт
EXPOSE 3000

# Запускаем Django приложение
CMD ["sh", "-c", "python manage.py collectstatic --noinput --clear && python -m gunicorn --bind 0.0.0.0:3000 marketplace.wsgi:application"]
