# Используем готовый образ с Python 3.11 и Node.js 18
FROM nikolaik/python-nodejs:python3.11-nodejs18

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей (кэшируем слои)
COPY requirements.txt .
COPY package*.json ./

# Установка зависимостей (кэшируем слои)
RUN pip install --no-cache-dir -r requirements.txt && \
    npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка фронтенда
RUN npm run build

# Открытие порта
EXPOSE 3000

# Команда запуска
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput --clear && gunicorn --bind 0.0.0.0:3000 marketplace.wsgi:application"]
