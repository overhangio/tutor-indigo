from django.contrib import admin

from .models import ThemePreset, UserTheme


@admin.register(ThemePreset)
class ThemePresetAdmin(admin.ModelAdmin):
    list_display = ("slug", "name", "variant", "is_default", "order")
    list_filter = ("variant", "is_default")
    search_fields = ("slug", "name")


@admin.register(UserTheme)
class UserThemeAdmin(admin.ModelAdmin):
    list_display = ("user", "preset", "modified")
    list_filter = ("preset",)
    search_fields = ("user__username",)
    raw_id_fields = ("user",)
