from django.db import models
from django.contrib import admin

TYPES = [(1, 'str'), (2, 'int')]


class Filter(models.Model):
    site = models.ForeignKey('Site')
    code = models.CharField(max_length=50)
    value = models.CharField(max_length=255, default='', blank=True)
    info = models.CharField(max_length=255, default='', blank=True)
    type = models.SmallIntegerField(choices=TYPES, default=1)

    class Meta:
        app_label = 'api'
        ordering = ['site_id']

    def __str__(self):
        return self.code

    @staticmethod
    def get_upwork_filters():
        d = {}
        d['avh'] = int(Filter.objects.get(code='avh').value)
        d['budget'] = int(Filter.objects.get(code='budget').value)
        d['spent'] = int(Filter.objects.get(code='spent').value)
        return d


@admin.register(Filter)
class FilterAdmin(admin.ModelAdmin):
    list_display = ('site', 'code', 'value', 'info', 'type')
    readonly_fields = ('site', 'code', 'info', 'type')
    actions = None

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
