import re

from rest_framework import serializers

from .constants import CUSTOMIZABLE_TOKENS, HEX_COLOR_RE
from .models import ThemePreset


class ThemePresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemePreset
        fields = ("slug", "name", "variant", "tokens")


class UserThemeSerializer(serializers.Serializer):
    preset = serializers.CharField()
    overrides = serializers.DictField()

    def validate_preset(self, value):
        if not ThemePreset.objects.filter(slug=value).exists():
            raise serializers.ValidationError(f"Unknown theme preset: {value}")
        return value

    def validate_overrides(self, value):
        known_slugs = set(ThemePreset.objects.values_list("slug", flat=True))
        for slug, tokens in value.items():
            if slug not in known_slugs:
                raise serializers.ValidationError(f"Unknown theme preset: {slug}")
            if not isinstance(tokens, dict):
                raise serializers.ValidationError(
                    f"Overrides for preset {slug} must be an object"
                )
            for token, color in tokens.items():
                if token not in CUSTOMIZABLE_TOKENS:
                    raise serializers.ValidationError(
                        f"Token {token} is not customizable"
                    )
                if not isinstance(color, str) or not re.match(HEX_COLOR_RE, color):
                    raise serializers.ValidationError(
                        f"Value for {token} must be a #RRGGBB colour, got: {color}"
                    )
        return value
