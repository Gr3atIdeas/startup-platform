"""
Команда для исправления дубликатов в таблице agencies и добавления PRIMARY KEY.
Запуск: python manage.py fix_agencies_duplicates
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Удаляет дубликаты агентств и добавляет PRIMARY KEY на таблицу agencies'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            self.stdout.write("=== FIXING AGENCIES TABLE ===")
            
            # Шаг 1: Проверяем текущее состояние
            cursor.execute("SELECT COUNT(*) FROM agencies")
            total_count = cursor.fetchone()[0]
            self.stdout.write(f"Total agencies: {total_count}")
            
            cursor.execute("SELECT COUNT(DISTINCT agency_id) FROM agencies")
            unique_count = cursor.fetchone()[0]
            self.stdout.write(f"Unique agency_ids: {unique_count}")
            
            if total_count != unique_count:
                duplicates = total_count - unique_count
                self.stdout.write(self.style.WARNING(f"DUPLICATES FOUND: {duplicates}"))
                
                # Показываем какие дубликаты есть
                cursor.execute("""
                    SELECT agency_id, title, COUNT(*) as cnt 
                    FROM agencies 
                    GROUP BY agency_id, title 
                    HAVING COUNT(*) > 1
                """)
                for row in cursor.fetchall():
                    self.stdout.write(f"  Duplicate: agency_id={row[0]}, title={row[1]}, count={row[2]}")
                
                # Удаляем дубликаты, оставляя записи с минимальным ctid (первые вставленные)
                cursor.execute("""
                    DELETE FROM agencies 
                    WHERE ctid NOT IN (
                        SELECT MIN(ctid)
                        FROM agencies
                        GROUP BY agency_id
                    )
                """)
                self.stdout.write(self.style.SUCCESS(f"Deleted {cursor.rowcount} duplicate rows"))
            else:
                self.stdout.write(self.style.SUCCESS("No duplicates found"))
            
            # Шаг 2: Проверяем PRIMARY KEY
            cursor.execute("""
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints 
                WHERE table_name = 'agencies'
            """)
            constraints = cursor.fetchall()
            self.stdout.write(f"Current constraints: {constraints}")
            
            has_pk = any(c[1] == 'PRIMARY KEY' for c in constraints)
            
            if not has_pk:
                self.stdout.write("Adding PRIMARY KEY...")
                try:
                    cursor.execute("ALTER TABLE agencies ADD PRIMARY KEY (agency_id)")
                    self.stdout.write(self.style.SUCCESS("PRIMARY KEY added successfully"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error adding PK: {e}"))
            else:
                self.stdout.write(self.style.SUCCESS("PRIMARY KEY already exists"))
            
            # Шаг 3: ВАЖНО! Сбрасываем sequence на правильное значение
            self.stdout.write("Resetting sequence...")
            try:
                # Получаем максимальный agency_id
                cursor.execute("SELECT COALESCE(MAX(agency_id), 0) FROM agencies")
                max_id = cursor.fetchone()[0]
                self.stdout.write(f"Max agency_id: {max_id}")
                
                # Пробуем найти реальное имя sequence для колонки agency_id
                cursor.execute("""
                    SELECT pg_get_serial_sequence('agencies', 'agency_id')
                """)
                seq_name = cursor.fetchone()[0]
                
                if seq_name:
                    self.stdout.write(f"Found sequence: {seq_name}")
                    cursor.execute(f"SELECT setval('{seq_name}', %s, true)", [max_id])
                    new_val = cursor.fetchone()[0]
                    self.stdout.write(self.style.SUCCESS(f"Sequence reset to: {new_val}"))
                else:
                    # Sequence не найден - создаём его и привязываем к колонке
                    self.stdout.write(self.style.WARNING("No sequence found, creating one..."))
                    
                    # Создаём sequence
                    cursor.execute(f"""
                        CREATE SEQUENCE IF NOT EXISTS agencies_agency_id_seq
                        START WITH {max_id + 1}
                        OWNED BY agencies.agency_id
                    """)
                    
                    # Устанавливаем default для колонки
                    cursor.execute("""
                        ALTER TABLE agencies 
                        ALTER COLUMN agency_id 
                        SET DEFAULT nextval('agencies_agency_id_seq')
                    """)
                    
                    # Сбрасываем sequence на правильное значение
                    cursor.execute(f"SELECT setval('agencies_agency_id_seq', %s, true)", [max_id])
                    new_val = cursor.fetchone()[0]
                    self.stdout.write(self.style.SUCCESS(f"Created and set sequence to: {new_val}"))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error resetting sequence: {e}"))
            
            # Шаг 4: Финальная проверка
            cursor.execute("SELECT COUNT(*) FROM agencies")
            final_count = cursor.fetchone()[0]
            self.stdout.write(f"Final agency count: {final_count}")
            
            cursor.execute("""
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints 
                WHERE table_name = 'agencies'
            """)
            final_constraints = cursor.fetchall()
            self.stdout.write(f"Final constraints: {final_constraints}")
            
            self.stdout.write(self.style.SUCCESS("=== DONE ==="))
