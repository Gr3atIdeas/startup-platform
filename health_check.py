#!/usr/bin/env python
"""
Скрипт для проверки здоровья Django приложения
"""
import os
import sys
import django
from pathlib import Path

# Добавляем путь к проекту
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def check_database():
    """Проверяет подключение к базе данных"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            logger.info("✅ Подключение к базе данных успешно")
            return True
    except Exception as e:
        logger.error(f"❌ Ошибка подключения к базе данных: {str(e)}")
        return False

def check_static_files():
    """Проверяет наличие статических файлов"""
    static_root = Path(settings.STATIC_ROOT)
    if static_root.exists() and any(static_root.iterdir()):
        logger.info("✅ Статические файлы найдены")
        return True
    else:
        logger.warning("⚠️ Статические файлы не найдены")
        return False

def check_environment():
    """Проверяет переменные окружения"""
    required_vars = [
        'DJANGO_SECRET_KEY',
        'DATABASE_URL',
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Отсутствуют переменные окружения: {', '.join(missing_vars)}")
        return False
    else:
        logger.info("✅ Все необходимые переменные окружения установлены")
        return True

def main():
    """Основная функция проверки"""
    logger.info("🔍 Начинаем проверку здоровья приложения...")
    
    checks = [
        check_environment(),
        check_database(),
        check_static_files(),
    ]
    
    if all(checks):
        logger.info("✅ Все проверки пройдены успешно")
        sys.exit(0)
    else:
        logger.error("❌ Некоторые проверки не пройдены")
        sys.exit(1)

if __name__ == '__main__':
    main()
