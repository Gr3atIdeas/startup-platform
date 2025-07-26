# accounts/templatetags/file_tags.py
from django import template

from accounts.utils import get_file_url, get_file_info, is_uuid
from accounts.models import FileStorage, FileTypes

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


@register.simple_tag
def get_file_original_name(file_id, startup_id, file_type):
    """
    Получает оригинальное имя файла из базы данных или S3.
    """
    if not file_id:
        return ""
    
    # Если file_id — это полный URL (для старых записей), извлекаем имя из URL
    if not is_uuid(file_id):
        return file_id.split('/')[-1] if '/' in file_id else file_id
    
    # Пытаемся получить оригинальное название из базы данных
    try:
        file_type_obj = FileTypes.objects.get(type_name=file_type)
        file_storage = FileStorage.objects.filter(
            startup_id=startup_id,
            file_type=file_type_obj,
            file_url=file_id
        ).first()
        
        if file_storage and file_storage.original_file_name:
            return file_storage.original_file_name
    except FileTypes.DoesNotExist:
        pass
    except Exception:
        pass
    
    # Если не нашли в базе данных, используем старую логику (извлечение из S3)
    file_info = get_file_info(file_id, startup_id, file_type)
    return file_info['original_name'] if file_info else f"{file_type}_{file_id[:8]}"
