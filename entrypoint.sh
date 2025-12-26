#!/bin/sh

if [ "$CONTAINER_ROLE" = "worker" ]; then
    echo "Starting Celery worker..."
    exec celery -A marketplace worker --loglevel=info --concurrency=2
else
    echo "Starting web server..."
    python manage.py collectstatic --noinput --clear
    
    # Применяем миграции если есть
    python manage.py migrate --noinput || true
    
    # Исправляем дубликаты в таблице agencies (критически важно!)
    echo "Fixing agencies duplicates..."
    python manage.py fix_agencies_duplicates || true
    
    exec python -m gunicorn --bind 0.0.0.0:3000 --workers 4 --timeout 300 --keep-alive 5 --max-requests 1000 --max-requests-jitter 50 marketplace.wsgi:application
fi

