#!/bin/sh

if [ "$CONTAINER_ROLE" = "worker" ]; then
    echo "Starting Celery worker..."
    exec celery -A marketplace worker --loglevel=info --concurrency=2
elif [ "$CONTAINER_ROLE" = "websocket" ]; then
    echo "Starting WebSocket server (Daphne/ASGI)..."
    exec python -m uvicorn marketplace.asgi:application \
        --host 0.0.0.0 \
        --port 3001 \
        --workers 2 \
        --log-level info
elif [ "$CONTAINER_ROLE" = "news_collector" ]; then
    echo "Starting news collector..."
    exec python news_collector/main.py
else
    echo "Starting web server..."
    python manage.py collectstatic --noinput --clear

    # Применяем миграции если есть
    python manage.py migrate --noinput || true

    # Исправляем дубликаты в таблице agencies (критически важно!)
    echo "Fixing agencies duplicates..."
    python manage.py fix_agencies_duplicates || true

    # News collector — запускаем в фоне если настроены Telegram-переменные
    if [ -n "$TELEGRAM_API_ID" ] && [ -n "$NEWS_BOT_TOKEN" ]; then
        echo "Starting news collector in background..."
        python news_collector/main.py &
    fi

    exec python -m gunicorn \
        --bind 0.0.0.0:3000 \
        --workers ${GUNICORN_WORKERS:-4} \
        --worker-class gevent \
        --timeout 30 \
        --graceful-timeout 10 \
        --keep-alive 5 \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --access-logfile - \
        --error-logfile - \
        --log-level info \
        marketplace.wsgi:application
fi
