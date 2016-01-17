from django.db import models
from django.contrib import admin

from .country import Country
from .filter import Filter
from .setting import Setting
from .site import Site


class Keyword(models.Model):
    site = models.ForeignKey('Site')
    phrase = models.CharField(max_length=50)
    feed_url = models.CharField(
        max_length=255, blank=True, default='', help_text='for Upwork')
    countries = models.ManyToManyField('Country')

    class Meta:
        app_label = 'api'

    def __str__(self):
        return self.phrase

    def save(self, *args, **kwargs):
        """For Indeed: automatically adds Keyword-Country relation."""
        init = False
        if not self.pk:
            init = True
        super(Keyword, self).save(*args, **kwargs)

        if init and self.site.code == 'Indeed':
            sobj = Setting.objects.get(code='countries')
            l = sobj.value.strip().split(',')
            l = [x.strip() for x in l]
            for co in l:
                try:
                    c = Country.objects.get(code=co)
                except Country.DoesNotExist:
                    continue
                self.countries.add(c)

    @staticmethod
    def get_keywords(site_id):
        table = Site.get_job_table(site_id)
        query = 'SELECT COUNT(*) from {} WHERE keyword_id=api_keyword.id AND \
            is_viewed=0 AND is_deleted=0 AND is_processed=1'

        # Upwork
        if site_id == 2:
            avh = int(Filter.objects.get(code='avh').value)
            budget = int(Filter.objects.get(code='budget').value)
            spent = int(Filter.objects.get(code='spent').value)

            query += ' AND (avg_hour_price=0 OR avg_hour_price>={})'.format(
                avh)
            query += ' AND (budget=0 OR budget>={})'.format(budget)
            query += ' AND total_spent>={}'.format(spent)

        query = query.format(table)
        qs = Keyword.objects.filter(site_id=site_id)
        qs = qs.extra(select={'quantity_nv_jobs': query})
        qs = qs.values('id', 'phrase', 'site_id', 'quantity_nv_jobs')
        return list(qs)


class CountryInline(admin.TabularInline):
    model = Keyword.countries.through


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    inlines = [
        CountryInline,
    ]
    exclude = ('countries',)
    list_display = ('site', 'phrase', 'feed_url')
