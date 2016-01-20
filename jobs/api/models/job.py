import redis
from django.db import models
from django.db.models import Q
from django.contrib import admin

from .country import Country
from .keyword import Keyword
from .filter import Filter

# Set flag in Redis when new jobs arrive.
# Chrome extension checks for new jobs.
rs = redis.Redis(host='127.0.0.1', port=6379, db=0)
new_jobs = 'new_jobs'


class Job(models.Model):
    country = models.ForeignKey('Country', default=None, null=True, blank=True)
    keyword = models.ForeignKey('Keyword')
    city = models.CharField(max_length=100, blank=True, default='')
    dt = models.DateTimeField(auto_now_add=True)
    url = models.CharField(max_length=255, default='', db_index=True)
    jobtitle = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    is_featured = models.BooleanField(default=False)
    is_processed = models.BooleanField(default=False)
    is_viewed = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True
        app_label = 'api'

    @staticmethod
    def get_jobs(keyword_id):
        """Returns lists of key-value pairs

        JavaScript converts array of key-value pairs
        directly into Map.
        """
        keyword = Keyword.objects.get(id=keyword_id)
        job_model = keyword.site.get_job_model()
        model = globals()[job_model]
        qs = model.objects.defer('description').filter(
            keyword_id=keyword_id,
            is_deleted=False,
            is_processed=True).values()

        query = model.get_query()
        if query is None:
            l = qs.values()
        else:
            l = qs.filter(query).values()

        return {
            'items': [[d['id'], d] for d in l],
            'job_model': job_model,
            'countries': Country.get_countries()
        }

    @staticmethod
    def mark_new_jobs():
        rs.set(new_jobs, 1)

    @staticmethod
    def check_new_jobs():
        value = rs.get(new_jobs)
        if value is None:
            return False

        value = int(value)
        if value == 0:
            return False

        rs.set(new_jobs, 0)
        return True


class SourceIndeed(models.Model):
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)

    class Meta:
        app_label = 'api'
        verbose_name_plural = 'Source indeed'


class JobIndeed(Job):
    jobkey = models.CharField(max_length=255)
    company = models.CharField(max_length=100, default='')
    snippet = models.TextField(default='')
    source = models.ForeignKey(SourceIndeed)
    state = models.CharField(max_length=50, default='')

    class Meta:
        app_label = 'api'
        verbose_name_plural = 'jobs indeed'

    def __str__(self):
        return self.jobtitle

    @staticmethod
    def get_query():
        """Returns custom query"""
        return None


class JobUpwork(Job):
    avg_hour_price = models.IntegerField(blank=True, default=0)
    budget = models.IntegerField(blank=True, default=0)
    active_hires = models.IntegerField(blank=True, default=0)
    hires = models.IntegerField(blank=True, default=0)
    hire_rate = models.IntegerField(blank=True, default=0)
    hours = models.IntegerField(blank=True, default=0)
    delivery_by = models.CharField(max_length=50, blank=True, default='')
    jobs_posted = models.IntegerField(blank=True, default=0)
    stars = models.CharField(max_length=10, blank=True, default='')
    total_spent = models.IntegerField(blank=True, default=0)
    is_fixed_price = models.BooleanField(default=False)

    class Meta:
        app_label = 'api'
        verbose_name_plural = 'jobs upwork'

    def __str__(self):
        return self.jobtitle

    def check_filters(self):
        d = Filter.get_upwork_filters()
        if self.avg_hour_price > 0 and self.avg_hour_price < d['avh']:
            return False

        if self.budget > 0 and self.budget < d['budget']:
            return False

        if self.total_spent < d['spent']:
            return False

        return True

    @staticmethod
    def get_query():
        """Returns custom query"""
        d = Filter.get_upwork_filters()
        query = Q(avg_hour_price=0) | Q(avg_hour_price__gte=d['avh'])
        query &= Q(budget=0) | Q(budget__gte=d['budget'])
        query &= Q(total_spent__gte=d['spent'])
        # if change filters - change also in keyword.py
        return query


@admin.register(JobIndeed)
class JobIndeedAdmin(admin.ModelAdmin):
    list_filter = ('is_processed', 'is_deleted')
    list_display = (
        'dt',
        'keyword',
        'country',
        'city',
        'jobtitle',
        'snippet',
        'is_processed'
    )

    def has_add_permission(self, request):
        return False


@admin.register(JobUpwork)
class JobUpworkAdmin(admin.ModelAdmin):
    list_filter = ('is_processed', 'is_deleted')
    list_display = (
        'dt',
        'keyword',
        'country',
        'jobtitle',
        'total_spent',
        'avg_hour_price',
        'is_processed'
    )

    def has_add_permission(self, request):
        return False


@admin.register(SourceIndeed)
class SourceIndeedAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    list_display_links = None
    actions = None

    def has_add_permission(self, request):
        return False
