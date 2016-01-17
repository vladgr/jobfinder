from django.db import models
from django.contrib import admin


class Logging(models.Model):
    http_code = models.CharField(max_length=10, default='')
    level = models.CharField(max_length=8, default='')
    logger_name = models.CharField(max_length=20, default='')
    module = models.CharField(max_length=100, default='')
    thread = models.CharField(max_length=50, default='')
    thread_name = models.CharField(max_length=100, default='')
    exc_info = models.CharField(max_length=255, default='')
    stack_info = models.TextField(default='')
    message = models.TextField(default='')
    dt = models.DateTimeField(verbose_name='date', auto_now_add=True)

    class Meta:
        app_label = 'api'
        verbose_name = 'logging'
        verbose_name_plural = 'logging'
        ordering = ['-dt']

    def __str__(self):
        return str(self.dt)


@admin.register(Logging)
class LoggingAdmin(admin.ModelAdmin):
    list_display = (
        'dt',
        'level',
        'http_code',
        'logger_name',
        'module',
        'exc_info',
        'message'
    )
    list_filter = ('level', 'logger_name')

    def has_add_permission(self, request, obj=None):
        return False
