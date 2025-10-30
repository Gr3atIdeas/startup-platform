#!/bin/sh

if [ "$CONTAINER_ROLE" = "worker" ]; then
    echo "Starting Celery worker..."
    exec celery -A marketplace worker --loglevel=info --concurrency=2
else
    echo "Starting web server..."
    python manage.py collectstatic --noinput --clear
    exec python -m gunicorn --bind 0.0.0.0:3000 --workers 4 --timeout 300 --keep-alive 5 --max-requests 1000 --max-requests-jitter 50 marketplace.wsgi:application
fi

