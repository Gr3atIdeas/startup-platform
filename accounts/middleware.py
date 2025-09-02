from django.http import HttpResponsePermanentRedirect
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
