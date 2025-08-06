# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0027_recreate_franchises_table'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            INSERT INTO directions (direction_name) VALUES 
            ('Франшизы еды и напитков'),
            ('Франшизы красоты и здоровья'),
            ('Франшизы спорта и фитнеса'),
            ('Франшизы образования'),
            ('Франшизы услуг'),
            ('Франшизы торговли'),
            ('Франшизы развлечений'),
            ('Франшизы автосервиса'),
            ('Франшизы недвижимости'),
            ('Франшизы финансовых услуг'),
            ('Франшизы туризма'),
            ('Франшизы медицины'),
            ('Франшизы детских услуг'),
            ('Франшизы домашних услуг'),
            ('Франшизы технологий')
            ON CONFLICT (direction_name) DO NOTHING;
            """,
            reverse_sql="",
        ),
    ] 