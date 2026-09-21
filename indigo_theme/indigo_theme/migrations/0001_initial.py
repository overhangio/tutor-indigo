import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ThemePreset",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("slug", models.CharField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=128)),
                (
                    "variant",
                    models.CharField(
                        choices=[("light", "Light"), ("dark", "Dark")], max_length=16
                    ),
                ),
                ("tokens", models.JSONField(default=dict)),
                ("is_default", models.BooleanField(default=False)),
                ("order", models.PositiveIntegerField(default=0)),
            ],
            options={
                "ordering": ["order", "slug"],
            },
        ),
        migrations.CreateModel(
            name="UserTheme",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("overrides", models.JSONField(default=dict)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("modified", models.DateTimeField(auto_now=True)),
                (
                    "preset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="indigo_theme.themepreset",
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="indigo_theme",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
