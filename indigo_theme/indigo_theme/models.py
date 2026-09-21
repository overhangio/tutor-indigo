from django.conf import settings
from django.db import models

from .constants import VARIANT_CHOICES


class ThemePreset(models.Model):
    slug = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    variant = models.CharField(max_length=16, choices=VARIANT_CHOICES)
    tokens = models.JSONField(default=dict)
    is_default = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "slug"]

    def __str__(self):
        return self.name

    @classmethod
    def get_default(cls):
        return cls.objects.filter(is_default=True).first() or cls.objects.first()


class UserTheme(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="indigo_theme",
    )
    preset = models.ForeignKey(ThemePreset, on_delete=models.PROTECT)
    overrides = models.JSONField(default=dict)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user}: {self.preset}"
