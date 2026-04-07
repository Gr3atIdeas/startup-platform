"""Add progress tracking fields to FranchiseAnalysisLog."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0071_crm_franchisee_discovery'),
    ]

    operations = [
        migrations.AddField(
            model_name='franchiseanalysislog',
            name='current_stage',
            field=models.CharField(
                choices=[
                    ('queued', 'В очереди'),
                    ('website', 'Скрапинг сайта'),
                    ('web_search', 'Поиск в интернете'),
                    ('maps', 'Поиск на картах'),
                    ('ai_extraction', 'AI-извлечение контактов'),
                    ('saving', 'Сохранение контактов'),
                    ('done', 'Завершено'),
                ],
                default='queued',
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name='franchiseanalysislog',
            name='stage_log',
            field=models.JSONField(default=list, help_text='Лог стадий'),
        ),
    ]
