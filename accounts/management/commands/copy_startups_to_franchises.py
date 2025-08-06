from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import Startups, Franchises, FranchiseCategories, Directions
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Копирует данные из стартапов в франшизы'

    def handle(self, *args, **options):
        self.stdout.write('Начинаем копирование данных из стартапов в франшизы...')
        
        # Создаем категории франшиз на основе направлений стартапов
        self.create_franchise_categories()
        
        # Копируем стартапы в франшизы
        self.copy_startups_to_franchises()
        
        self.stdout.write(self.style.SUCCESS('Копирование завершено!'))

    def create_franchise_categories(self):
        """Создает категории франшиз на основе направлений стартапов"""
        self.stdout.write('Создаем категории франшиз...')
        
        # Получаем все направления стартапов
        directions = Directions.objects.all()
        
        # Создаем категории франшиз
        franchise_categories = [
            "Рестораны и кафе",
            "Розничная торговля", 
            "Услуги",
            "Производство",
            "Образование",
            "Здоровье и красота",
            "Автомобильный бизнес",
            "Недвижимость",
            "Интернет и IT",
            "Спорт и фитнес",
            "Детские товары и услуги",
            "Туризм и гостиничный бизнес",
            "Строительство и ремонт",
            "Транспорт и логистика",
            "Финансовые услуги",
            "Развлечения",
            "Сельское хозяйство",
            "Экология",
            "Медицина",
            "Юридические услуги"
        ]
        
        created_count = 0
        for category_name in franchise_categories:
            category, created = FranchiseCategories.objects.get_or_create(
                category_name=category_name
            )
            if created:
                created_count += 1
                self.stdout.write(f'Создана категория: {category_name}')
        
        self.stdout.write(f'Создано {created_count} новых категорий франшиз')

    def copy_startups_to_franchises(self):
        """Копирует данные из стартапов в франшизы"""
        self.stdout.write('Копируем стартапы в франшизы...')
        
        # Получаем все одобренные стартапы
        startups = Startups.objects.filter(status='approved')
        
        copied_count = 0
        skipped_count = 0
        
        for startup in startups:
            # Проверяем, существует ли уже франшиза с таким названием
            existing_franchise = Franchises.objects.filter(title=startup.title).first()
            
            if existing_franchise:
                self.stdout.write(f'Франшиза "{startup.title}" уже существует, пропускаем')
                skipped_count += 1
                continue
            
            # Определяем категорию франшизы на основе направления стартапа
            franchise_category = self.map_direction_to_franchise_category(startup.direction)
            
            # Создаем франшизу
            franchise = Franchises.objects.create(
                owner=startup.owner,
                title=startup.title,
                short_description=startup.short_description,
                description=startup.description,
                terms=startup.terms,
                category=franchise_category,
                investment_amount=startup.funding_goal or 0,
                payback_period=12,  # По умолчанию 12 месяцев
                own_businesses_count=1,  # По умолчанию 1 собственное предприятие
                franchise_businesses_count=0,  # По умолчанию 0 франшизных предприятий
                valuation=startup.valuation,
                pitch_deck_url=startup.pitch_deck_url,
                created_at=startup.created_at or timezone.now(),
                updated_at=startup.updated_at or timezone.now(),
                status='approved',
                total_voters=startup.total_voters,
                sum_votes=startup.sum_votes,
                is_edited=startup.is_edited,
                moderator_comment=startup.moderator_comment,
                step_number=startup.step_number,
                logo_urls=startup.logo_urls,
                creatives_urls=startup.creatives_urls,
                proofs_urls=startup.proofs_urls,
                video_urls=startup.video_urls,
                planet_image=startup.planet_image
            )
            
            copied_count += 1
            self.stdout.write(f'Скопирована франшиза: {startup.title}')
        
        self.stdout.write(f'Скопировано {copied_count} франшиз')
        self.stdout.write(f'Пропущено {skipped_count} франшиз (уже существуют)')

    def map_direction_to_franchise_category(self, direction):
        """Сопоставляет направление стартапа с категорией франшизы"""
        if not direction:
            return None
        
        direction_name = direction.direction_name.lower()
        
        # Сопоставление направлений с категориями франшиз
        mapping = {
            'еда': 'Рестораны и кафе',
            'ресторан': 'Рестораны и кафе',
            'кафе': 'Рестораны и кафе',
            'торговля': 'Розничная торговля',
            'магазин': 'Розничная торговля',
            'услуги': 'Услуги',
            'производство': 'Производство',
            'образование': 'Образование',
            'красота': 'Здоровье и красота',
            'здоровье': 'Здоровье и красота',
            'авто': 'Автомобильный бизнес',
            'автомобиль': 'Автомобильный бизнес',
            'недвижимость': 'Недвижимость',
            'интернет': 'Интернет и IT',
            'it': 'Интернет и IT',
            'спорт': 'Спорт и фитнес',
            'фитнес': 'Спорт и фитнес',
            'дети': 'Детские товары и услуги',
            'детский': 'Детские товары и услуги',
            'туризм': 'Туризм и гостиничный бизнес',
            'строительство': 'Строительство и ремонт',
            'ремонт': 'Строительство и ремонт',
            'транспорт': 'Транспорт и логистика',
            'логистика': 'Транспорт и логистика',
            'финансы': 'Финансовые услуги',
            'развлечения': 'Развлечения',
            'сельское хозяйство': 'Сельское хозяйство',
            'экология': 'Экология',
            'медицина': 'Медицина',
            'юридические': 'Юридические услуги'
        }
        
        # Ищем совпадение в названии направления
        for key, category_name in mapping.items():
            if key in direction_name:
                try:
                    return FranchiseCategories.objects.get(category_name=category_name)
                except FranchiseCategories.DoesNotExist:
                    pass
        
        # Если не найдено совпадение, возвращаем первую категорию
        try:
            return FranchiseCategories.objects.first()
        except FranchiseCategories.DoesNotExist:
            return None 