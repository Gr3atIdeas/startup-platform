from django.core.management.base import BaseCommand
from accounts.models import TransactionTypes

class Command(BaseCommand):
    help = 'Create investment transaction type if it does not exist'

    def handle(self, *args, **options):
        try:
            investment_type, created = TransactionTypes.objects.get_or_create(
                type_name="investment",
                defaults={
                    "type_name": "investment",
                    "description": "Investment transaction type"
                }
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS('Successfully created investment transaction type')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Investment transaction type already exists')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating investment transaction type: {e}')
            )