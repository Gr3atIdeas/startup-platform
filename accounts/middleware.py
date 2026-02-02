from django.http import HttpResponsePermanentRedirect
import json
import time
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)
perf_logger = logging.getLogger("performance")

class WwwRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            host = request.get_host().partition(':')[0]
            if host == "greatideas.ru":
                return HttpResponsePermanentRedirect("https://www.greatideas.ru" + request.get_full_path())
            return self.get_response(request)
        except Exception as e:
            logger.error(f"Ошибка в WwwRedirectMiddleware: {str(e)}")
            return self.get_response(request)

class SecurityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:

            user_agent = request.META.get('HTTP_USER_AGENT', '')
            if any(suspicious in user_agent.lower() for suspicious in ['bot', 'crawler', 'scanner']):
                logger.warning(f"Подозрительный User-Agent: {user_agent} от IP {request.META.get('REMOTE_ADDR')}")

            return self.get_response(request)
        except Exception as e:
            logger.error(f"Ошибка в SecurityMiddleware: {str(e)}")
            return self.get_response(request)


class TelegramCallbackCompatMiddleware:
    """
    Преобразует JSON-тело Telegram callback в form-urlencoded для совместимости
    с текущей версией django-allauth, которая ожидает поле 'tgAuthResult' в POST.
    Работает только для пути '/accounts/telegram/login/callback/'.
    """

    CALLBACK_PATH = "/accounts/telegram/login/callback/"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            if request.method == "POST" and request.path == self.CALLBACK_PATH:
                parsed_value = None
                try:
                    if hasattr(request, "POST"):
                        parsed_value = request.POST.get("tgAuthResult", None)
                        if isinstance(parsed_value, str) and parsed_value.strip().lower() in ("true", "false"):
                            parsed_value = False
                        if isinstance(parsed_value, bool):
                            parsed_value = False
                        if isinstance(parsed_value, str) and parsed_value and parsed_value.strip().startswith("{"):
                            try:
                                json.loads(parsed_value)
                            except Exception:
                                parsed_value = None
                except Exception:
                    parsed_value = None

                needs_transform = parsed_value in (None, False)

                payload = {}
                if needs_transform:
                    content_type = request.META.get("CONTENT_TYPE", "")
                    raw_body = request.body or b""
                    body_text = raw_body.decode("utf-8", errors="ignore") if raw_body else ""
                    if content_type.startswith("application/json") or (body_text.strip().startswith("{") and body_text.strip().endswith("}")):
                        try:
                            payload = json.loads(body_text) or {}
                        except Exception:
                            payload = {}

                    if not payload:
                        try:
                            qd = request.POST
                            keys = ["id", "first_name", "last_name", "username", "photo_url", "auth_date", "hash"]
                            payload = {k: qd.get(k) for k in keys if k in qd}
                        except Exception:
                            payload = {}

                    if isinstance(payload, dict) and any(k in payload for k in ("hash", "id", "auth_date")):
                        form_encoded = urlencode({"tgAuthResult": json.dumps(payload, ensure_ascii=False)})
                        request._body = form_encoded.encode("utf-8")
                        request.META["CONTENT_TYPE"] = "application/x-www-form-urlencoded"
                        if hasattr(request, "_post"):
                            try:
                                del request._post
                                del request._files
                            except Exception:
                                pass
        except Exception as e:
            logger.error(f"Ошибка в TelegramCallbackCompatMiddleware: {str(e)}")
        return self.get_response(request)


class SlowRequestLoggingMiddleware:
    """
    Логирует запросы, которые выполняются дольше порогового значения.
    Порог: SLOW_REQUEST_THRESHOLD_MS в settings (по умолчанию 500ms).
    """

    def __init__(self, get_response):
        self.get_response = get_response
        from django.conf import settings
        self.threshold_ms = getattr(settings, "SLOW_REQUEST_THRESHOLD_MS", 500)

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000

        if duration_ms >= self.threshold_ms:
            perf_logger.warning(
                "SLOW REQUEST: %s %s — %.0fms (status %s, user=%s)",
                request.method,
                request.get_full_path(),
                duration_ms,
                response.status_code,
                getattr(request.user, "user_id", "anon") if hasattr(request, "user") else "anon",
            )

        # Добавляем Server-Timing header для DevTools
        response["Server-Timing"] = f"total;dur={duration_ms:.1f}"
        return response


class QueryCountLoggingMiddleware:
    """
    Логирует количество SQL-запросов на каждый HTTP-запрос.
    Помогает обнаружить N+1 проблемы в production.
    Работает только при DEBUG=True или QUERY_COUNT_LOGGING=True.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        from django.conf import settings
        self.enabled = getattr(settings, "QUERY_COUNT_LOGGING", False) or settings.DEBUG

    def __call__(self, request):
        if not self.enabled:
            return self.get_response(request)

        from django.db import connection
        initial_queries = len(connection.queries)
        response = self.get_response(request)
        total_queries = len(connection.queries) - initial_queries

        if total_queries > 20:
            perf_logger.warning(
                "HIGH QUERY COUNT: %s %s — %d queries (user=%s)",
                request.method,
                request.get_full_path(),
                total_queries,
                getattr(request.user, "user_id", "anon") if hasattr(request, "user") else "anon",
            )

        return response
