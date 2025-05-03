from django import template
from django.utils.safestring import mark_safe
import json

register = template.Library()

@register.filter(name='translate_category')
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
        "IT": "ИТ",
        "Retail": "Ритейл"
        # Добавьте другие переводы по мере необходимости
    }
    return translations.get(name, name if name else "Без категории") # Возвращаем перевод или оригинал

@register.simple_tag
def multiply(qty, unit_price, *args, **kwargs):
    # example usage in template: {% multiply value1 value2 %}
    return qty * unit_price 

@register.filter(name='get_file_url')
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
    return '#' # Заглушка

@register.filter(name='jsonify')
def jsonify(data):
    return mark_safe(json.dumps(data))

@register.filter(name='startswith')
def startswith(text, starts):
    if isinstance(text, str):
        return text.startswith(starts)
    return False

@register.filter(name='has_invested')
def has_invested(user, startup):
    # Заглушка - замените на реальную проверку инвестиций пользователя в стартап
    # return Investment.objects.filter(user=user, startup=startup).exists()
    return False # Пример

@register.filter(name='is_buyout_investor')
def is_buyout_investor(user, startup):
    # Заглушка - замените на реальную проверку, является ли пользователь инвестором типа "Выкуп"
    # return Investment.objects.filter(user=user, startup=startup, investment_type='buyout').exists()
    return True # Пример

# Добавляем фильтр get_item
@register.filter(name='get_item')
def get_item(dictionary, key):
    """Позволяет получить значение из словаря по ключу в шаблоне Django."""
    # Проверяем, что dictionary действительно словарь
    if isinstance(dictionary, dict):
        return dictionary.get(key)
    # Возвращаем None или 0, если это не словарь, чтобы избежать ошибки
    return 0 

# --- Добавляем фильтр to_json --- 
@register.filter(is_safe=True, name='to_json')
def to_json(value):
    try:
        # Преобразуем Python-объект (например, словарь) в JSON-строку
        json_string = json.dumps(value)
        # Отмечаем строку как безопасную, чтобы Django не экранировал кавычки
        return mark_safe(json_string)
    except TypeError:
        # В случае ошибки возвращаем пустой JSON-объект или null
        return mark_safe('null')
# --- Конец фильтра to_json --- 