#!/bin/bash
set -e

echo "Starting update..."

# Переход в директорию приложения
cd /app

# Проверяем, есть ли .git папка
if [ ! -d ".git" ]; then
    echo "Git repository not found. Initializing..."
    git init
    git remote add origin https://github.com/Gr3atIdeas/startup-platform.git
fi

# Git pull
echo "Fetching latest changes..."
git fetch origin main
git reset --hard origin/main

# Сбор статики
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Миграции
echo "Running migrations..."
python manage.py migrate --noinput

echo "Update completed successfully!"
echo "Note: You may need to restart the container for some changes to take effect."