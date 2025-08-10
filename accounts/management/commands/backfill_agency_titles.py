from django.core.management.base import BaseCommand
from accounts.models import Agencies
import random


BRAND_WORDS = [
    "Орбита", "Контур", "Формула", "Импульс", "Фокус", "Сфера", "Пиксель", "Вектор",
    "Графит", "Маяк", "Квант", "Неон", "Синергия", "Ракета", "Комета", "Апекс",
    "Аурора", "Зенит", "Эталон", "Точка", "Поток", "Модуль", "Код", "Логос",
    "Акцент", "Ядро", "Прайм", "Вершина", "Кузница", "Лига", "Авангард", "Ритм",
    "Сигма", "Курс", "Формат", "Пульс", "Статус", "Профиль", "Смысл", "Уровень",
    "Кластер", "Артель", "Облик", "Свет", "Старт", "Меридиан", "Пик", "Восход",
    "Горизонт", "Ключ", "Кедр", "Кристалл", "Периметр", "Практика", "Потенциал",
    "Эффект", "Резонанс"
]

AGENCY_CATEGORIES = [
    "Веб-разработка",
    "Мобильная разработка",
    "Дизайн",
    "Маркетинг",
    "ИИ",
    "Брендинг",
    "Видео и мультимедиа",
]


class Command(BaseCommand):
    help = "Одноразовое заполнение витринных названий и категорий агентств, если отсутствуют"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Не сохранять изменения")

    def handle(self, *args, **options):
        dry = options.get("dry_run", False)
        random.seed()

        existing_lower = set()

        # соберём уже используемые названия
        for ag in Agencies.objects.all().only("customization_data", "title"):
            data = ag.customization_data or {}
            name = (data.get("agency_display_title") or ag.title or "").strip()
            if name:
                existing_lower.add(name.lower())

        def next_name():
            for _ in range(500):
                nm = random.choice(BRAND_WORDS)
                if nm.lower() not in existing_lower:
                    existing_lower.add(nm.lower())
                    return nm
            for n in range(1, 2000):
                base = random.choice(BRAND_WORDS)
                nm = f"{base}{n}"
                if nm.lower() not in existing_lower:
                    existing_lower.add(nm.lower())
                    return nm
            return f"Агентство{random.randint(10000,99999)}"

        updated = 0
        for ag in Agencies.objects.all():
            data = ag.customization_data or {}
            if not isinstance(data, dict):
                data = {}
            need_save = False

            display = (data.get("agency_display_title") or ag.title or "").strip()
            if not display:
                data["agency_display_title"] = next_name()
                need_save = True

            if not data.get("agency_category"):
                data["agency_category"] = random.choice(AGENCY_CATEGORIES)
                need_save = True

            if need_save and not dry:
                ag.customization_data = data
                ag.save(update_fields=["customization_data"])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Updated agencies: {updated}"))


