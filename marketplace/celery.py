import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace.settings')

app = Celery('marketplace')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

app.conf.beat_schedule = {
    'flush-analytics-events': {
        'task': 'accounts.tasks.flush_analytics_events',
        'schedule': 60.0,
    },
    'resolve-geo-ips': {
        'task': 'accounts.tasks.resolve_geo_ips',
        'schedule': crontab(hour=0, minute=30),
    },
    'aggregate-daily-analytics': {
        'task': 'accounts.tasks.aggregate_daily_analytics',
        'schedule': crontab(hour=1, minute=0),
    },
    'generate-seo-article-weekly': {
        'task': 'accounts.tasks.generate_seo_article',
        'schedule': crontab(hour=10, minute=0, day_of_week=1),  # Monday 10:00 UTC
    },
}

