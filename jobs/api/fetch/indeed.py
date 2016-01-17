import requests
import collections
import json
import re
import lxml.html as lxh
from lxml.html.clean import clean_html
from lxml import etree

from requests.exceptions import ConnectionError
from api.exceptions import IndeedException


class Indeed():
    jobs_url = 'http://api.indeed.com/ads/apisearch'

    def __init__(self, publisher, q, co, **kwargs):
        self.opts = collections.OrderedDict()

        self.opts['publisher'] = publisher
        self.opts['q'] = q
        self.opts['co'] = co
        self.opts.update(kwargs)

    def test_opts(self):
        """For debug"""
        opts = dict(
            v='2',
            format='json',
            l='',
            sort='date',
            radius='',
            st='',
            jt='',
            start='',
            limit='25',
            fromage='1',
            co='us',
            chnl='',
            userip='',
            useragent=''
        )
        return opts

    def get_job_url(self, sp):
        """No useful info in this request"""
        dic = self.opts
        dic['jobkeys'] = ','.join(sp)

        url = 'http://api.indeed.com/ads/apigetjobs?publisher={publisher}'
        url += '&jobkeys={jobkeys}'
        url += '&v={v}'
        url += '&format={format}'
        url = url.format(**dic)
        return url

    def fetch_url(self, url):
        """Request to fetch HTML source"""
        try:
            r = requests.get(url)
        except ConnectionError:
            return ''
        return r.text

    def get_dict(self):
        """Request to API"""
        try:
            r = requests.get(self.jobs_url, params=dict(self.opts))
        except ConnectionError:
            raise IndeedException('Connection Error.')

        try:
            data = json.loads(r.text)
        except ValueError:
            raise IndeedException('Incorrect JSON.')

        return data

    def get_results(self):
        d = self.get_dict()
        if 'results' not in d or not d['results']:
            raise IndeedException('No results found.')
        return d['results']

    def get_description(self, url):
        """Fetches job's page and get description"""
        html = self.fetch_url(url)
        doc = lxh.fromstring(html)
        if 'indeed.' not in url:
            return clean_html(html)

        el = doc.find('.//span[@id="job_summary"]')
        if el is None:
            return clean_html(html)

        bytes = etree.tostring(el, encoding='utf8')
        html = bytes.decode()
        return self.highlight_words(html)

    def process(self):
        """Starts processing. Returns list of dictionaries"""
        l = self.get_results()
        return l

    def highlight_words(self, html):
        l = [
            'remote',
            'Python',
            'Java',
            'Javascript',
            'Ruby',
            'C#',
            'C\+\+',
            'React',
            'Angular',
            'Backbone',
            'MySQL',
            'PostgreSQL',
            'Go',
            'Golang'
        ]

        for word in l:
            ptn = r'\b{}\b'.format(word)
            repl = '<span class="highlight_word">{}</span>'.format(word)
            html = re.sub(ptn, repl, html, flags=re.IGNORECASE)

        return html
