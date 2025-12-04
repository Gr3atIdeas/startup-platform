#!/bin/bash
set -e

echo "Starting update..."

# Переход в директорию приложения
cd /app

# Git pull (вместо клонирования)
git fetch origin main
git reset --hard origin/main

# Сбор статики
python manage.py collectstatic --noinput

# Миграции
python manage.py migrate --noinput

echo "Update completed successfully!"
