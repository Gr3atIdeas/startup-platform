from django.db import migrations
from django.utils import timezone


def seed_specialists(apps, schema_editor):
    Specialists = apps.get_model("accounts", "Specialists")
    now = timezone.now()
    entries = [
        ("Иван Петров", "Разработка"),
        ("Мария Смирнова", "Дизайн"),
        ("Алексей Иванов", "Маркетинг"),
        ("Анна Кузнецова", "Продажи"),
        ("Дмитрий Соколов", "Аналитика"),
        ("Екатерина Морозова", "Финансы"),
        ("Сергей Волков", "Разработка"),
        ("Ольга Орлова", "Дизайн"),
        ("Павел Новиков", "Маркетинг"),
        ("Наталья Сергеева", "Продажи"),
        ("Андрей Фёдоров", "Аналитика"),
        ("Юлия Павлова", "Финансы"),
    ]

    for title, category in entries:
        if Specialists.objects.filter(title=title).exists():
            continue
        Specialists.objects.create(
            title=title,
            short_description=f"Профессионал направления: {category}",
            description=f"{title} оказывает услуги в области '{category}'. Опыт более 3 лет.",
            terms="Условия сотрудничества оговариваются индивидуально.",
            pitch_deck_url=None,
            created_at=now,
            updated_at=now,
            status="approved",
            customization_data={
                "specialist_display_title": title,
                "specialist_category": category,
                "successful_projects": 12,
            },
            total_voters=0,
            sum_votes=0,
            logo_urls=[],
            creatives_urls=[],
            proofs_urls=[],
            video_urls=[],
            planet_image=None,
            additional_info=f"Кейсы и услуги по направлению '{category}'.",
        )


def unseed_specialists(apps, schema_editor):
    Specialists = apps.get_model("accounts", "Specialists")
    titles = [
        "Иван Петров",
        "Мария Смирнова",
        "Алексей Иванов",
        "Анна Кузнецова",
        "Дмитрий Соколов",
        "Екатерина Морозова",
        "Сергей Волков",
        "Ольга Орлова",
        "Павел Новиков",
        "Наталья Сергеева",
        "Андрей Фёдоров",
        "Юлия Павлова",
    ]
    Specialists.objects.filter(title__in=titles).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0040_add_specialists_additional_info"),
    ]

    operations = [
        migrations.RunPython(seed_specialists, unseed_specialists),
    ]


