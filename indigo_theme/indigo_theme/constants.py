VARIANT_LIGHT = "light"
VARIANT_DARK = "dark"
VARIANT_CHOICES = [(VARIANT_LIGHT, "Light"), (VARIANT_DARK, "Dark")]

CUSTOMIZABLE_TOKENS = [
    "--pgn-color-primary-base",
    "--pgn-color-primary-light",
    "--pgn-color-brand-base",
    "--pgn-color-text-base",
    "--pgn-color-info-base",
]

DEFAULT_PRESETS = [
    {
        "slug": "light",
        "name": "Light",
        "variant": VARIANT_LIGHT,
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
        "variant": VARIANT_DARK,
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

HEX_COLOR_RE = r"^#[0-9a-fA-F]{6}$"
