import json
from django import template
from django.utils.safestring import mark_safe
from allauth.socialaccount.templatetags.socialaccount import provider_login_url as allauth_provider_login_url
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
register = template.Library()
@register.filter(name="translate_category")
def translate_category(name):
    """Переводит английское название категории на русский."""
    translations = {
        "Medicine": "Медицина",
        "Auto": "Автомобили",
        "Delivery": "Доставка",
        "Cafe": "Кафе/рестораны",
        "Fastfood": "Фастфуд",
        "Health": "Здоровье",
        "Beauty": "Красота",
        "Transport": "Транспорт",
        "Sport": "Спорт",
        "Psychology": "Психология",
        "AI": "ИИ",
        "Finance": "Финансы",
        "Healthcare": "Здравоохранение",
        "Technology": "Технологии",
    }
    return translations.get(
        name, name if name else "Без категории"
    )  # Возвращаем перевод или оригинал


@register.simple_tag
def multiply(qty, unit_price, *args, **kwargs):
    # example usage in template: {% multiply value1 value2 %}
    return qty * unit_price


@register.filter(name="get_file_url")
def get_file_url(file_id, entity_id, file_type):
    # Ваша логика получения URL файла
    # Например:
    # file = FileStorage.objects.filter(file_id=file_id, entity_id=entity_id, file_type=file_type).first()
    # if file:
    #     return file.get_absolute_url() # Или другой метод получения URL
    # return '#' # Возвращаем заглушку или обрабатываем ошибку
    # !!! Замените этот комментарий на реальную логику !!!
    # Пока что возвращаем примерный путь для локальной разработки или заглушку
    # return f'/media/{file_type}/{entity_id}/{file_id}'
    return "#"  # Заглушка


@register.filter(name="jsonify")
def jsonify(data):
    return mark_safe(json.dumps(data))


@register.filter(name="startswith")
def startswith(text, starts):
    if isinstance(text, str):
        return text.startswith(starts)
    return False


@register.filter(name="has_invested")
def has_invested(user, startup):
    # Заглушка - замените на реальную проверку инвестиций пользователя в стартап
    # return Investment.objects.filter(user=user, startup=startup).exists()
    return False  # Пример


@register.filter(name="is_buyout_investor")
def is_buyout_investor(user, startup):
    # Заглушка - замените на реальную проверку, является ли пользователь инвестором типа "Выкуп"
    # return Investment.objects.filter(user=user, startup=startup, investment_type='buyout').exists()
    return True  # Пример


# Добавляем фильтр get_item
@register.filter(name="get_item")
def get_item(dictionary, key):
    """Позволяет получить значение из словаря по ключу в шаблоне Django."""
    if isinstance(dictionary, dict):
        return dictionary.get(key)
    return 0
@register.filter(is_safe=True, name="to_json")
def to_json(value):
    try:
        json_string = json.dumps(value)
        return mark_safe(json_string)
    except TypeError:
        return mark_safe("null")
@register.simple_tag(takes_context=True)
def get_telegram_login_url(context):
    """
    Генерирует URL для входа через Telegram, принудительно используя 'www' в домене.
    """
    request = context.get('request')
    if not request:
        return '#'
    original_url = allauth_provider_login_url(context, 'telegram')
    parsed_url = urlparse(original_url)
    query_params = parse_qs(parsed_url.query)
    for param_name in ['origin', 'return_to']:
        if param_name in query_params and query_params[param_name]:
            inner_url_str = query_params[param_name][0]
            if '://greatideas.ru' in inner_url_str:
                new_inner_url = inner_url_str.replace('://greatideas.ru', '://www.greatideas.ru')
                query_params[param_name][0] = new_inner_url
    new_query_string = urlencode(query_params, doseq=True)
    new_url = urlunparse(
        (parsed_url.scheme, parsed_url.netloc, parsed_url.path, parsed_url.params, new_query_string, parsed_url.fragment)
    )
    return new_url
