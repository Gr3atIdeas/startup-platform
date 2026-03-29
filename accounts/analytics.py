import hashlib
import json
import logging
from datetime import timedelta
from urllib.parse import urlparse

from django.core.cache import cache
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Redis helpers
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Referrer source classification
# ---------------------------------------------------------------------------

_SEARCH_DOMAINS = {"google.", "yandex.", "bing.", "duckduckgo.", "yahoo.", "baidu."}
_SOCIAL_DOMAINS = {
    "t.me", "vk.com", "ok.ru", "facebook.", "fb.com",
    "instagram.", "twitter.", "x.com", "youtube.", "tiktok.",
    "linkedin.", "reddit.",
}
_INTERNAL_DOMAINS = {"greatideas.ru", "grtideas.ru", "localhost", "127.0.0.1"}


def classify_referrer_source(referrer):
    """Classify a referrer URL into: direct, search, social, internal, other."""
    if not referrer:
        return "direct"
    try:
        host = urlparse(referrer).hostname or ""
        host = host.lower()
    except Exception:
        return "other"
    if not host:
        return "direct"
    for d in _INTERNAL_DOMAINS:
        if d in host:
            return "internal"
    for d in _SEARCH_DOMAINS:
        if d in host:
            return "search"
    for d in _SOCIAL_DOMAINS:
        if d in host:
            return "social"
    return "other"


# ---------------------------------------------------------------------------
# Event recording (push to Redis)
# ---------------------------------------------------------------------------

def _push_event(event):
    """Push a JSON event to the Redis analytics buffer."""
    redis_client = _get_redis()
    if redis_client is None:
        logger.warning("Redis unavailable — event not recorded: %s", event.get("type"))
        return
    try:
        redis_client.rpush("analytics:events", json.dumps(event))
    except Exception:
        logger.exception("Failed to push %s event to Redis", event.get("type"))


def record_page_view(entity_type, entity_id, request):
    """Push a page-view event."""
    visitor_hash = get_visitor_hash(request)
    _push_event({
        "type": "page_view",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "user_id": request.user.pk if request.user and request.user.is_authenticated else None,
        "visitor_hash": visitor_hash,
        "ip_address": _get_client_ip(request),
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "referrer": request.META.get("HTTP_REFERER", ""),
        "timestamp": timezone.now().isoformat(),
    })


def record_click(entity_type, entity_id, button_type, request):
    """Push a click event."""
    _push_event({
        "type": "click",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "button_type": button_type,
        "user_id": request.user.pk if request.user and request.user.is_authenticated else None,
        "visitor_hash": get_visitor_hash(request),
        "ip_address": _get_client_ip(request),
        "timestamp": timezone.now().isoformat(),
    })


def record_impression(entity_type, entity_id, request):
    """Push a catalog impression event."""
    _push_event({
        "type": "impression",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "visitor_hash": get_visitor_hash(request),
        "ip_address": _get_client_ip(request),
        "timestamp": timezone.now().isoformat(),
    })


def record_engagement(entity_type, entity_id, time_on_page, scroll_depth, request):
    """Push an engagement event (time on page + scroll depth)."""
    _push_event({
        "type": "engagement",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "visitor_hash": get_visitor_hash(request),
        "time_on_page": min(int(time_on_page), 3600),
        "scroll_depth": max(0, min(int(scroll_depth), 100)),
        "timestamp": timezone.now().isoformat(),
    })


# ---------------------------------------------------------------------------
# Stats retrieval for dashboard
# ---------------------------------------------------------------------------

def get_entity_stats(entity_type, entity_id, days=90):
    """Full stats: views, clicks, impressions, engagement, sources, geo, period comparison."""
    since = (timezone.now() - timedelta(days=days)).date()
    today = timezone.now().date()

    with connection.cursor() as cur:
        # ── Aggregated daily stats ──
        cur.execute("""
            SELECT stat_date, total_views, unique_views,
                   clicks_contact, clicks_website, clicks_pitch_deck,
                   clicks_telegram, clicks_whatsapp,
                   impressions, unique_impressions,
                   avg_time_on_page, avg_scroll_depth, engagement_count,
                   source_direct, source_search, source_social,
                   source_internal, source_other
            FROM analytics_daily_stats
            WHERE entity_type = %s AND entity_id = %s AND stat_date >= %s
            ORDER BY stat_date
        """, [entity_type, entity_id, since])
        rows = cur.fetchall()

        # ── Today's real-time page views ──
        cur.execute("""
            SELECT COUNT(*), COUNT(DISTINCT visitor_hash)
            FROM analytics_page_views
            WHERE entity_type = %s AND entity_id = %s AND created_at::date = %s
        """, [entity_type, entity_id, today])
        r = cur.fetchone()
        today_views, today_unique = (r[0] or 0, r[1] or 0)

        # ── Today's real-time clicks ──
        cur.execute("""
            SELECT button_type, COUNT(*)
            FROM analytics_click_events
            WHERE entity_type = %s AND entity_id = %s AND created_at::date = %s
            GROUP BY button_type
        """, [entity_type, entity_id, today])
        today_clicks = {"contact": 0, "website": 0, "pitch_deck": 0, "telegram": 0, "whatsapp": 0}
        for btn_row in cur.fetchall():
            if btn_row[0] in today_clicks:
                today_clicks[btn_row[0]] = btn_row[1]

        # ── Today's real-time impressions ──
        cur.execute("""
            SELECT COUNT(*), COUNT(DISTINCT visitor_hash)
            FROM analytics_catalog_impressions
            WHERE entity_type = %s AND entity_id = %s AND created_at::date = %s
        """, [entity_type, entity_id, today])
        r = cur.fetchone()
        today_impressions, today_unique_impressions = (r[0] or 0, r[1] or 0)

        # ── Today's real-time engagement ──
        cur.execute("""
            SELECT AVG(time_on_page), AVG(scroll_depth), COUNT(*)
            FROM analytics_engagement_events
            WHERE entity_type = %s AND entity_id = %s AND created_at::date = %s
        """, [entity_type, entity_id, today])
        r = cur.fetchone()
        today_avg_time = int(r[0] or 0)
        today_avg_scroll = int(r[1] or 0)
        today_engagement_count = r[2] or 0

        # ── Today's real-time sources ──
        cur.execute("""
            SELECT referrer FROM analytics_page_views
            WHERE entity_type = %s AND entity_id = %s AND created_at::date = %s
        """, [entity_type, entity_id, today])
        today_sources = {"direct": 0, "search": 0, "social": 0, "internal": 0, "other": 0}
        for ref_row in cur.fetchall():
            src = classify_referrer_source(ref_row[0])
            today_sources[src] += 1

        # ── Geography (aggregated) ──
        cur.execute("""
            SELECT country_code, country_name, SUM(view_count)
            FROM analytics_daily_geo
            WHERE entity_type = %s AND entity_id = %s AND stat_date >= %s
            GROUP BY country_code, country_name
            ORDER BY SUM(view_count) DESC
            LIMIT 10
        """, [entity_type, entity_id, since])
        geo_rows = cur.fetchall()

    # ── Build totals ──
    total_views = 0
    unique_views = 0
    total_clicks = {"contact": 0, "website": 0, "pitch_deck": 0, "telegram": 0, "whatsapp": 0}
    total_impressions = 0
    unique_impressions = 0
    total_time_sum = 0
    total_scroll_sum = 0
    total_engagement_count = 0
    sources = {"direct": 0, "search": 0, "social": 0, "internal": 0, "other": 0}
    daily = []
    has_today_aggregated = False

    for row in rows:
        (stat_date, day_views, day_unique,
         c_contact, c_website, c_pitch, c_tg, c_wa,
         day_impr, day_u_impr,
         day_avg_time, day_avg_scroll, day_eng_count,
         s_direct, s_search, s_social, s_internal, s_other) = row

        if stat_date == today:
            has_today_aggregated = True

        total_views += day_views
        unique_views += day_unique
        total_clicks["contact"] += c_contact
        total_clicks["website"] += c_website
        total_clicks["pitch_deck"] += c_pitch
        total_clicks["telegram"] += c_tg
        total_clicks["whatsapp"] += c_wa
        total_impressions += day_impr
        unique_impressions += day_u_impr
        total_time_sum += day_avg_time * day_eng_count
        total_scroll_sum += day_avg_scroll * day_eng_count
        total_engagement_count += day_eng_count
        sources["direct"] += s_direct
        sources["search"] += s_search
        sources["social"] += s_social
        sources["internal"] += s_internal
        sources["other"] += s_other

        day_total_clicks = c_contact + c_website + c_pitch + c_tg + c_wa
        daily.append({
            "date": str(stat_date),
            "views": day_views,
            "unique": day_unique,
            "clicks": day_total_clicks,
            "impressions": day_impr,
        })

    # ── Append today's real-time ──
    if not has_today_aggregated:
        has_any_today = (
            today_views > 0 or any(today_clicks.values())
            or today_impressions > 0 or today_engagement_count > 0
        )
        if has_any_today:
            total_views += today_views
            unique_views += today_unique
            for k, v in today_clicks.items():
                total_clicks[k] += v
            total_impressions += today_impressions
            unique_impressions += today_unique_impressions
            total_time_sum += today_avg_time * today_engagement_count
            total_scroll_sum += today_avg_scroll * today_engagement_count
            total_engagement_count += today_engagement_count
            for k, v in today_sources.items():
                sources[k] += v
            daily.append({
                "date": str(today),
                "views": today_views,
                "unique": today_unique,
                "clicks": sum(today_clicks.values()),
                "impressions": today_impressions,
            })

    # ── Computed metrics ──
    all_clicks = sum(total_clicks.values())
    ctr_views = round(all_clicks / total_views * 100, 1) if total_views > 0 else 0
    ctr_impressions = round(total_views / total_impressions * 100, 1) if total_impressions > 0 else 0
    avg_time = int(total_time_sum / total_engagement_count) if total_engagement_count > 0 else 0
    avg_scroll = int(total_scroll_sum / total_engagement_count) if total_engagement_count > 0 else 0

    # ── Period comparison (last 30d vs previous 30d) ──
    now = timezone.now().date()
    period_current_start = now - timedelta(days=30)
    period_prev_start = now - timedelta(days=60)
    cur_views = prev_views = cur_clicks = prev_clicks = 0
    cur_impressions = prev_impressions = 0

    for row in rows:
        sd = row[0]
        dv = row[1]
        dc = row[3] + row[4] + row[5] + row[6] + row[7]
        di = row[8]
        if sd >= period_current_start:
            cur_views += dv
            cur_clicks += dc
            cur_impressions += di
        elif sd >= period_prev_start:
            prev_views += dv
            prev_clicks += dc
            prev_impressions += di

    # Add today's real-time to current period
    if not has_today_aggregated and today >= period_current_start:
        cur_views += today_views
        cur_clicks += sum(today_clicks.values())
        cur_impressions += today_impressions

    def pct_change(cur, prev):
        if prev == 0:
            return 100 if cur > 0 else 0
        return round((cur - prev) / prev * 100, 1)

    comparison = {
        "views": pct_change(cur_views, prev_views),
        "clicks": pct_change(cur_clicks, prev_clicks),
        "impressions": pct_change(cur_impressions, prev_impressions),
    }

    # ── Geography ──
    geo = [
        {"code": r[0], "name": r[1] or r[0], "count": r[2]}
        for r in geo_rows
    ]

    return {
        "total_views": total_views,
        "unique_views": unique_views,
        "total_clicks": total_clicks,
        "total_impressions": total_impressions,
        "unique_impressions": unique_impressions,
        "ctr_views": ctr_views,
        "ctr_impressions": ctr_impressions,
        "avg_time_on_page": avg_time,
        "avg_scroll_depth": avg_scroll,
        "sources": sources,
        "geo": geo,
        "comparison": comparison,
        "daily": daily,
    }
