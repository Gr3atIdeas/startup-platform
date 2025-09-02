
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0027_recreate_franchises_table'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            INSERT INTO directions (direction_name) VALUES 
            ('Рестораны и кафе'),
            ('Салоны красоты'),
            ('Фитнес-клубы'),
            ('Образовательные центры'),
            ('Автосервисы'),
            ('Магазины розничной торговли'),
            ('Медицинские центры'),
            ('Детские сады и клубы'),
            ('Туристические агентства'),
            ('Строительные компании'),
            ('Юридические услуги'),
            ('Страховые компании'),
            ('Банковские услуги'),
            ('Недвижимость и агентства'),
            ('Логистические услуги')
            ON CONFLICT (direction_name) DO NOTHING;
            """,
            reverse_sql="",
        ),
    ]