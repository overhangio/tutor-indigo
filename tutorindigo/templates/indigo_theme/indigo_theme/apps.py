from django.apps import AppConfig
from edx_django_utils.plugins.constants import PluginURLs
from openedx.core.djangoapps.plugins.constants import ProjectType


class IndigoThemeConfig(AppConfig):
    name = "indigo_theme"
    default_auto_field = "django.db.models.AutoField"
    verbose_name = "Indigo dynamic theme"

    plugin_app = {
        PluginURLs.CONFIG: {
            ProjectType.LMS: {
                PluginURLs.NAMESPACE: "indigo_theme",
                PluginURLs.REGEX: r"^api/indigo/",
                PluginURLs.RELATIVE_PATH: "urls",
            }
        }
    }
