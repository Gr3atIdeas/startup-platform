#!/bin/bash
set -e

echo "=== Starting update ==="

cd /app

# Проверяем, есть ли .git папка
if [ ! -d ".git" ]; then
    echo "Git repository not found. Initializing (one-time setup)..."
    git init -q
    git remote add origin https://github.com/Gr3atIdeas/startup-platform.git
    echo "First run - will download full repository..."
fi

# Скачиваем только изменения (--depth=1 для минимального объёма)
echo "Fetching changes..."
git fetch --depth=1 origin main -q

# Применяем изменения
echo "Applying changes..."
git reset --hard origin/main -q

# Сбор статики (только изменённые файлы благодаря кэшу Django)
echo "Collecting static files..."
python manage.py collectstatic --noinput -v 0

# Миграции
echo "Running migrations..."
python manage.py migrate --noinput

echo "=== Update completed! ==="
echo ""
echo "NOTE: Python code changes require Gunicorn restart."
echo "Run: pkill -HUP gunicorn"