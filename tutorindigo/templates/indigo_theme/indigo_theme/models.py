import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from .constants import CUSTOMIZABLE_TOKENS, HEX_COLOR_RE, VARIANT_CHOICES


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

    def clean(self):
        tokens = self.tokens or {}
        if not isinstance(tokens, dict):
            raise ValidationError({"tokens": "Tokens must be an object."})
        for token, color in tokens.items():
            if token not in CUSTOMIZABLE_TOKENS:
                raise ValidationError({"tokens": f"Token {token} is not customizable."})
            if not isinstance(color, str) or not re.match(HEX_COLOR_RE, color):
                raise ValidationError(
                    {"tokens": f"Value for {token} must be a #RRGGBB colour."}
                )
        if self.is_default:
            clash = ThemePreset.objects.filter(is_default=True).exclude(pk=self.pk)
            if clash.exists():
                raise ValidationError(
                    {"is_default": "Another preset is already the default."}
                )

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
