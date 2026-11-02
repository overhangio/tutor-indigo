SECRET_KEY = "indigo-theme-tests"

DEBUG = False

USE_TZ = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "tests.apps.IndigoThemeTestConfig",
]

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

INDIGO_PRIMARY_COLOR = "#15376D"
