import api.bm as models
import logging
import time

from django.conf import settings
from django.db import transaction
from .exceptions import IndeedException
from .fetch.indeed import Indeed
from .fetch.upwork import Upwork


class ProcessIndeed:
    def __init__(self):
        self.site = models.Site.objects.get(code='Indeed')
        self.publisher = settings.INDEED_PUBLISHER_KEY

        self.filters = self.site.get_filters()

    def process_keyword(self, keyword_id, phrase, co):
        """Receives result from Indeed for single keyword and saves to db"""
        try:
            i = Indeed(self.publisher, phrase, co, **self.filters)
            res = i.process()
        except IndeedException as e:
            message = 'Processing Indeed {0}. Phrase: {1}'.format(co, phrase)
            message += e.args[0]
            logger = logging.getLogger('app')
            logger.info(message)
            return

        new_jobs = False
        with transaction.atomic():
            for d in res:
                if models.JobIndeed.objects.filter(jobkey=d['jobkey']).exists():
                    continue

                new_jobs = True
                # Get description by visiting job's page
                try:
                    d['description'] = i.get_description(d['url'])
                except:
                    d['description'] = 'Fetch page error.'

                d['is_processed'] = True
                d['country'] = models.Country.objects.get(code=d['country'].lower())

                d['source'], created = models.SourceIndeed.objects.get_or_create(
                    code=d['source'].lower().replace(' ', '_'),
                    defaults={'name': d['source']}
                )

                fields = models.JobIndeed._meta.get_all_field_names()
                d = {k: d[k] for k in fields if k in d}

                d['keyword_id'] = keyword_id

                models.JobIndeed.objects.create(**d)

        if new_jobs:
            models.JobIndeed.mark_new_jobs()

    def process(self):
        """Processes all phrases"""
        keys = models.Keyword.objects.filter(site_id=self.site.id)
        for kobj in keys:
            phrase = kobj.phrase
            for c in kobj.countries.all():
                self.process_keyword(kobj.id, phrase, c.code)
                time.sleep(2)


class ProcessUpwork:
    """Fetches only RSS and creates "empty" JobUpwork items

    Items contain keyword_id, url, jobtitle and description.
    Other fields will be processed later from chrome extension.
    """

    def __init__(self):
        self.site = models.Site.objects.get(code='Upwork')

    def process_keyword(self, keyword_id, feed_url):
        uw = Upwork(feed_url)
        uw.get_doc()
        jobs = uw.get_jobs()

        with transaction.atomic():
            for job in jobs:
                if models.JobUpwork.objects.filter(url=job.url).exists():
                    continue

                job.props['keyword_id'] = keyword_id
                models.JobUpwork.objects.create(**job.props)

    def process(self):
        keys = models.Keyword.objects.filter(site_id=self.site.id)
        for kobj in keys:
            self.process_keyword(kobj.id, kobj.feed_url)
            time.sleep(2)
