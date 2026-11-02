import hashlib
import json
import re

from django.conf import settings
from edx_rest_framework_extensions.auth.jwt.authentication import JwtAuthentication
from edx_rest_framework_extensions.auth.session.authentication import (
    SessionAuthenticationAllowInactiveUser,
)
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .constants import HEX_COLOR_RE, PRIMARY_TOKEN, VARIANT_LIGHT
from .models import ThemePreset, UserTheme
from .serializers import ThemePresetSerializer, UserThemeSerializer


def platform_primary_color():
    color = (getattr(settings, "INDIGO_PRIMARY_COLOR", "") or "").strip()
    if not re.match(HEX_COLOR_RE, color):
        return ""
    return color.upper()


def build_payload(user):
    presets = list(ThemePreset.objects.all())
    user_theme = UserTheme.objects.filter(user=user).select_related("preset").first()
    if user_theme:
        preset = user_theme.preset
        stored_overrides = user_theme.overrides or {}
    else:
        preset = ThemePreset.get_default()
        stored_overrides = {}

    overrides = {
        item.slug: dict(stored_overrides.get(item.slug) or {}) for item in presets
    }
    serialized = ThemePresetSerializer(presets, many=True).data

    primary = platform_primary_color()
    if primary:
        for item in serialized:
            if item.get("variant") == VARIANT_LIGHT:
                item["tokens"] = {**(item.get("tokens") or {}), PRIMARY_TOKEN: primary}

    defaults = {}
    if preset:
        for item in serialized:
            if item.get("slug") == preset.slug:
                defaults = dict(item.get("tokens") or {})
    tokens = defaults
    if preset:
        tokens.update(overrides.get(preset.slug) or {})

    return {
        "preset": preset.slug if preset else None,
        "variant": preset.variant if preset else None,
        "stored": user_theme is not None,
        "presets": serialized,
        "overrides": overrides,
        "tokens": tokens,
    }


def payload_etag(payload):
    digest = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return f'W/"{digest[:32]}"'


def themed_response(payload, request=None, status_code=status.HTTP_200_OK):
    etag = payload_etag(payload)
    if request is not None and request.headers.get("If-None-Match") == etag:
        response = Response(status=status.HTTP_304_NOT_MODIFIED)
    else:
        response = Response(payload, status=status_code)
    response["ETag"] = etag
    response["Cache-Control"] = "private, max-age=0, must-revalidate"
    response["Vary"] = "Cookie, Authorization"
    return response


class UserThemeView(APIView):
    authentication_classes = (JwtAuthentication, SessionAuthenticationAllowInactiveUser)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return themed_response(build_payload(request.user), request)

    def put(self, request):
        return self._save(request, partial=False)

    def patch(self, request):
        return self._save(request, partial=True)

    def delete(self, request):
        UserTheme.objects.filter(user=request.user).delete()
        return themed_response(build_payload(request.user))

    def _save(self, request, partial):
        serializer = UserThemeSerializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user_theme = UserTheme.objects.filter(user=request.user).first()
        if "preset" in data:
            preset = ThemePreset.objects.get(slug=data["preset"])
        elif user_theme:
            preset = user_theme.preset
        else:
            preset = ThemePreset.get_default()

        if preset is None:
            return Response(
                {"preset": ["No theme preset is available."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        overrides = dict(user_theme.overrides or {}) if user_theme else {}
        if "overrides" in data:
            if partial:
                for slug, tokens in data["overrides"].items():
                    merged = dict(overrides.get(slug) or {})
                    merged.update(tokens)
                    overrides[slug] = merged
            else:
                overrides = data["overrides"]

        UserTheme.objects.update_or_create(
            user=request.user,
            defaults={"preset": preset, "overrides": overrides},
        )
        return themed_response(build_payload(request.user))
