import lxml.html as lxh
import re
import requests

from lxml import etree


class Upwork():
    """Parses Jobs RSS Feed.

    uw = Upwork(url)
    uw.get_doc()
    jobs = uw.get_jobs()
    """

    def __init__(self, url):
        self.url = url
        self.doc = None

    def get_doc(self):
        r = requests.get(self.url)
        self.doc = etree.fromstring(r.text.encode())

    def get_jobs(self):
        jobs = []
        for el in self.doc.findall('.//item'):
            elem = el.find('.//link')
            url = elem.text if elem is not None else ''

            elem = el.find('.//title')
            title = elem.text if elem is not None else ''

            elem = el.find('.//description')
            description = elem.text if elem is not None else ''

            if url and title and description:
                # "empty" Job instance without props
                url = url.rstrip('?source=rss')
                job = UpworkJob(url, title, description)
                jobs.append(job)
        return jobs


class UpworkJob:
    """Parses single Upwork Job page.

    job = UpworkJob(url, jobtitle, description)
    job.get_doc(html)
    job.get_props()
    jobs.props dict will contain all data.
    """
    def __init__(self, url, jobtitle, description):
        self.url = url
        self.props = dict(
            url=url,
            jobtitle=jobtitle,
            description=description
        )
        self.doc = None

    def get_doc(self, html):
        self.doc = lxh.fromstring(html)

    def get_md_bottom(self):
        l = []
        for el in self.doc.xpath('.//p[@class="m-md-bottom"]'):
            l += el.text_content().split('\n')
        return [x.strip() for x in l if x.strip()]

    def get_props(self):
        l = self.get_md_bottom()
        fields = (
            'country',
            'city',
            'jobs_posted',
            'hires',
            'active_hires',
            'hire_rate',
            'avg_hour_price',
            'stars',
            'total_spent',
            'hours'
        )

        # get fields with "md-bottom" text
        for field in fields:
            self.props[field] = getattr(self, 'get_' + field)(l)

        fields = (
            'delivery_by',
            'is_fixed_price',
            'budget'
        )

        # get other fields
        for field in fields:
            self.props[field] = getattr(self, 'get_' + field)()

    def get_index(self, l, value):
        """Receives list and value. Returns index or -1"""
        return l.index(value) if value in l else -1

    def get_time_index(self, l):
        """index of XX:XX AM(PM) in the list"""
        for index in range(len(l)):
            m = re.match('\d\d\:\d\d (AM|PM)', l[index])
            if m:
                return index
        return -1

    def get_country(self, l):
        index = self.get_time_index(l)
        if index < 2:
            return 'Not defined'
        return l[index-2]

    def get_city(self, l):
        index = self.get_time_index(l)
        if index < 2:
            return 'Not defined'
        return l[index-1]

    def get_jobs_posted(self, l):
        i = self.get_index(l, 'Jobs Posted')
        return int(l[i-1].replace(',', '')) if i > 0 else 0

    def get_hires(self, l):
        i = self.get_index(l, 'Hires,')
        return int(l[i-1].replace(',', '')) if i > 0 else 0

    def get_active_hires(self, l):
        i = self.get_index(l, 'Active')
        return int(l[i-1].replace(',', '')) if i > 0 else 0

    def get_hire_rate(self, l):
        i = self.get_index(l, 'Hire Rate,')
        return int(l[i-1].rstrip('%')) if i > 0 else 0

    def get_avg_hour_price(self, l):
        i = self.get_index(l, 'Avg Hourly Rate Paid')
        return int(float(l[i-1].lstrip('$').rstrip('/hr'))) if i > 0 else 0

    def get_total_spent(self, l):
        i = self.get_index(l, 'Total Spent')
        return int(l[i-1].lstrip('$').replace(
            ',', '').replace('Over $', '')) if i > 0 else 0

    def get_hours(self, l):
        i = self.get_index(l, 'Hours')
        return int(l[i-1].replace(',', '')) if i > 0 else 0

    def get_stars(self, l):
        for text in l:
            m = re.match('\((\d\.\d\d)\)\s+', text)
            if m:
                return m.group(1)
        return '-'

    def get_delivery_by(self):
        l = self.doc.xpath(
            './/span[contains(text(),"Delivery by")]/span[@class="nowrap"]')
        return l[0].text_content().strip() if l else '-'

    def get_is_fixed_price(self):
        for el in self.doc.findall('.//p[@class="m-0-bottom"]'):
            if 'Fixed Price' in el.text_content():
                return True
        return False

    def get_budget(self):
        for el in self.doc.findall('.//p[@class="m-0-bottom"]'):
            t = el.text_content().strip().replace('.', '').replace(',', '')
            m = re.match(r'\$([0-9]+)$', t)
            if m:
                return(int(m.group(1)))
        return 0


# HTML can be changed in future - this is for fast debug
# if __name__ == '__main__':

#     def test(html):
#         uj = UpworkJob('url', 'tit', 'desc')
#         uj.get_doc(html)
#         uj.get_props()
#         for k, v in uj.props.items():
#             print(k, v)
#         print('--------------')

#     import os

#     for top, dirs, files in os.walk('.'):
#         for name in files:
#             file = os.path.join(top, name)
#             if not file.endswith('.html'):
#                 continue

#             html = open(file).read()
#             test(html)
