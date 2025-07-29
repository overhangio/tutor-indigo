import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

USE_I18N = True

LANGUAGE_CODE = 'en'
LANGUAGES = [
    ('en', 'English'),
    ('ar', 'Arabic'),
    ('fr', 'French'),
]

LOCALE_PATHS = [
    os.path.join(BASE_DIR, 'conf/locale'),
]

INSTALLED_APPS = [
    'django.contrib.contenttypes',
]

SECRET_KEY = 'dummy'
