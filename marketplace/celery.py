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
    'aggregate-daily-analytics': {
        'task': 'accounts.tasks.aggregate_daily_analytics',
        'schedule': crontab(hour=1, minute=0),
    },
}

