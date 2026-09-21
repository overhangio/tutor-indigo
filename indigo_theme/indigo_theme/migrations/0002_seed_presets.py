from django.db import migrations

from indigo_theme.constants import DEFAULT_PRESETS


def seed_presets(apps, schema_editor):
    ThemePreset = apps.get_model("indigo_theme", "ThemePreset")
    for preset in DEFAULT_PRESETS:
        defaults = {key: value for key, value in preset.items() if key != "slug"}
        ThemePreset.objects.update_or_create(slug=preset["slug"], defaults=defaults)


class Migration(migrations.Migration):
    dependencies = [
        ("indigo_theme", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_presets, migrations.RunPython.noop),
    ]
