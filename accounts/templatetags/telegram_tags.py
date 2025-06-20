from django import template
from allauth.socialaccount.templatetags.socialaccount import provider_login_url as allauth_provider_login_url
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

register = template.Library()

@register.simple_tag(takes_context=True)
def get_telegram_login_url(context):
    """
    Генерирует URL для входа через Telegram, принудительно используя 'www' в домене.
    """
    request = context.get('request')
    if not request:
        return '#'

    # Получаем стандартный URL от allauth
    original_url = allauth_provider_login_url(context, 'telegram')

    # Разбираем URL на компоненты
    parsed_url = urlparse(original_url)
    query_params = parse_qs(parsed_url.query)

    # Проверяем и модифицируем параметры 'origin' и 'return_to'
    for param_name in ['origin', 'return_to']:
        if param_name in query_params and query_params[param_name]:
            # query_params[param_name] - это список, берем первый элемент
            inner_url_str = query_params[param_name][0]
            
            # Заменяем домен, если он не содержит 'www'
            if '://greatideas.ru' in inner_url_str:
                new_inner_url = inner_url_str.replace('://greatideas.ru', '://www.greatideas.ru')
                query_params[param_name][0] = new_inner_url

    # Собираем URL обратно с обновленными параметрами
    new_query_string = urlencode(query_params, doseq=True)
    new_url = urlunparse(
        (parsed_url.scheme, parsed_url.netloc, parsed_url.path, parsed_url.params, new_query_string, parsed_url.fragment)
    )

    return new_url 