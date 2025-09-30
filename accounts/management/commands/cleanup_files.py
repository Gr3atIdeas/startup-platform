from django.core.management.base import BaseCommand
from accounts.models import FileStorage, Startups, Franchises, Agencies, Specialists
from django.db.models import Q, Count

class Command(BaseCommand):
    help = 'Очищает мертвые файлы из FileStorage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Показать что будет удалено без фактического удаления',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('Режим dry-run: файлы не будут удалены'))
        
        self.stdout.write('Начинаем очистку мертвых файлов...')
        
        # Очищаем файлы стартапов
        self.cleanup_startup_files(dry_run)
        
        # Очищаем файлы франшиз
        self.cleanup_franchise_files(dry_run)
        
        # Очищаем файлы агентств
        self.cleanup_agency_files(dry_run)
        
        # Очищаем файлы специалистов
        self.cleanup_specialist_files(dry_run)
        
        # Ищем дубликаты
        self.find_duplicates()

    def cleanup_startup_files(self, dry_run):
        self.stdout.write('\n=== Очистка файлов стартапов ===')
        
        startup_files = FileStorage.objects.filter(
            Q(startup__isnull=False) | Q(entity_type__type_name="startup")
        )
        
        dead_files = []
        for file_obj in startup_files:
            is_dead = False
            startup = None
            
            if file_obj.startup:
                # Старый способ - проверяем по startup
                startup = file_obj.startup
                if not Startups.objects.filter(startup_id=startup.startup_id).exists():
                    is_dead = True
            elif file_obj.entity_type and file_obj.entity_type.type_name == "startup":
                # Новый способ - проверяем по entity_id
                try:
                    startup = Startups.objects.get(startup_id=file_obj.entity_id)
                except Startups.DoesNotExist:
                    is_dead = True
            
            # Дополнительная проверка: файл есть в FileStorage, но нет в proofs_urls стартапа
            if startup and not is_dead:
                proofs_urls = startup.proofs_urls or []
                if file_obj.file_url not in proofs_urls:
                    is_dead = True
            
            if is_dead:
                dead_files.append(file_obj)
        
        self.stdout.write(f'Найдено {len(dead_files)} мертвых файлов стартапов')
        
        for file_obj in dead_files:
            self.stdout.write(f'  {"Удаляем" if not dry_run else "Будет удален"}: {file_obj.file_url} (startup_id: {file_obj.startup.startup_id if file_obj.startup else file_obj.entity_id})')
            if not dry_run:
                file_obj.delete()

    def cleanup_franchise_files(self, dry_run):
        self.stdout.write('\n=== Очистка файлов франшиз ===')
        
        franchise_files = FileStorage.objects.filter(entity_type__type_name="franchise")
        dead_files = []
        
        for file_obj in franchise_files:
            if not Franchises.objects.filter(franchise_id=file_obj.entity_id).exists():
                dead_files.append(file_obj)
        
        self.stdout.write(f'Найдено {len(dead_files)} мертвых файлов франшиз')
        
        for file_obj in dead_files:
            self.stdout.write(f'  {"Удаляем" if not dry_run else "Будет удален"}: {file_obj.file_url} (franchise_id: {file_obj.entity_id})')
            if not dry_run:
                file_obj.delete()

    def cleanup_agency_files(self, dry_run):
        self.stdout.write('\n=== Очистка файлов агентств ===')
        
        agency_files = FileStorage.objects.filter(entity_type__type_name="agency")
        dead_files = []
        
        for file_obj in agency_files:
            if not Agencies.objects.filter(agency_id=file_obj.entity_id).exists():
                dead_files.append(file_obj)
        
        self.stdout.write(f'Найдено {len(dead_files)} мертвых файлов агентств')
        
        for file_obj in dead_files:
            self.stdout.write(f'  {"Удаляем" if not dry_run else "Будет удален"}: {file_obj.file_url} (agency_id: {file_obj.entity_id})')
            if not dry_run:
                file_obj.delete()

    def cleanup_specialist_files(self, dry_run):
        self.stdout.write('\n=== Очистка файлов специалистов ===')
        
        specialist_files = FileStorage.objects.filter(entity_type__type_name="specialist")
        dead_files = []
        
        for file_obj in specialist_files:
            if not Specialists.objects.filter(specialist_id=file_obj.entity_id).exists():
                dead_files.append(file_obj)
        
        self.stdout.write(f'Найдено {len(dead_files)} мертвых файлов специалистов')
        
        for file_obj in dead_files:
            self.stdout.write(f'  {"Удаляем" if not dry_run else "Будет удален"}: {file_obj.file_url} (specialist_id: {file_obj.entity_id})')
            if not dry_run:
                file_obj.delete()

    def find_duplicates(self):
        self.stdout.write('\n=== Поиск дублированных файлов ===')
        
        duplicates = FileStorage.objects.values('file_url').annotate(
            count=Count('file_url')
        ).filter(count__gt=1)
        
        self.stdout.write(f'Найдено {len(duplicates)} дублированных file_url')
        
        for dup in duplicates:
            files = FileStorage.objects.filter(file_url=dup['file_url'])
            self.stdout.write(f'\nДубликаты для file_url: {dup["file_url"]}')
            for file_obj in files:
                self.stdout.write(f'  ID: {file_obj.file_id}, startup: {file_obj.startup}, entity_type: {file_obj.entity_type}, entity_id: {file_obj.entity_id}')
