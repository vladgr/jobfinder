import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jobs.settings.production')

from django.conf import settings
app = Celery('jobs')

app.config_from_object('django.conf:settings')
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)
