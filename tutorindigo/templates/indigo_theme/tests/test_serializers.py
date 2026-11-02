from django.test import TestCase
from indigo_theme.constants import DEFAULT_PRESETS, PRIMARY_TOKEN
from indigo_theme.models import ThemePreset
from indigo_theme.serializers import UserThemeSerializer


class UserThemeSerializerTests(TestCase):
    def test_the_seed_migration_created_the_default_presets(self):
        slugs = set(ThemePreset.objects.values_list("slug", flat=True))
        self.assertEqual(slugs, {preset["slug"] for preset in DEFAULT_PRESETS})

    def assert_invalid(self, payload, field):
        serializer = UserThemeSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn(field, serializer.errors)

    def test_accepts_a_known_preset_without_overrides(self):
        serializer = UserThemeSerializer(data={"preset": "light", "overrides": {}})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_accepts_a_valid_override(self):
        serializer = UserThemeSerializer(
            data={"preset": "light", "overrides": {"light": {PRIMARY_TOKEN: "#128045"}}}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_rejects_an_unknown_preset(self):
        self.assert_invalid({"preset": "neon", "overrides": {}}, "preset")

    def test_rejects_overrides_for_an_unknown_preset(self):
        self.assert_invalid(
            {"preset": "light", "overrides": {"neon": {PRIMARY_TOKEN: "#128045"}}},
            "overrides",
        )

    def test_rejects_a_token_that_is_not_customizable(self):
        self.assert_invalid(
            {
                "preset": "light",
                "overrides": {"light": {"--pgn-color-black": "#128045"}},
            },
            "overrides",
        )

    def test_rejects_overrides_that_are_not_an_object(self):
        self.assert_invalid(
            {"preset": "light", "overrides": {"light": "#128045"}}, "overrides"
        )

    def test_rejects_malformed_colours(self):
        for colour in ["128045", "#12804", "#1280455", "red", "#12G045", ""]:
            with self.subTest(colour=colour):
                self.assert_invalid(
                    {
                        "preset": "light",
                        "overrides": {"light": {PRIMARY_TOKEN: colour}},
                    },
                    "overrides",
                )

    def test_rejects_a_non_string_colour(self):
        self.assert_invalid(
            {"preset": "light", "overrides": {"light": {PRIMARY_TOKEN: 123}}},
            "overrides",
        )

    def test_partial_allows_overrides_without_a_preset(self):
        serializer = UserThemeSerializer(
            data={"overrides": {"light": {PRIMARY_TOKEN: "#128045"}}}, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_non_partial_requires_a_preset(self):
        self.assert_invalid({"overrides": {}}, "preset")
