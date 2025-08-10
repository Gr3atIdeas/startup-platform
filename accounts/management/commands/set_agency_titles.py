from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import Agencies

DEFAULT_NAMES = [
    "Контур",
    "Фокус",
    "Орбита",
    "Импульс",
    "Синергия",
    "Ракета",
    "Вектор",
    "Пиксель",
    "Квант",
    "Маяк",
    "Авангард",
    "Резонанс",
    "Горизонт",
    "Зенит",
    "Прайм",
    "Эталон",
    "Меридиан",
    "Кластер",
]


class Command(BaseCommand):
    help = "Устанавливает витринные названия (agency_display_title) для агентств"

    def add_arguments(self, parser):
        parser.add_argument(
            "--names",
            type=str,
            help=(
                "Список названий через запятую. Если не указан, используем --use-defaults."
            ),
        )
        parser.add_argument(
            "--use-defaults",
            action="store_true",
            help="Использовать встроенный список из 18 названий",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=18,
            help="Максимальное число агентств для установки названий",
        )
        parser.add_argument(
            "--only-approved",
            action="store_true",
            default=True,
            help="Обновлять только одобренные (status=approved)",
        )
        parser.add_argument("--dry-run", action="store_true", help="Показать изменения без записи")

    def handle(self, *args, **options):
        raw_names = options.get("names")
        use_defaults = options.get("use_defaults")
        limit = options.get("limit")
        only_approved = options.get("only_approved")
        dry_run = options.get("dry_run")

        if raw_names:
            names = [n.strip() for n in raw_names.split(",") if n.strip()]
        elif use_defaults:
            names = list(DEFAULT_NAMES)
        else:
            self.stderr.write(
                "Не указаны названия (--names) и не задан флаг --use-defaults"
            )
            return

        if not names:
            self.stderr.write("Пустой список названий")
            return

        qs = Agencies.objects.all()
        if only_approved:
            qs = qs.filter(status="approved")

        # Отберём только те, у кого нет витринного названия
        candidates = []
        for ag in qs.order_by("created_at"):
            data = ag.customization_data or {}
            display = (data.get("agency_display_title") or ag.title or "").strip()
            if not display:
                candidates.append(ag)
            if len(candidates) >= limit:
                break

        to_update = min(len(candidates), len(names))
        if to_update == 0:
            self.stdout.write(self.style.WARNING("Нет агентств для обновления"))
            return

        self.stdout.write(
            f"Будут обновлены {to_update} агентств из {len(candidates)} доступных (limit={limit})"
        )

        if dry_run:
            for ag, name in zip(candidates[:to_update], names[:to_update]):
                self.stdout.write(f"[DRY] agency_id={ag.agency_id}: '{name}'")
            return

        updated = 0
        with transaction.atomic():
            for ag, name in zip(candidates[:to_update], names[:to_update]):
                data = ag.customization_data or {}
                if not isinstance(data, dict):
                    data = {}
                data["agency_display_title"] = name
                ag.customization_data = data
                ag.save(update_fields=["customization_data"])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Updated: {updated}"))


