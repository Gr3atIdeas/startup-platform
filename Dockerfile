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

RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# Download GeoLite2 using Python (no apt-get needed)
RUN mkdir -p /app/geoip && \
    python -c "import urllib.request; urllib.request.urlretrieve('https://github.com/P3TERX/GeoLite.mmdb/releases/latest/download/GeoLite2-City.mmdb', '/app/geoip/GeoLite2-City.mmdb')" \
    || echo "WARNING: GeoLite2 download failed, geo features will be disabled"

COPY marketplace/ ./marketplace/
COPY accounts/ ./accounts/
COPY news_collector/ ./news_collector/
COPY manage.py .
COPY health_check.py .

COPY --from=frontend-builder /app/static/dist ./static/dist/

COPY static/accounts/ ./static/accounts/
COPY sql/ ./sql/
COPY content/ ./content/
COPY entrypoint.sh .

RUN chmod +x health_check.py entrypoint.sh \
    && mkdir -p /app/news_collector/data \
    && useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python health_check.py

ENTRYPOINT ["./entrypoint.sh"]
