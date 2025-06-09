#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Installing JS dependencies ---"
npm install

echo "--- Building frontend ---"
npm run build

echo "--- PRE-FLIGHT CHECK ---"
# Эта команда заставит Python показать нам, где он ищет модули.
/opt/render/project/src/.venv/bin/python -c "import sys, os; print('--- Python sys.path:'); print(sys.path); print('--- site-packages content:'); os.system('ls -lA /opt/render/project/src/.venv/lib/python3.10/site-packages/')"

echo "--- Collecting static files ---"
/opt/render/project/src/.venv/bin/python manage.py collectstatic --noinput

echo "--- BUILD SCRIPT FINISHED SUCCESSFULLY ---" 