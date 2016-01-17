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


@admin.register(Filter)
class FilterAdmin(admin.ModelAdmin):
    list_display = ('site', 'code', 'value', 'info', 'type')
    readonly_fields = ('site', 'code', 'info', 'type')
    actions = None

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
