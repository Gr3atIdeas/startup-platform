#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Installing JS dependencies ---"
npm install

echo "--- Building frontend ---"
npm run build

echo "--- VITE MANIFEST CONTENT ---"
cat static/dist/.vite/manifest.json || echo "Manifest file not found"
echo "--- END VITE MANIFEST CONTENT ---"

echo "--- Collecting static files ---"
# Используем Python из виртуального окружения проекта напрямую
/opt/render/project/src/.venv/bin/python manage.py collectstatic --noinput --clear

echo "--- Build successful ---" 