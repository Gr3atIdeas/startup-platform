from django import template

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