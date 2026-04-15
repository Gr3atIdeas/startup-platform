FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY static/ ./static/
COPY vite.config.js ./

RUN npm run build

FROM python:3.11-slim

WORKDIR /app

# Install git (for hot-update) + curl (for GeoIP DB) in one layer to save RAM
RUN apt-get update && \
    apt-get install -y --no-install-recommends git curl ca-certificates && \
    mkdir -p /app/geoip && \
    (curl -sSL -o /app/geoip/GeoLite2-City.mmdb \
      "https://github.com/P3TERX/GeoLite.mmdb/releases/latest/download/GeoLite2-City.mmdb" || \
    echo "WARNING: GeoLite2 download failed, geo features will be disabled") && \
    apt-get purge -y curl && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

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
COPY update.sh .

RUN chmod +x health_check.py entrypoint.sh update.sh \
    && mkdir -p /app/news_collector/data \
    && useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python health_check.py

ENTRYPOINT ["./entrypoint.sh"]
