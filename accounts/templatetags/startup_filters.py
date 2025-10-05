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

@register.filter
def translate_category(category_name):
    """Переводит название категории на русский язык"""
    if not category_name:
        return "Без категории"
    
    category_mapping = {
        'Technology': 'Технологии',
        'Healthcare': 'Здравоохранение',
        'Finance': 'Финансы',
        'Education': 'Образование',
        'E-commerce': 'Электронная коммерция',
        'Real Estate': 'Недвижимость',
        'Transportation': 'Транспорт',
        'Entertainment': 'Развлечения',
        'Food & Beverage': 'Еда и напитки',
        'Fashion': 'Мода',
        'Sports': 'Спорт',
        'Travel': 'Путешествия',
        'Media': 'Медиа',
        'Manufacturing': 'Производство',
        'Agriculture': 'Сельское хозяйство',
        'Energy': 'Энергетика',
        'Environment': 'Экология',
        'Social': 'Социальные проекты',
        'Other': 'Другое'
    }
    
    return category_mapping.get(category_name, category_name)

@register.filter
def translate_stage(stage_name):
    """Переводит название стадии стартапа на русский язык"""
    if not stage_name:
        return "Не указана"
    
    stage_mapping = {
        'idea': 'Идея',
        'MVP': 'Разработка продукта', 
        'Growth': 'Развивающийся стартап'
    }
    
    return stage_mapping.get(stage_name, stage_name)