import hashlib
import json
import logging
from datetime import timedelta

from django.core.cache import cache
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)


def _get_redis():
    """Get raw Redis client from Django cache backend."""
    try:
        return cache._cache.get_client()
    except Exception:
        try:
            return cache.client.get_client()
        except Exception:
            return None


def _get_client_ip(request):
    """Extract client IP, checking X-Forwarded-For first."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def get_visitor_hash(request):
    """Return 'user:{id}' for authenticated users, SHA256(ip+ua) for anonymous."""
    if request.user and request.user.is_authenticated:
        return f"user:{request.user.pk}"
    ip = _get_client_ip(request) or ""
    ua = request.META.get("HTTP_USER_AGENT", "")
    raw = f"{ip}{ua}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def record_page_view(entity_type, entity_id, request):
    """Push a page-view event to Redis list 'analytics:events'."""
    redis_client = _get_redis()
    if redis_client is None:
        logger.warning("Redis unavailable — page view not recorded")
        return

    visitor_hash = get_visitor_hash(request)
    ip = _get_client_ip(request)
    user_id = request.user.pk if request.user and request.user.is_authenticated else None

    event = {
        "type": "page_view",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "user_id": user_id,
        "visitor_hash": visitor_hash,
        "ip_address": ip,
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "referrer": request.META.get("HTTP_REFERER", ""),
        "timestamp": timezone.now().isoformat(),
    }

    try:
        redis_client.rpush("analytics:events", json.dumps(event))
    except Exception:
        logger.exception("Failed to push page_view event to Redis")


def record_click(entity_type, entity_id, button_type, request):
    """Push a click event to Redis list 'analytics:events'."""
    redis_client = _get_redis()
    if redis_client is None:
        logger.warning("Redis unavailable — click not recorded")
        return

    visitor_hash = get_visitor_hash(request)
    ip = _get_client_ip(request)
    user_id = request.user.pk if request.user and request.user.is_authenticated else None

    event = {
        "type": "click",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "button_type": button_type,
        "user_id": user_id,
        "visitor_hash": visitor_hash,
        "ip_address": ip,
        "timestamp": timezone.now().isoformat(),
    }

    try:
        redis_client.rpush("analytics:events", json.dumps(event))
    except Exception:
        logger.exception("Failed to push click event to Redis")


def get_entity_stats(entity_type, entity_id, days=30):
    """Query analytics_daily_stats and return totals + daily breakdown."""
    since = (timezone.now() - timedelta(days=days)).date()

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT stat_date, total_views, unique_views,
                   clicks_contact, clicks_website, clicks_pitch_deck,
                   clicks_telegram, clicks_whatsapp
            FROM analytics_daily_stats
            WHERE entity_type = %s
              AND entity_id = %s
              AND stat_date >= %s
            ORDER BY stat_date
            """,
            [entity_type, entity_id, since],
        )
        rows = cursor.fetchall()

    total_views = 0
    unique_views = 0
    total_clicks = {
        "contact": 0,
        "website": 0,
        "pitch_deck": 0,
        "telegram": 0,
        "whatsapp": 0,
    }
    daily = []

    for row in rows:
        (
            stat_date,
            day_views,
            day_unique,
            c_contact,
            c_website,
            c_pitch_deck,
            c_telegram,
            c_whatsapp,
        ) = row

        total_views += day_views
        unique_views += day_unique
        total_clicks["contact"] += c_contact
        total_clicks["website"] += c_website
        total_clicks["pitch_deck"] += c_pitch_deck
        total_clicks["telegram"] += c_telegram
        total_clicks["whatsapp"] += c_whatsapp

        day_total_clicks = c_contact + c_website + c_pitch_deck + c_telegram + c_whatsapp
        daily.append(
            {
                "date": str(stat_date),
                "views": day_views,
                "unique": day_unique,
                "clicks": day_total_clicks,
            }
        )

    return {
        "total_views": total_views,
        "unique_views": unique_views,
        "total_clicks": total_clicks,
        "daily": daily,
    }
