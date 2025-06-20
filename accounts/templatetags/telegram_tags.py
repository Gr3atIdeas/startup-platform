from django import template

register = template.Library()

@register.simple_tag(takes_context=True)
def get_telegram_login_url(context):
    """
    Тестовый тег для проверки исполнения кода.
    """
    # Временно возвращаем другую ссылку для проверки
    return "https://www.google.com" 