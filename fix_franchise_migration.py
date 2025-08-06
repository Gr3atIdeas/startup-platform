#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection

def check_and_fix_franchise_tables():
    """Проверяет и исправляет состояние таблиц франшиз"""
    print("🔍 Проверяем состояние таблиц франшиз...")
    
    with connection.cursor() as cursor:
        # Проверяем существование таблиц
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'franchises'
            );
        """)
        franchises_exists = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'franchise_categories'
            );
        """)
        categories_exists = cursor.fetchone()[0]
        
        print(f"📊 Таблица franchises: {'✅ Существует' if franchises_exists else '❌ Не существует'}")
        print(f"📊 Таблица franchise_categories: {'✅ Существует' if categories_exists else '❌ Не существует'}")
        
        if franchises_exists and categories_exists:
            print("✅ Все таблицы франшиз существуют!")
            return True
        else:
            print("❌ Некоторые таблицы отсутствуют!")
            return False

def fake_migrations():
    """Помечает миграции как примененные без их выполнения"""
    print("🎭 Помечаем миграции франшиз как примененные...")
    
    try:
        # Помечаем миграцию как примененную
        execute_from_command_line(['manage.py', 'migrate', 'accounts', '0025', '--fake'])
        print("✅ Миграция 0025 помечена как примененная")
        
        execute_from_command_line(['manage.py', 'migrate', 'accounts', '0026', '--fake'])
        print("✅ Миграция 0026 помечена как примененная")
        
        return True
    except Exception as e:
        print(f"❌ Ошибка при помечании миграций: {e}")
        return False

def run_migrations():
    """Запускает миграции"""
    print("🚀 Запускаем миграции...")
    
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Миграции выполнены успешно!")
        return True
    except Exception as e:
        print(f"❌ Ошибка при выполнении миграций: {e}")
        return False

def main():
    print("🔧 Исправление проблем с миграциями франшиз...")
    
    # Проверяем состояние таблиц
    tables_ok = check_and_fix_franchise_tables()
    
    if tables_ok:
        # Если таблицы существуют, помечаем миграции как примененные
        if fake_migrations():
            print("✅ Проблема решена! Таблицы существуют, миграции помечены как примененные.")
        else:
            print("❌ Не удалось пометить миграции как примененные.")
    else:
        # Если таблиц нет, запускаем миграции
        if run_migrations():
            print("✅ Миграции выполнены успешно!")
        else:
            print("❌ Не удалось выполнить миграции.")

if __name__ == '__main__':
    main() 