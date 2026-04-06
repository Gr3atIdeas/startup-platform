"""Seed the cities table with major Russian cities."""
from django.core.management.base import BaseCommand


CITIES = [
    # (name, region, population, is_major)
    ("Москва", "central", 13100000, True),
    ("Санкт-Петербург", "northwest", 5600000, True),
    ("Новосибирск", "siberia", 1635000, True),
    ("Екатеринбург", "ural", 1544000, True),
    ("Казань", "volga", 1309000, True),
    ("Нижний Новгород", "volga", 1233000, True),
    ("Красноярск", "siberia", 1196000, True),
    ("Челябинск", "ural", 1189000, True),
    ("Самара", "volga", 1173000, True),
    ("Уфа", "volga", 1157000, True),
    ("Ростов-на-Дону", "south", 1142000, True),
    ("Краснодар", "south", 1121000, True),
    ("Омск", "siberia", 1126000, True),
    ("Воронеж", "central", 1058000, True),
    ("Пермь", "volga", 1055000, True),
    ("Волгоград", "south", 1028000, True),
    # Крупные города (не миллионники)
    ("Тюмень", "ural", 847000, False),
    ("Саратов", "volga", 838000, False),
    ("Тольятти", "volga", 693000, False),
    ("Ижевск", "volga", 648000, False),
    ("Барнаул", "siberia", 632000, False),
    ("Иркутск", "siberia", 623000, False),
    ("Ульяновск", "volga", 627000, False),
    ("Хабаровск", "far_east", 617000, False),
    ("Владивосток", "far_east", 606000, False),
    ("Ярославль", "central", 601000, False),
    ("Махачкала", "caucasus", 603000, False),
    ("Томск", "siberia", 576000, False),
    ("Оренбург", "volga", 572000, False),
    ("Кемерово", "siberia", 556000, False),
    ("Новокузнецк", "siberia", 549000, False),
    ("Рязань", "central", 539000, False),
    ("Астрахань", "south", 534000, False),
    ("Набережные Челны", "volga", 533000, False),
    ("Пенза", "volga", 520000, False),
    ("Калининград", "northwest", 513000, False),
    ("Липецк", "central", 508000, False),
    ("Тула", "central", 475000, False),
    ("Киров", "volga", 468000, False),
    ("Чебоксары", "volga", 460000, False),
    ("Сочи", "south", 443000, False),
    ("Курск", "central", 452000, False),
    ("Ставрополь", "caucasus", 450000, False),
    ("Калуга", "central", 340000, False),
    ("Белгород", "central", 391000, False),
    ("Сургут", "ural", 380000, False),
    ("Брянск", "central", 402000, False),
    ("Вологда", "northwest", 312000, False),
    ("Архангельск", "northwest", 348000, False),
    ("Мурманск", "northwest", 287000, False),
]


class Command(BaseCommand):
    help = "Seed cities table with major Russian cities"

    def handle(self, *args, **options):
        from accounts.models import City

        created = 0
        for name, region, population, is_major in CITIES:
            _, was_created = City.objects.get_or_create(
                name=name,
                defaults={
                    "region": region,
                    "population": population,
                    "is_major": is_major,
                },
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Done: {created} cities created, {len(CITIES) - created} already existed"))
