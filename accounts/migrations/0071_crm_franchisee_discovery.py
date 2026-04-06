"""Add CRM integration, lead extra fields, and franchisee discovery models."""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0070_articletopiclog'),
    ]

    operations = [
        # ── Lead: new fields ──
        migrations.AddField(
            model_name='lead',
            name='target_city',
            field=models.ForeignKey(
                blank=True, db_column='target_city_id', null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='leads', to='accounts.city',
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='business_experience',
            field=models.CharField(
                blank=True, default='', max_length=20,
                choices=[('', 'Не указан'), ('none', 'Нет опыта в бизнесе'), ('1-3', '1–3 года'), ('3+', 'Более 3 лет')],
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='timeline',
            field=models.CharField(
                blank=True, default='', max_length=20,
                choices=[('', 'Не указан'), ('1m', 'До 1 месяца'), ('1-3m', '1–3 месяца'), ('3-6m', '3–6 месяцев'), ('6m+', 'Более 6 месяцев')],
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='internal_notes',
            field=models.TextField(blank=True, default=''),
        ),

        # ── CRM Integration ──
        migrations.CreateModel(
            name='CRMIntegration',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('crm_type', models.CharField(choices=[('bitrix24', 'Bitrix24'), ('amocrm', 'AmoCRM'), ('webhook', 'Webhook (универсальный)')], max_length=20)),
                ('webhook_url', models.URLField(help_text='Webhook URL или REST API endpoint', max_length=500)),
                ('api_key', models.CharField(blank=True, default='', help_text='API ключ или токен', max_length=500)),
                ('api_secret', models.CharField(blank=True, default='', help_text='Секретный ключ (для AmoCRM refresh_token)', max_length=500)),
                ('subdomain', models.CharField(blank=True, default='', help_text='Поддомен (для AmoCRM: company.amocrm.ru)', max_length=100)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_error', models.TextField(blank=True, default='')),
                ('last_sync_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(
                    db_column='user_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='crm_integrations', to='accounts.users',
                )),
            ],
            options={
                'db_table': 'crm_integrations',
                'unique_together': {('user', 'crm_type')},
            },
        ),

        # ── Franchise Analysis Log ──
        migrations.CreateModel(
            name='FranchiseAnalysisLog',
            fields=[
                ('log_id', models.AutoField(primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('pending', 'В очереди'), ('running', 'Выполняется'), ('completed', 'Завершено'), ('failed', 'Ошибка')], default='pending', max_length=20)),
                ('celery_task_id', models.CharField(blank=True, default='', max_length=255)),
                ('sources_scraped', models.JSONField(default=list)),
                ('contacts_found', models.IntegerField(default=0)),
                ('error_message', models.TextField(blank=True, default='')),
                ('raw_scraped_text', models.TextField(blank=True, default='')),
                ('grok_response_raw', models.TextField(blank=True, default='')),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('franchise', models.ForeignKey(
                    db_column='franchise_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='analysis_logs', to='accounts.franchises',
                )),
                ('initiated_by', models.ForeignKey(
                    blank=True, db_column='initiated_by_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='franchise_analyses', to='accounts.users',
                )),
            ],
            options={
                'db_table': 'franchise_analysis_log',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['franchise', '-created_at'], name='idx_falog_franchise'),
                    models.Index(fields=['status'], name='idx_falog_status'),
                ],
            },
        ),

        # ── Franchisee Contact ──
        migrations.CreateModel(
            name='FranchiseeContact',
            fields=[
                ('contact_id', models.AutoField(primary_key=True, serialize=False)),
                ('person_name', models.CharField(blank=True, default='', max_length=255)),
                ('company_name', models.CharField(blank=True, default='', max_length=255)),
                ('phone', models.CharField(blank=True, default='', max_length=100)),
                ('email', models.EmailField(blank=True, default='', max_length=255)),
                ('telegram', models.CharField(blank=True, default='', max_length=255)),
                ('website', models.URLField(blank=True, default='', max_length=500)),
                ('city', models.CharField(blank=True, default='', max_length=255)),
                ('address', models.TextField(blank=True, default='')),
                ('source', models.CharField(choices=[('website', 'Сайт франшизы'), ('2gis', '2ГИС'), ('yandex_maps', 'Яндекс Карты'), ('web_search', 'Веб-поиск'), ('manual', 'Вручную')], default='website', max_length=30)),
                ('source_url', models.URLField(blank=True, default='', max_length=500)),
                ('confidence', models.CharField(blank=True, default='', max_length=20)),
                ('outreach_status', models.CharField(choices=[('new', 'Новый'), ('to_reach_out', 'Связаться'), ('contacted', 'Связались'), ('responded', 'Ответил'), ('declined', 'Отказ'), ('interview_done', 'Интервью проведено')], default='new', max_length=30)),
                ('moderator_notes', models.TextField(blank=True, default='')),
                ('contacted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('franchise', models.ForeignKey(
                    db_column='franchise_id', on_delete=django.db.models.deletion.CASCADE,
                    related_name='franchisee_contacts', to='accounts.franchises',
                )),
                ('analysis_log', models.ForeignKey(
                    blank=True, db_column='analysis_log_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='contacts', to='accounts.franchiseanalysislog',
                )),
                ('assigned_to', models.ForeignKey(
                    blank=True, db_column='assigned_to_id', null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='assigned_franchisee_contacts', to='accounts.users',
                )),
            ],
            options={
                'db_table': 'franchisee_contacts',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['franchise', '-created_at'], name='idx_fcontact_franchise'),
                    models.Index(fields=['outreach_status'], name='idx_fcontact_status'),
                ],
            },
        ),
    ]
