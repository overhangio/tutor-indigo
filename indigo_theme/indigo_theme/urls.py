from django.urls import path

from .views import UserThemeView

app_name = "indigo_theme"

urlpatterns = [
    path("v1/theme/", UserThemeView.as_view(), name="user_theme"),
]
