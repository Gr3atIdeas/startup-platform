from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Add user_rating column to comments table'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            try:
                cursor.execute("""
                    ALTER TABLE comments 
                    ADD COLUMN user_rating INTEGER NULL;
                """)
                self.stdout.write(
                    self.style.SUCCESS('Successfully added user_rating column to comments table')
                )
            except Exception as e:
                if 'already exists' in str(e):
                    self.stdout.write(
                        self.style.WARNING('Column user_rating already exists in comments table')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Error adding column: {e}')
                    ) 