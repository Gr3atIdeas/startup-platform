#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Installing JS dependencies ---"
npm install

echo "--- Building frontend ---"
npm run build

echo "--- Collecting static files ---"
# Используем Python из виртуального окружения проекта напрямую
/opt/render/project/src/.venv/bin/python manage.py collectstatic --noinput

echo "--- Build successful ---" 