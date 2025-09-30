from django import template
from accounts.utils import get_file_url, get_file_info, is_uuid
from accounts.models import FileStorage, FileTypes, EntityTypes
register = template.Library()
@register.simple_tag
def get_file_url_tag(file_id, entity_id, file_type, entity_type: str = "startup"):
    """
    Генерирует URL для файла. Если file_id — это полный URL (для старых записей), возвращает его.
    Если file_id — это UUID, генерирует URL на основе ID.
    Поддерживает обратную совместимость: если entity_type не передан, использует старую логику.
    """
    if not file_id:
        return ""
    if not is_uuid(file_id):
        return file_id
    return get_file_url(file_id, entity_id, file_type, entity_type=entity_type) or ""
@register.simple_tag
def get_file_original_name(file_id, entity_id, file_type, entity_type: str = "startup"):
    """
    Получает оригинальное имя файла из базы данных или S3.
    Поддерживает обратную совместимость: если entity_type не передан или равен "startup", 
    использует старую логику поиска по startup_id.
    """
    if not file_id:
        return ""
    if not is_uuid(file_id):
        return file_id.split('/')[-1] if '/' in file_id else file_id
    
    if hasattr(FileStorage, 'original_file_name'):
        try:
            file_type_obj = FileTypes.objects.get(type_name=file_type)
            
            # Новая логика для не-startup сущностей
            if entity_type != "startup":
                try:
                    entity_type_obj = EntityTypes.objects.get(type_name=entity_type)
                    file_storage = FileStorage.objects.filter(
                        entity_type=entity_type_obj,
                        entity_id=entity_id,
                        file_type=file_type_obj,
                        file_url=file_id
                    ).first()
                    if file_storage and hasattr(file_storage, 'original_file_name') and file_storage.original_file_name:
                        return file_storage.original_file_name
                except EntityTypes.DoesNotExist:
                    pass
                except Exception:
                    pass
            
            # Старая логика для startup (обратная совместимость)
            file_storage = FileStorage.objects.filter(
                startup_id=entity_id,
                file_type=file_type_obj,
                file_url=file_id
            ).first()
            if file_storage and hasattr(file_storage, 'original_file_name') and file_storage.original_file_name:
                return file_storage.original_file_name
                
        except FileTypes.DoesNotExist:
            pass
        except Exception:
            pass
    
    # Fallback на S3
    file_info = get_file_info(file_id, entity_id, file_type, entity_type=entity_type)
    return file_info['original_name'] if file_info else f"{file_type}_{file_id[:8]}"
