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

# Устанавливаем новые зависимости ПЕРЕД миграциями
echo "Installing Python dependencies..."
pip install -q -r requirements.txt 2>/dev/null || true

# Сбор статики
echo "Collecting static files..."
python manage.py collectstatic --noinput -v 0

# Django миграции
echo "Running Django migrations..."
python manage.py migrate --noinput

# SQL-миграции (идемпотентные)
if [ -d "sql" ] && [ -n "$DATABASE_URL" ]; then
    echo "Applying SQL migrations..."
    for sqlfile in sql/*.sql; do
        [ -f "$sqlfile" ] || continue
        echo "  Running $sqlfile..."
        python -c "
import dj_database_url, psycopg2, os
db = dj_database_url.parse(os.environ['DATABASE_URL'])
conn = psycopg2.connect(dbname=db['NAME'], user=db['USER'], password=db['PASSWORD'], host=db['HOST'], port=db['PORT'])
conn.autocommit = True
with open('$sqlfile') as f:
    conn.cursor().execute(f.read())
conn.close()
print('    OK')
" || echo "    WARNING: $sqlfile failed (may already be applied)"
    done
fi

echo "=== Update completed! ==="
echo ""
echo "NOTE: Python code changes require Gunicorn restart."
echo "Run: pkill -HUP gunicorn"
