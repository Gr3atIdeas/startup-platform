FROM python:3.11-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY requirements.txt .
COPY package.json .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Установка Node.js зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Сборка фронтенда
RUN npm run build

# Создание пользователя для безопасности
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Открытие порта
EXPOSE 3000

# Команда запуска
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput --clear && gunicorn --bind 0.0.0.0:3000 marketplace.wsgi:application"]
