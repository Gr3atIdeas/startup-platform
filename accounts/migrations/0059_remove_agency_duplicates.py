# Generated migration to remove duplicate agencies
from django.db import migrations


def remove_duplicate_agencies(apps, schema_editor):
    """
    Удаляет дубликаты агентств, оставляя только самую новую запись для каждого agency_id.
    Это исправляет проблему MultipleObjectsReturned.
    """
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Находим дубликаты agency_id
        cursor.execute("""
            SELECT agency_id, COUNT(*) as cnt
            FROM agencies
            GROUP BY agency_id
            HAVING COUNT(*) > 1
        """)
        duplicates = cursor.fetchall()
        
        for agency_id, count in duplicates:
            # Оставляем только запись с максимальным ctid (последнюю вставленную)
            # Для PostgreSQL используем ctid как уникальный идентификатор строки
            cursor.execute("""
                DELETE FROM agencies a
                WHERE a.agency_id = %s
                AND a.ctid NOT IN (
                    SELECT MAX(ctid)
                    FROM agencies
                    WHERE agency_id = %s
                )
            """, [agency_id, agency_id])
            print(f"Удалено {cursor.rowcount} дубликатов для agency_id={agency_id}")


def reverse_migration(apps, schema_editor):
    # Невозможно восстановить удаленные дубликаты
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0058_update_telegram_social_app_config'),
    ]

    operations = [
        migrations.RunPython(remove_duplicate_agencies, reverse_migration),
    ]
