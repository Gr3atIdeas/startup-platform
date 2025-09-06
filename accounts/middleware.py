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
            if request.method == "POST" and request.path == self.CALLBACK_PATH:
                # 1) Пробуем прочитать уже распарсенный tgAuthResult
                parsed_value = None
                try:
                    if hasattr(request, "POST"):
                        parsed_value = request.POST.get("tgAuthResult", None)
                        # Приводим строковое "false" к False
                        if isinstance(parsed_value, str) and parsed_value.strip().lower() == "false":
                            parsed_value = False
                        # Если это строка JSON — распарсим для проверки
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
                    # 2) Пробуем достать JSON из тела
                    content_type = request.META.get("CONTENT_TYPE", "")
                    raw_body = request.body or b""
                    body_text = raw_body.decode("utf-8", errors="ignore") if raw_body else ""
                    if content_type.startswith("application/json") or (body_text.strip().startswith("{") and body_text.strip().endswith("}")):
                        try:
                            payload = json.loads(body_text) or {}
                        except Exception:
                            payload = {}

                    # 3) Если JSON не найден/пустой — собираем из плоских POST-полей
                    if not payload:
                        try:
                            qd = request.POST
                            keys = ["id", "first_name", "last_name", "username", "photo_url", "auth_date", "hash"]
                            payload = {k: qd.get(k) for k in keys if k in qd}
                        except Exception:
                            payload = {}

                    # 4) Если нашли ключи Telegram — переформируем запрос под allauth
                    if isinstance(payload, dict) and any(k in payload for k in ("hash", "id", "auth_date")):
                        form_encoded = urlencode({"tgAuthResult": json.dumps(payload, ensure_ascii=False)})
                        request._body = form_encoded.encode("utf-8")
                        request.META["CONTENT_TYPE"] = "application/x-www-form-urlencoded"
                        # Сброс кэша разбора POST, если он был прочитан
                        if hasattr(request, "_post"):
                            try:
                                del request._post
                                del request._files
                            except Exception:
                                pass
        except Exception as e:
            logger.error(f"Ошибка в TelegramCallbackCompatMiddleware: {str(e)}")
        return self.get_response(request)
