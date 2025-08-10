from django.db import migrations


def update_specialist_categories(apps, schema_editor):
    Specialists = apps.get_model("accounts", "Specialists")
    title_to_category = {
        "Иван Петров": "Веб-разработка",
        "Мария Смирнова": "Мобильная разработка",
        "Алексей Иванов": "Дизайн",
        "Анна Кузнецова": "Маркетинг",
        "Дмитрий Соколов": "ИИ",
        "Екатерина Морозова": "Брендинг",
        "Сергей Волков": "Видео и мультимедиа",
        "Ольга Орлова": "Веб-разработка",
        "Павел Новиков": "Мобильная разработка",
        "Наталья Сергеева": "Дизайн",
        "Андрей Фёдоров": "Маркетинг",
        "Юлия Павлова": "ИИ",
    }
    for title, category in title_to_category.items():
        for s in Specialists.objects.filter(title=title):
            data = s.customization_data or {}
            if data.get("specialist_category") != category:
                data["specialist_category"] = category
                s.customization_data = data
                s.save(update_fields=["customization_data"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0045_state_sync_specialists"),
    ]

    operations = [
        migrations.RunPython(update_specialist_categories, noop_reverse),
    ]


