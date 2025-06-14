# accounts/templatetags/file_tags.py
from django import template

from accounts.utils import get_file_url, is_uuid

register = template.Library()


@register.simple_tag
def get_file_url_tag(file_id, startup_id, file_type):
    """
    Генерирует URL для файла. Если file_id — это полный URL (для старых записей), возвращает его.
    Если file_id — это UUID, генерирует URL на основе ID.
    """
    if not file_id:
        return ""
    # Если file_id — это полный URL (для старых записей), возвращаем его
    if not is_uuid(file_id):
        return file_id
    # Иначе генерируем URL на основе ID
    return get_file_url(file_id, startup_id, file_type) or ""
