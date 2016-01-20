import api.bm as models
import logging

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_POST
from .fetch.upwork import UpworkJob

logger = logging.getLogger('app')


def check_token(func):
    """Token decorator"""
    def inner(request, *args, **kw):
        value = request.POST.get('token', '')
        if value != settings.API_TOKEN:
            msg = 'Wrong token'
            logger.info(msg)
            raise Exception(msg)

        return func(request, *args, **kw)
    return inner


def check_model(func):
    """View decorator

    Get job model by keyword_id or site_id
    """
    def get_site(request):
        keyword_id = request.POST.get('keyword_id', None)
        if keyword_id:
            keyword = models.Keyword.objects.get(id=keyword_id)
            return keyword.site

        site_id = request.POST.get('site_id', None)
        if site_id:
            return models.Site.objects.get(id=site_id)

        msg = 'Can not get site by site_id'
        logger.info(msg)
        raise Exception(msg)

    def inner(request, *args, **kw):
        site = get_site(request)

        model_name = site.get_job_model()
        model = getattr(models, model_name, None)
        if model is None:
            msg = 'Wrong model name'
            logger.info(msg)
            raise Exception(msg)

        kw['job_model'] = model
        return func(request, *args, **kw)
    return inner


def home(request):
    return HttpResponse('Jobs finder.')


@require_POST
@check_token
def api_menu(request):
    l = models.Site.get_menu()
    return JsonResponse(l, safe=False)


@require_POST
@check_token
def api_keywords(request):
    l = models.Keyword.get_keywords(int(request.POST.get('site_id')))
    return JsonResponse(l, safe=False)


@require_POST
@check_model
@check_token
def api_jobs(request, **kw):
    d = kw['job_model'].get_jobs(request.POST.get('keyword_id'))
    return JsonResponse(d)


@require_POST
@check_token
def api_jobs_check_new(request):
    value = models.Job.check_new_jobs()
    return JsonResponse({'result': value})


@require_POST
@check_model
@check_token
def api_job(request, **kw):
    obj = kw['job_model'].objects.get(id=request.POST.get('job_id'))
    return JsonResponse({})


@require_POST
@check_model
@check_token
def api_job_mark_deleted(request, **kw):
    obj = kw['job_model'].objects.get(id=request.POST.get('job_id'))
    obj.is_deleted = not obj.is_deleted
    obj.save()
    return JsonResponse({})


@require_POST
@check_model
@check_token
def api_job_mark_featured(request, **kw):
    obj = kw['job_model'].objects.get(id=request.POST.get('job_id'))
    obj.is_featured = not obj.is_featured
    obj.save()
    return JsonResponse({})


@require_POST
@check_model
@check_token
def api_job_mark_viewed(request, **kw):
    kw['job_model'].objects.filter(
        id=request.POST.get('job_id')).update(is_viewed=True)
    return JsonResponse({})


@require_POST
@check_token
def api_upwork_get_tasks(request):
    """Returns "not processed" JobUpwork items

    Chrome extension asks for "not processed" items
    """
    qs = models.JobUpwork.objects.filter(
        is_processed=False).values_list('url', flat=True)

    return JsonResponse(list(qs), safe=False)


@require_POST
@check_token
def api_upwork_process_item(request):
    """Processes "not processed" JobUpwork items

    Chrome extension sends result and this View
    updates result in database
    """
    url = request.POST.get('url', None)
    if url is None:
        msg = 'Missing "url" in the query request'
        logger.info(msg)
        raise Exception(msg)

    html = request.POST.get('html', None)
    if html is None:
        msg = 'Missing "html" in the query request'
        logger.info(msg)
        raise Exception(msg)

    try:
        obj = models.JobUpwork.objects.get(url=url)
    except models.JobUpwork.DoesNotExist:
        msg = 'Wrong url'
        logger.info(msg)
        raise Exception(msg)

    if obj.is_processed:
        msg = 'JobUpwork item already processed'
        logger.info(msg)
        raise Exception(msg)

    uj = UpworkJob(obj.url, obj.jobtitle, obj.description)
    uj.get_doc(html)
    uj.get_props()

    uj.props['country'], created = models.Country.objects.get_or_create(
        name=uj.props['country'])

    for k, v in uj.props.items():
        setattr(obj, k, v)

    obj.is_processed = True
    obj.save()

    if obj.check_filters():
        models.JobUpwork.mark_new_jobs()

    return JsonResponse({})
