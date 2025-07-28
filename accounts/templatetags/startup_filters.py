from django import template
register = template.Library()
@register.filter(name="get_timeline_event_by_step")
def get_timeline_event_by_step(timeline_events, step_number):
    """
    Извлекает объект события таймлайна по номеру шага.
    Args:
        timeline_events: QuerySet или список объектов StartupTimeline.
        step_number: Номер шага (int).
    Returns:
        Объект StartupTimeline или None, если этап не найден.
    """
    try:
        step_number = int(step_number)
        for event in timeline_events:
            if event.step_number == step_number:
                return event
        return None
    except (
        ValueError,
        AttributeError,
        TypeError,
    ):
        return None
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
    return dictionary.get(key, "")
