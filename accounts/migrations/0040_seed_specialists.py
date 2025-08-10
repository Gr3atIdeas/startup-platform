from django.db import migrations, connection
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

    # Определяем стартовое значение PK (startup_id)
    with connection.cursor() as cursor:
        cursor.execute("SELECT COALESCE(MAX(startup_id), 0) FROM specialists;")
        row = cursor.fetchone()
        next_id = (row[0] or 0) + 1

        for title, category in entries:
            # если уже есть с таким title — пропускаем
            cursor.execute("SELECT 1 FROM specialists WHERE title=%s LIMIT 1;", [title])
            if cursor.fetchone():
                continue

            customization = {
                "specialist_display_title": title,
                "specialist_category": category,
                "successful_projects": 12,
            }
            cursor.execute(
                """
                INSERT INTO specialists (
                    startup_id, title, short_description, description, terms,
                    created_at, updated_at, status, customization_data,
                    total_voters, sum_votes, logo_urls, creatives_urls, proofs_urls, video_urls,
                    planet_image, additional_info
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s::jsonb,
                    %s, %s, %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb,
                    %s, %s
                );
                """,
                [
                    next_id,
                    title,
                    f"Профессионал направления: {category}",
                    f"{title} оказывает услуги в области '{category}'. Опыт более 3 лет.",
                    "Условия сотрудничества оговариваются индивидуально.",
                    now,
                    now,
                    "approved",
                    migrations.serializer.json.dumps(customization),
                    0,
                    0,
                    "[]",
                    "[]",
                    "[]",
                    "[]",
                    None,
                    f"Кейсы и услуги по направлению '{category}'.",
                ],
            )
            next_id += 1


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


