from edx_rest_framework_extensions.auth.jwt.authentication import JwtAuthentication
from edx_rest_framework_extensions.auth.session.authentication import SessionAuthenticationAllowInactiveUser
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ThemePreset, UserTheme
from .serializers import ThemePresetSerializer, UserThemeSerializer


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
    tokens = dict(preset.tokens or {}) if preset else {}
    if preset:
        tokens.update(overrides.get(preset.slug) or {})

    return {
        "preset": preset.slug if preset else None,
        "variant": preset.variant if preset else None,
        "presets": ThemePresetSerializer(presets, many=True).data,
        "overrides": overrides,
        "tokens": tokens,
    }


class UserThemeView(APIView):
    authentication_classes = (JwtAuthentication, SessionAuthenticationAllowInactiveUser)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(build_payload(request.user))

    def put(self, request):
        return self._save(request, partial=False)

    def patch(self, request):
        return self._save(request, partial=True)

    def delete(self, request):
        UserTheme.objects.filter(user=request.user).delete()
        return Response(build_payload(request.user), status=status.HTTP_200_OK)

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

        if "overrides" in data:
            overrides = data["overrides"]
        elif user_theme:
            overrides = user_theme.overrides or {}
        else:
            overrides = {}

        UserTheme.objects.update_or_create(
            user=request.user,
            defaults={"preset": preset, "overrides": overrides},
        )
        return Response(build_payload(request.user))
