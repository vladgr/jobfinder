from django.db import models
from django.contrib import admin

from .filter import Filter


class Site(models.Model):
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=50)
    sort = models.SmallIntegerField(default=0)
    active = models.BooleanField(default=True)

    def get_filters(self):
        return dict(Filter.objects.filter(
            site_id=self.id).values_list('code', 'value'))

    def get_job_model(self):
        return 'Job{}'.format(self.name)

    @staticmethod
    def get_job_table(site_id):
        site_name = Site.objects.get(id=site_id).name
        return 'api_job{}'.format(site_name.lower())

    @staticmethod
    def get_menu():
        objs = list(Site.objects.filter(active=True).values('id', 'name'))
        return objs

    class Meta:
        ordering = ['sort']
        app_label = 'api'

    def __str__(self):
        return self.name


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'sort', 'active')
    list_editable = ('sort', 'active')
    exclude = ('code',)
    actions = None

    def has_delete_permission(self, request, obj=None):
        return False
