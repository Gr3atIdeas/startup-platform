from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):

    def build_provider_url(self, request, provider, return_url):
        """
        Перехватывает создание URL для входа и принудительно добавляет 'www',
        исправляя параметры 'origin' и 'return_to' для Telegram.
        """
        # Сначала получаем стандартный URL, который сгенерировал бы allauth
        url = super().build_provider_url(request, provider, return_url)

        # В продакшене (когда DEBUG=False) ищем наш домен
        if not settings.DEBUG and 'greatideas.ru' in url:
            
            parsed_url = urlparse(url)
            query_params = parse_qs(parsed_url.query)

            # Проверяем и модифицируем параметры 'origin' и 'return_to'
            for param_name in ['origin', 'return_to']:
                if param_name in query_params and query_params[param_name]:
                    inner_url_str = query_params[param_name][0]
                    if '://greatideas.ru' in inner_url_str:
                        new_inner_url = inner_url_str.replace('://greatideas.ru', '://www.greatideas.ru')
                        query_params[param_name][0] = new_inner_url
            
            # Собираем URL обратно с исправленными параметрами
            new_query_string = urlencode(query_params, doseq=True)
            url = urlunparse(
                (parsed_url.scheme, parsed_url.netloc, parsed_url.path, parsed_url.params, new_query_string, parsed_url.fragment)
            )
            
        return url 