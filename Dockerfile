FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY static/ ./static/
COPY vite.config.js ./

RUN npm run build

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY marketplace/ ./marketplace/
COPY accounts/ ./accounts/
COPY manage.py .
COPY health_check.py .

COPY --from=frontend-builder /app/static/dist ./static/dist/

COPY static/accounts/ ./static/accounts/

RUN chmod +x health_check.py

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python health_check.py

CMD ["sh", "-c", "python manage.py collectstatic --noinput --clear && python -m gunicorn --bind 0.0.0.0:3000 --workers 2 --worker-class sync --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 50 marketplace.wsgi:application"]
