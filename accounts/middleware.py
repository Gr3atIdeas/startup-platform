from django.http import HttpResponsePermanentRedirect
import json
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)

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
            if (
                request.method == "POST"
                and request.path == self.CALLBACK_PATH
            ):
                content_type = request.META.get("CONTENT_TYPE", "")
                raw_body = request.body or b""
                needs_transform = content_type.startswith("application/json") or (
                    raw_body.startswith(b"{") and raw_body.endswith(b"}")
                )
                if needs_transform:
                    try:
                        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
                    except Exception:
                        payload = {}
                    if isinstance(payload, dict) and ("hash" in payload or "id" in payload or "auth_date" in payload):
                        form_encoded = urlencode({"tgAuthResult": json.dumps(payload, ensure_ascii=False)})
                        request._body = form_encoded.encode("utf-8")
                        request.META["CONTENT_TYPE"] = "application/x-www-form-urlencoded"
                        # Сброс кэша разбора POST, если он вдруг был прочитан ранее
                        if hasattr(request, "_post"):
                            try:
                                del request._post
                                del request._files
                            except Exception:
                                pass
        except Exception as e:
            logger.error(f"Ошибка в TelegramCallbackCompatMiddleware: {str(e)}")
        return self.get_response(request)
