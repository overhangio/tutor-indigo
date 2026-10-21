from django.test import TestCase
from indigo_theme.constants import DEFAULT_PRESETS, VARIANT_DARK, VARIANT_LIGHT
from indigo_theme.models import ThemePreset


class SeedDataTests(TestCase):
    def test_seed_data_defines_one_default(self):
        defaults = [preset for preset in DEFAULT_PRESETS if preset["is_default"]]
        self.assertEqual(len(defaults), 1)

    def test_seed_data_covers_both_variants(self):
        variants = {preset["variant"] for preset in DEFAULT_PRESETS}
        self.assertEqual(variants, {VARIANT_LIGHT, VARIANT_DARK})

    def test_seed_data_only_uses_customizable_tokens(self):
        from indigo_theme.constants import CUSTOMIZABLE_TOKENS

        for preset in DEFAULT_PRESETS:
            with self.subTest(preset=preset["slug"]):
                self.assertEqual(
                    set(preset["tokens"]) - set(CUSTOMIZABLE_TOKENS), set()
                )


class ThemePresetTests(TestCase):
    def test_get_default_returns_the_flagged_preset(self):
        self.assertTrue(ThemePreset.objects.filter(is_default=True).exists())
        self.assertEqual(ThemePreset.get_default().slug, "light")

    def test_get_default_falls_back_to_the_first_preset(self):
        ThemePreset.objects.all().delete()
        ThemePreset.objects.create(
            slug="only", name="Only", variant=VARIANT_LIGHT, tokens={}, is_default=False
        )
        self.assertEqual(ThemePreset.get_default().slug, "only")

    def test_get_default_is_none_without_presets(self):
        ThemePreset.objects.all().delete()
        self.assertIsNone(ThemePreset.get_default())
