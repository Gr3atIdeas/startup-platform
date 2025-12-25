# Migration to fix agencies table - ensure PRIMARY KEY constraint exists
from django.db import migrations


def fix_agencies_primary_key(apps, schema_editor):
    """
    Исправляет таблицу agencies:
    1. Удаляет дубликаты
    2. Добавляет PRIMARY KEY constraint если его нет
    """
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Проверяем, есть ли PRIMARY KEY на таблице agencies
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'agencies' AND constraint_type = 'PRIMARY KEY'
        """)
        pk_exists = cursor.fetchone()
        
        if not pk_exists:
            print("PRIMARY KEY не найден на таблице agencies! Исправляем...")
            
            # Сначала удаляем дубликаты, оставляя записи с минимальным ctid
            cursor.execute("""
                DELETE FROM agencies a
                WHERE a.ctid NOT IN (
                    SELECT MIN(ctid)
                    FROM agencies
                    GROUP BY agency_id
                )
            """)
            print(f"Удалено {cursor.rowcount} дубликатов")
            
            # Добавляем PRIMARY KEY constraint
            try:
                cursor.execute("""
                    ALTER TABLE agencies ADD PRIMARY KEY (agency_id)
                """)
                print("PRIMARY KEY добавлен на agency_id")
            except Exception as e:
                print(f"Ошибка добавления PRIMARY KEY: {e}")
                # Возможно уже есть, пробуем другой способ
                try:
                    cursor.execute("""
                        ALTER TABLE agencies ADD CONSTRAINT agencies_pkey PRIMARY KEY (agency_id)
                    """)
                    print("PRIMARY KEY добавлен через CONSTRAINT")
                except Exception as e2:
                    print(f"PRIMARY KEY уже существует или другая ошибка: {e2}")
        else:
            print(f"PRIMARY KEY уже существует: {pk_exists[0]}")
            
            # Всё равно удалим дубликаты если есть
            cursor.execute("""
                DELETE FROM agencies a
                WHERE a.ctid NOT IN (
                    SELECT MIN(ctid)
                    FROM agencies
                    GROUP BY agency_id
                )
            """)
            if cursor.rowcount > 0:
                print(f"Удалено {cursor.rowcount} дубликатов")
        
        # Аналогично для specialists
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'specialists' AND constraint_type = 'PRIMARY KEY'
        """)
        pk_exists = cursor.fetchone()
        
        if not pk_exists:
            print("PRIMARY KEY не найден на таблице specialists! Исправляем...")
            
            cursor.execute("""
                DELETE FROM specialists a
                WHERE a.ctid NOT IN (
                    SELECT MIN(ctid)
                    FROM specialists
                    GROUP BY specialist_id
                )
            """)
            print(f"Удалено {cursor.rowcount} дубликатов specialists")
            
            try:
                cursor.execute("""
                    ALTER TABLE specialists ADD PRIMARY KEY (specialist_id)
                """)
                print("PRIMARY KEY добавлен на specialist_id")
            except Exception as e:
                print(f"PRIMARY KEY для specialists уже существует или ошибка: {e}")
        else:
            cursor.execute("""
                DELETE FROM specialists a
                WHERE a.ctid NOT IN (
                    SELECT MIN(ctid)
                    FROM specialists
                    GROUP BY specialist_id
                )
            """)
            if cursor.rowcount > 0:
                print(f"Удалено {cursor.rowcount} дубликатов specialists")


def reverse_migration(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0059_remove_agency_duplicates'),
    ]

    operations = [
        migrations.RunPython(fix_agencies_primary_key, reverse_migration),
    ]
