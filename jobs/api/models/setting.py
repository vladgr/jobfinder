from django.db import models
from django.contrib import admin

TYPES = [(1, 'str'), (2, 'int')]


class Setting(models.Model):
    site = models.ForeignKey('Site', null=True, blank=True, default=None)
    code = models.CharField(max_length=50)
    value = models.CharField(max_length=255, default='', blank=True)
    info = models.CharField(max_length=255, default='', blank=True)
    type = models.SmallIntegerField(choices=TYPES, default=1, blank=True)

    class Meta:
        app_label = 'api'

        def __str__(self):
            return self.code


@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin):
    list_display = ('site', 'code', 'value', 'info', 'type')
    list_editable = ('value',)
    list_display_links = None
    actions = None

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request):
        return False
