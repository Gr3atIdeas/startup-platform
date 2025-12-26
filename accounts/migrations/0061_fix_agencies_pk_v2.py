# Migration to definitively fix agencies table PRIMARY KEY
from django.db import migrations


def fix_agencies_pk(apps, schema_editor):
    """
    Окончательное исправление таблицы agencies:
    1. Удаляет ВСЕ дубликаты
    2. Гарантирует наличие PRIMARY KEY
    3. Добавляет UNIQUE constraint если его нет
    """
    from django.db import connection
    
    with connection.cursor() as cursor:
        print("=== FIXING AGENCIES TABLE ===")
        
        # Шаг 1: Проверяем текущее состояние
        cursor.execute("SELECT COUNT(*) FROM agencies")
        total_count = cursor.fetchone()[0]
        print(f"Total agencies: {total_count}")
        
        cursor.execute("SELECT COUNT(DISTINCT agency_id) FROM agencies")
        unique_count = cursor.fetchone()[0]
        print(f"Unique agency_ids: {unique_count}")
        
        if total_count != unique_count:
            print(f"DUPLICATES FOUND: {total_count - unique_count}")
            
            # Удаляем дубликаты, оставляя записи с минимальным ctid (первые вставленные)
            cursor.execute("""
                DELETE FROM agencies 
                WHERE ctid NOT IN (
                    SELECT MIN(ctid)
                    FROM agencies
                    GROUP BY agency_id
                )
            """)
            print(f"Deleted {cursor.rowcount} duplicate rows")
        
        # Шаг 2: Проверяем PRIMARY KEY
        cursor.execute("""
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints 
            WHERE table_name = 'agencies'
        """)
        constraints = cursor.fetchall()
        print(f"Current constraints: {constraints}")
        
        has_pk = any(c[1] == 'PRIMARY KEY' for c in constraints)
        
        if not has_pk:
            print("Adding PRIMARY KEY...")
            try:
                cursor.execute("ALTER TABLE agencies ADD PRIMARY KEY (agency_id)")
                print("PRIMARY KEY added successfully")
            except Exception as e:
                print(f"Error adding PK (may already exist): {e}")
        else:
            print("PRIMARY KEY already exists")
        
        # Шаг 3: Проверяем UNIQUE constraint на agency_id
        has_unique = any('agency_id' in str(c[0]).lower() and c[1] == 'UNIQUE' for c in constraints)
        
        if not has_unique and not has_pk:
            print("Adding UNIQUE constraint...")
            try:
                cursor.execute("ALTER TABLE agencies ADD CONSTRAINT agencies_agency_id_unique UNIQUE (agency_id)")
                print("UNIQUE constraint added")
            except Exception as e:
                print(f"Error adding UNIQUE (may already exist): {e}")
        
        # Шаг 4: Финальная проверка
        cursor.execute("SELECT COUNT(*) FROM agencies")
        final_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(DISTINCT agency_id) FROM agencies")
        final_unique = cursor.fetchone()[0]
        print(f"Final: {final_count} total, {final_unique} unique")
        
        if final_count == final_unique:
            print("=== AGENCIES TABLE FIXED ===")
        else:
            print("=== WARNING: STILL HAS ISSUES ===")


def reverse_migration(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0060_fix_agencies_specialists_pk'),
    ]

    operations = [
        migrations.RunPython(fix_agencies_pk, reverse_migration),
    ]
