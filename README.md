# JobFinder

## About

You can use this software for fast and easy job search on Indeed and Upwork. The program consist of two parts:

1. Backend: Python, Django, Celery, Redis.
2. Frontend: Crome extension (ES6, ReactJS).

## Install

### Django backend

Install virtual environment using requirements.
Set variables either in settings/data.json or directly in settings/base.py.

data.json:

```
{
    "allowed_hosts": ["yourdomain.com"],
    "secret_key": "your django secret key",
    "db_name": "yourdbname",
    "db_user": "yourdbuser",
    "db_password": "yourdbpassword",
    "host_ip": "ip.address",
    "indeed_publisher_key": "Indeed publisher API key",
    "api_token": "your token"
}
```

indeed_publisher_key - go to indeed.com, register for API and get Indeed API publisher key.

api_token - set any own secret token. The same token you'll need to set in Chrome extension's options. 

Chrome extension will be sending queries to Django's backend and Django will be checking token.

Create MySQL database.

Run commands:

```
python manage.py makemigrations
python manage.py makemigrations api
python manage.py migrate
python manage.py loaddata site.yaml
python manage.py loaddata filter.yaml
python manage.py loaddata country.yaml
python manage.py loaddata setting.yaml
python manage.py createsuperuser
```

If you use Django's development server:

```
python manage.py runserver
```

Run celery tasks:

```
celery worker -A jobs -l info -B
```

If you deploy Django to server - configure your environment the way you usually do it.

Once Django up and running go to admin and create keywords.

For Indeed just create keywords and Django will query Indeed's API for these keywords (example: python remote).

For Upwork create RSS feeds first in your Upwork account. Then set the phrase and feed url for each Upwork RSS feed.

Edit "Filters" to match your criteria.

### Chrome extension

1. In Chrome browser navigate to: chrome://extensions
2. Expand the developer dropdown menu and click "Load Unpacked Extension"
3. Navigate to folder: chrome/dist

"chrome/dist/js" folder contains compiled from ES6 to ES5 JavaScript files and it is ready for use.
"chrome/src/js" folder contains ES6 source code.

Once extension is loaded into Chrome browser, you need to set options.
You may click on "Options" here (chrome://extensions/) or right click on extension icon and choose "Options".

On the options page set:

1. API_TOKEN - the same token as you set in Django.
2. API_SITE - the url for backend, for example: http://localhost:8000 or http://yourdomain.com

## How it works

### Indeed

All information about Indeed jobs is processed on server. Python send queries to Indeed API, get info, then visit each particular job page and get job description.

### Upwork

It's a bit more complex than Indeed. Upwork RSS feeds do not have much info about job, so we need to visit every job page. But job page available for auth users only. 

It could be done on server using selenium (for example) and some browser emulation, but I wanted to play with Chrome extensions.

Server visits RSS job url and get title and job page url. All Upwork jobs marked as "not processed". 

Chrome extension queries server for "not processed" jobs, get job urls and visits them. Chrome browser should be "signed in" to your Upwork account.

When Chrome extension visits job page, it get raw HTML and send it back to server. Server parses info, updates database and marks job as "processed".


## View jobs

Chrome extension get jobs from server. Click on job title to view description (Esc key to close description).
When you view description, job will be marked as "viewed".

You can also mark job as "featured" clicking on green star.

And you can delete job clicking on red icon. Job actually won't be deleted from database, but it will be marked as "deleted" and not showing in Chrome anymore.

You may create server on localhost, but that way you'll miss some jobs.

I suggest to deploy Django on VPS or server, that way jobs will be parsed 24/7. 

## License

MIT
