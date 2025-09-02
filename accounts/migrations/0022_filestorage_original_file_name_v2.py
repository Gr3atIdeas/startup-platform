
from django.db import migrations, models
from django.db import connection


def check_column_exists(apps, schema_editor):
    """Проверяем, существует ли уже колонка"""
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='file_storage' AND column_name='original_file_name'"
        )
        return cursor.fetchone() is not None


def add_column_if_not_exists(apps, schema_editor):
    """Добавляем колонку только если её нет"""
    if not check_column_exists(apps, schema_editor):
        with connection.cursor() as cursor:
            cursor.execute(
                "ALTER TABLE file_storage ADD COLUMN original_file_name VARCHAR(255)"
            )


def remove_column_if_exists(apps, schema_editor):
    """Удаляем колонку только если она есть"""
    if check_column_exists(apps, schema_editor):
        with connection.cursor() as cursor:
            cursor.execute(
                "ALTER TABLE file_storage DROP COLUMN original_file_name"
            )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0021_add_original_file_name_to_file_storage'),
    ]

    operations = [
        migrations.RunPython(
            add_column_if_not_exists,
            remove_column_if_exists
        ),
    ]