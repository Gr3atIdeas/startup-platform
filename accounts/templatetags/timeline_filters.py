# accounts/templatetags/timeline_filters.py

import re

from django import template

register = template.Library()


@register.filter
def extract_step_number(title):
    """
    Извлекает номер этапа из строки title (например, из "Этап 1" возвращает 1).
    Если формат не соответствует, возвращает 1 по умолчанию.
    """
    match = re.search(r"Этап (\d+)", title)
    if match:
        return int(match.group(1))
    return 1
