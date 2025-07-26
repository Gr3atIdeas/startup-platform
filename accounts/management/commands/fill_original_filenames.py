"""
Management command для заполнения поля original_file_name у существующих файлов
"""

from django.core.management.base import BaseCommand
from django.db import connection
from accounts.models import FileStorage
from accounts.utils import get_file_info


class Command(BaseCommand):
    help = 'Заполняет поле original_file_name для существующих файлов из S3'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Показать что будет сделано, но не применять изменения'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Проверяем, существует ли колонка original_file_name
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='file_storage' AND column_name='original_file_name'"
            )
            if not cursor.fetchone():
                self.stdout.write(
                    self.style.ERROR('Колонка original_file_name не найдена в базе данных. Сначала примените миграцию.')
                )
                return

        # Проверяем, есть ли поле в модели
        if not hasattr(FileStorage, 'original_file_name'):
            self.stdout.write(
                self.style.ERROR('Поле original_file_name отсутствует в модели FileStorage')
            )
            return

        # Получаем все файлы с пустым original_file_name
        try:
            files_to_update = FileStorage.objects.filter(
                original_file_name__isnull=True
            ) | FileStorage.objects.filter(
                original_file_name=""
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Ошибка при запросе файлов: {e}')
            )
            return

        total_files = files_to_update.count()
        self.stdout.write(f'Найдено {total_files} файлов для обновления')

        if total_files == 0:
            self.stdout.write(self.style.SUCCESS('Все файлы уже имеют оригинальные названия'))
            return

        updated_count = 0
        error_count = 0

        for file_storage in files_to_update:
            try:
                # Получаем тип файла
                file_type_name = file_storage.file_type.type_name if file_storage.file_type else 'unknown'
                startup_id = file_storage.startup.startup_id if file_storage.startup else None
                
                if not startup_id:
                    self.stdout.write(
                        self.style.WARNING(f'Файл {file_storage.file_id}: нет связанного стартапа')
                    )
                    continue

                # Получаем информацию о файле из S3
                file_info = get_file_info(file_storage.file_url, startup_id, file_type_name)
                
                if file_info and file_info.get('original_name'):
                    original_name = file_info['original_name']
                    
                    if dry_run:
                        self.stdout.write(
                            f'Файл {file_storage.file_id}: "{file_storage.file_url}" -> "{original_name}"'
                        )
                    else:
                        try:
                            file_storage.original_file_name = original_name
                            file_storage.save(update_fields=['original_file_name'])
                            self.stdout.write(
                                f'Обновлен файл {file_storage.file_id}: "{original_name}"'
                            )
                        except Exception as save_error:
                            # Если поле еще не существует в БД, пропускаем
                            self.stdout.write(
                                self.style.WARNING(f'Не удалось сохранить файл {file_storage.file_id}: {save_error}')
                            )
                            continue
                    
                    updated_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Не удалось получить оригинальное имя для файла {file_storage.file_id}')
                    )
                    error_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Ошибка при обработке файла {file_storage.file_id}: {e}')
                )
                error_count += 1

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'Dry run завершен. Будет обновлено {updated_count} файлов')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Обновлено {updated_count} файлов. Ошибок: {error_count}')
            ) 