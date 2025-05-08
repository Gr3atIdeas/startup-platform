# accounts/templatetags/startup_filters.py
from django import template

# Создаём объект register
register = template.Library()

@register.filter
def get_by_step(timeline, step_number):
    """
    Извлекает описание этапа таймлайна по номеру шага.
    Args:
        timeline: QuerySet объектов StartupTimeline.
        step_number: Номер шага (int).
    Returns:
        Описание этапа или пустая строка, если этап не найден.
    """
    try:
        step = timeline.filter(step_number=int(step_number)).first()
        return step.description if step and step.description else ''
    except (ValueError, AttributeError):
        return ''

@register.filter
def get_item(dictionary, key):
    """
    Возвращает значение из словаря по ключу.
    Args:
        dictionary: Словарь.
        key: Ключ.
    Returns:
        Значение по ключу или пустая строка, если ключ не найден.
    """
    return dictionary.get(key, '')