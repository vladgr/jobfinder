from django.db import models
from django.contrib import admin


class Country(models.Model):
    code = models.CharField(max_length=2, blank=True, default='')
    name = models.CharField(max_length=50)

    class Meta:
        verbose_name_plural = 'countries'
        ordering = ['name']
        app_label = 'api'

    def __str__(self):
        return self.name

    @staticmethod
    def get_countries():
        """Returns list of key-value pairs"""
        qs = Country.objects.all().values_list('id', 'name')
        return list(qs)


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
