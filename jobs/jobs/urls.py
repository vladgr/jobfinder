from django.conf.urls import include, url
from django.contrib import admin

from api import views as v

urlpatterns = [
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', v.home),

    url(r'^api/menu/$', v.api_menu),
    url(r'^api/keywords/$', v.api_keywords),

    url(r'^api/jobs/$', v.api_jobs),
    url(r'^api/jobs/check/new/$', v.api_jobs_check_new),

    url(r'^api/job/$', v.api_job),
    url(r'^api/job/mark/deleted/$', v.api_job_mark_deleted),
    url(r'^api/job/mark/featured/$', v.api_job_mark_featured),
    url(r'^api/job/mark/viewed/$', v.api_job_mark_viewed),

    url(r'^api/upwork/get/tasks/$', v.api_upwork_get_tasks),
    url(r'^api/upwork/process/item/$', v.api_upwork_process_item)

]
