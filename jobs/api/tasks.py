from celery.decorators import periodic_task
from celery.task.schedules import crontab
from datetime import datetime, timedelta

from api.process import ProcessIndeed
from api.process import ProcessUpwork
import api.bm as models


@periodic_task(run_every=crontab(minute='10', hour='*'))
def fetch_indeed():
    p = ProcessIndeed()
    p.process()


@periodic_task(run_every=crontab(minute='*/3', hour='*'))
def fetch_upwork():
    p = ProcessUpwork()
    p.process()


@periodic_task(run_every=crontab(minute=0, hour=0))
def clear_old_logs():
    """Delete old rows from Log"""
    models.Logging.objects.filter(
        dt__lt=datetime.now()-timedelta(days=15)).delete()
