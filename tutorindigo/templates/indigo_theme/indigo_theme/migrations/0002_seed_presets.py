from django.db import migrations

SEED_PRESETS = [
    {
        "slug": "light",
        "name": "Light",
        "variant": "light",
        "is_default": True,
        "order": 0,
        "tokens": {
            "--pgn-color-primary-base": "#15376D",
            "--pgn-color-primary-light": "#F2F7F8",
            "--pgn-color-brand-base": "#9D0054",
            "--pgn-color-text-base": "#111827",
            "--pgn-color-info-base": "#006DAA",
        },
    },
    {
        "slug": "dark",
        "name": "Dark",
        "variant": "dark",
        "is_default": False,
        "order": 1,
        "tokens": {
            "--pgn-color-primary-base": "#AEC7F6",
            "--pgn-color-primary-light": "#292A2C",
            "--pgn-color-brand-base": "#CE80AA",
            "--pgn-color-text-base": "#F8F8F8",
            "--pgn-color-info-base": "#006DAA",
        },
    },
]


def seed_presets(apps, schema_editor):
    ThemePreset = apps.get_model("indigo_theme", "ThemePreset")
    for preset in SEED_PRESETS:
        defaults = {key: value for key, value in preset.items() if key != "slug"}
        ThemePreset.objects.update_or_create(slug=preset["slug"], defaults=defaults)


class Migration(migrations.Migration):
    dependencies = [
        ("indigo_theme", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_presets, migrations.RunPython.noop),
    ]
