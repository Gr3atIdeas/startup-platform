# accounts/templatetags/startup_filters.py
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