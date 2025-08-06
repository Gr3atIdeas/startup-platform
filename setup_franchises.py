#!/usr/bin/env python
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace.settings')
django.setup()

from django.core.management import execute_from_command_line

def setup_franchises():
    """Настройка франшиз"""
    print("🚀 Начинаем настройку франшиз...")
    
    # Применяем миграции
    print("📦 Применяем миграции...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Копируем данные из стартапов в франшизы
    print("📋 Копируем данные из стартапов в франшизы...")
    execute_from_command_line(['manage.py', 'copy_startups_to_franchises'])
    
    print("✅ Настройка франшиз завершена!")

if __name__ == '__main__':
    setup_franchises() 