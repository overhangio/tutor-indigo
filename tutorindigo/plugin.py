from __future__ import annotations

import itertools
import json
import os
import typing as t
from glob import glob

import importlib_resources
from tutor import exceptions, hooks
from tutor.__about__ import __version_suffix__
from tutormfe.hooks import (
    FRONTEND_COMPAT_SLOTS,
    MFE_APPS,
    MFE_ATTRS_TYPE,
    PLUGIN_SLOTS,
)

from .__about__ import __version__

# Handle version suffix in main mode, just like tutor core
if __version_suffix__:
    __version__ += "-" + __version_suffix__


# brand-openedx version used for the MFE styles. After every change in
# edly-io/brand-openedx, a new tag must be used to avoid using cached changes
BRAND_VERSION = "indigo-3.1.1"

################# Configuration
config: t.Dict[str, t.Dict[str, t.Any]] = {
    # Add here your new settings
    "defaults": {
        "VERSION": __version__,
        "WELCOME_MESSAGE": "The place for all your online learning",
        "PRIMARY_COLOR": "#15376D",  # Indigo
        "ENABLE_DARK_TOGGLE": True,
        # Footer links are dictionaries with a "title" and "url"
        # To remove all links, run:
        # tutor config save --set INDIGO_FOOTER_NAV_LINKS=[]
        "FOOTER_NAV_LINKS": [
            {"title": "About Us", "url": "/about"},
            {"title": "Blog", "url": "/blog"},
            {"title": "Donate", "url": "/donate"},
            {"title": "Terms of Service", "url": "/tos"},
            {"title": "Privacy Policy", "url": "/privacy"},
            {"title": "Help", "url": "/help"},
            {"title": "Contact Us", "url": "/contact"},
        ],
        # Base URL of the compiled brand-openedx CSS (core, light and dark
        # .min.css files) loaded by the MFEs
        "BRAND_CSS_BASE_URL": (
            f"https://cdn.jsdelivr.net/gh/edly-io/brand-openedx@{BRAND_VERSION}/dist"
        ),
        # Local brand-openedx checkout, used by "tutor dev" only
        "BRAND_OPENEDX_PATH": "",
        "BRAND_OPENEDX_DEV_PORT": 3000,
        "BRAND_OPENEDX_DEV_DOCKER_IMAGE": "docker.io/node:22",
    },
    "unique": {},
    "overrides": {},
}

# Theme templates
hooks.Filters.ENV_TEMPLATE_ROOTS.add_item(
    str(importlib_resources.files("tutorindigo") / "templates")
)
# This is where the theme is rendered in the openedx build directory
hooks.Filters.ENV_TEMPLATE_TARGETS.add_items(
    [
        ("indigo", "build/openedx/themes"),
        ("indigo/env.config.jsx", "plugins/mfe/build/mfe"),
    ],
)

# Force the rendering of scss files, even though they are included in a
# "partials" directory
hooks.Filters.ENV_PATTERNS_INCLUDE.add_items(
    [
        r"indigo/lms/static/sass/partials/lms/theme/",
        r"indigo/cms/static/sass/partials/cms/theme/",
    ]
)


# init script: set theme automatically
with open(
    os.path.join(
        str(importlib_resources.files("tutorindigo") / "templates"),
        "indigo",
        "tasks",
        "init.sh",
    ),
    encoding="utf-8",
) as task_file:
    hooks.Filters.CLI_DO_INIT_TASKS.add_item(("lms", task_file.read()))


# Override openedx & mfe docker image names
@hooks.Filters.CONFIG_DEFAULTS.add(priority=hooks.priorities.LOW)
def _override_openedx_docker_image(
    items: list[tuple[str, t.Any]],
) -> list[tuple[str, t.Any]]:
    openedx_image = ""
    mfe_image = ""
    for k, v in items:
        if k == "DOCKER_IMAGE_OPENEDX":
            openedx_image = v
        elif k == "MFE_DOCKER_IMAGE":
            mfe_image = v
    if openedx_image:
        items.append(("DOCKER_IMAGE_OPENEDX", f"{openedx_image}-indigo"))
    if mfe_image:
        items.append(("MFE_DOCKER_IMAGE", f"{mfe_image}-indigo"))
    return items


# Load all configuration entries
hooks.Filters.CONFIG_DEFAULTS.add_items(
    [(f"INDIGO_{key}", value) for key, value in config["defaults"].items()]
)
hooks.Filters.CONFIG_UNIQUE.add_items(
    [(f"INDIGO_{key}", value) for key, value in config["unique"].items()]
)
hooks.Filters.CONFIG_OVERRIDES.add_items(list(config["overrides"].items()))


#  MFEs that are styled using Indigo
indigo_styled_mfes = [
    "learning",
    "learner-dashboard",
    "profile",
    "account",
    "discussions",
    "authoring",
    "catalog",
]

# Add react components and patches from tutor-indigo
for path in itertools.chain(
    glob(
        os.path.join(str(importlib_resources.files("tutorindigo") / "components"), "*")
    ),
    glob(os.path.join(str(importlib_resources.files("tutorindigo") / "patches"), "*")),
):
    with open(path, encoding="utf-8") as patch_file:
        hooks.Filters.ENV_PATCHES.add_item((os.path.basename(path), patch_file.read()))


INDIGO_FOOTER_SLOT = (
    "org.openedx.frontend.layout.footer.v1",
    """
    {
        op: PLUGIN_OPERATIONS.Hide,
        widgetId: 'default_contents',
    },
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'indigo_footer',
            type: DIRECT_PLUGIN,
            priority: 1,
            RenderWidget: IndigoFooter,
        },
    },
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'read_theme_cookie',
            type: DIRECT_PLUGIN,
            priority: 2,
            RenderWidget: AddDarkTheme,
        },
    },
""",
)

INDIGO_FOOTER_COMPAT_SLOT = (
    "org.openedx.frontend.layout.footer.v1",
    """
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'indigo_footer',
            type: DIRECT_PLUGIN,
            priority: 1,
            RenderWidget: IndigoFooter,
        },
    },
""",
)

INDIGO_DESKTOP_SECONDARY_MENU_SLOT = (
    "desktop_secondary_menu_slot",
    """
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'theme_switch_button',
            type: DIRECT_PLUGIN,
            RenderWidget: ToggleThemeButton,
        },
    },
""",
)

INDIGO_LOGO_SLOT = (
    "logo_slot",
    """
    {
        op: PLUGIN_OPERATIONS.Hide,
        widgetId: 'default_contents',
    },
    {
        op: PLUGIN_OPERATIONS.Insert,
        widget: {
            id: 'custom_logo',
            type: DIRECT_PLUGIN,
            RenderWidget: ThemedLogo,
        }
    }
""",
)

# Frontend-base site compatibility
FRONTEND_COMPAT_SLOTS.add_item(("all", *INDIGO_FOOTER_COMPAT_SLOT))
FRONTEND_COMPAT_SLOTS.add_item(("all", *INDIGO_DESKTOP_SECONDARY_MENU_SLOT))
FRONTEND_COMPAT_SLOTS.add_item(("all", *INDIGO_LOGO_SLOT))

for mfe in indigo_styled_mfes:
    PLUGIN_SLOTS.add_item((mfe, *INDIGO_FOOTER_SLOT))
    if mfe != "learning":
        PLUGIN_SLOTS.add_item((mfe, *INDIGO_DESKTOP_SECONDARY_MENU_SLOT))

PLUGIN_SLOTS.add_items(
    [
        (
            # Hide the default Help Link added in plugin slot
            "learning",
            "learning_help_slot",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        }
        """,
        ),
        (
            "learning",
            "learning_help_slot",
            """
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'theme_switch_button',
                type: DIRECT_PLUGIN,
                RenderWidget: ToggleThemeButton,
            },
        },
        """,
        ),
    ]
)

PLUGIN_SLOTS.add_items(
    [
        (
            "authoring",
            "org.openedx.frontend.layout.studio_header_search_button_slot.v1",
            """
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                priority: 10,
                id: 'custom_notification_tray_before',
                type: DIRECT_PLUGIN,
                RenderWidget: ToggleThemeButton,
            },
        },
        """,
        ),
        (
            "authoring",
            "org.openedx.frontend.layout.studio_footer.v1",
            """
            {
                op: PLUGIN_OPERATIONS.Insert,
                widget: {
                    id: 'read_theme_cookie',
                    type: DIRECT_PLUGIN,
                    priority: 2,
                    RenderWidget: AddDarkTheme,
                },
            },
        """,
        ),
    ]
)

paragon_theme_urls = {
    "core": {
        "urls": {
            "brandOverride": "{{ INDIGO_BRAND_CSS_BASE_URL }}/core.min.css",
        },
    },
    "variants": {
        "light": {
            "urls": {
                "brandOverride": "{{ INDIGO_BRAND_CSS_BASE_URL }}/light.min.css",
            },
        },
        "dark": {
            "urls": {
                "brandOverride": "{{ INDIGO_BRAND_CSS_BASE_URL }}/dark.min.css",
            },
        },
    },
}

frontend_base_theme = {
    "core": {
        "url": "{{ INDIGO_BRAND_CSS_BASE_URL }}/core.min.css",
    },
    "defaults": {
        "light": "light",
        "dark": "dark",
    },
    "variants": {
        "light": {
            "url": "{{ INDIGO_BRAND_CSS_BASE_URL }}/light.min.css",
        },
        "dark": {
            "url": "{{ INDIGO_BRAND_CSS_BASE_URL }}/dark.min.css",
        },
    },
}

hooks.Filters.CONFIG_DEFAULTS.add_item(("PARAGON_THEME_URLS", paragon_theme_urls))

hooks.Filters.ENV_PATCHES.add_item(
    (
        "mfe-lms-common-settings",
        """
MFE_CONFIG["PARAGON_THEME_URLS"] = {{ PARAGON_THEME_URLS }}
FRONTEND_SITE_CONFIG.setdefault("commonAppConfig", {})
FRONTEND_SITE_CONFIG["theme"] = """
        + json.dumps(frontend_base_theme)
        + """
FRONTEND_SITE_CONFIG["commonAppConfig"]["PARAGON_THEME_URLS"] = {{ PARAGON_THEME_URLS }}
FRONTEND_SITE_CONFIG["commonAppConfig"][
    "INDIGO_ENABLE_DARK_TOGGLE"
] = {{ INDIGO_ENABLE_DARK_TOGGLE }}
FRONTEND_SITE_CONFIG["commonAppConfig"][
    "INDIGO_FOOTER_NAV_LINKS"
] = {{ INDIGO_FOOTER_NAV_LINKS }}
""",
    )
)


@MFE_APPS.add()  # type: ignore
def _add_themed_logo(
    mfes: dict[str, MFE_ATTRS_TYPE],
) -> dict[str, MFE_ATTRS_TYPE]:
    for mfe in mfes:
        PLUGIN_SLOTS.add_item((str(mfe), *INDIGO_LOGO_SLOT))

    return mfes


PLUGIN_SLOTS.add_items(
    [
        (
            "catalog",
            "org.openedx.frontend.catalog.home_page.course_card",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        }
        """,
        ),
        (
            "catalog",
            "org.openedx.frontend.catalog.home_page.course_card",
            """
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'indigo-catalog-home-course-card',
                type: DIRECT_PLUGIN,
                RenderWidget: (props) => (
                  <CourseCard {...props} />
                ),
            },
        },
        """,
        ),
        (
            "catalog",
            "org.openedx.frontend.catalog.course_catalog_page.data_table.course_card",
            """
        {
            op: PLUGIN_OPERATIONS.Hide,
            widgetId: 'default_contents',
        }
        """,
        ),
        (
            "catalog",
            "org.openedx.frontend.catalog.course_catalog_page.data_table.course_card",
            """
        {
            op: PLUGIN_OPERATIONS.Insert,
            widget: {
                id: 'indigo-catalog-course-card',
                type: DIRECT_PLUGIN,
                RenderWidget: (props) => (
                  <CourseCard {...props} />
                ),
            },
        },
        """,
        ),
    ]
)


################# Local brand-openedx for development


def _indigo_brand_path(path: str) -> str:
    """Resolve INDIGO_BRAND_OPENEDX_PATH to an absolute brand-openedx checkout path."""
    resolved = os.path.abspath(os.path.expanduser(str(path)))
    if not os.path.isfile(os.path.join(resolved, "package.json")):
        raise exceptions.TutorError(
            f"INDIGO_BRAND_OPENEDX_PATH={path!r} does not point to a brand-openedx "
            "checkout (no package.json found). Set it to the absolute path of your "
            "local brand-openedx clone, or unset it with:\n\n"
            "    tutor config save --unset INDIGO_BRAND_OPENEDX_PATH"
        )
    return resolved


hooks.Filters.ENV_TEMPLATE_FILTERS.add_item(("indigo_brand_path", _indigo_brand_path))

hooks.Filters.ENV_PATCHES.add_item(
    (
        "local-docker-compose-dev-services",
        """
{%- if INDIGO_BRAND_OPENEDX_PATH %}
indigo-brand:
    image: "{{ INDIGO_BRAND_OPENEDX_DEV_DOCKER_IMAGE }}"
    working_dir: /openedx/brand-openedx
    command:
        - sh
        - -c
        - |
          set -e
          npm install --no-audit --no-fund
          mkdir -p dist /tmp/indigo-no-themes
          # Unlike "make build", keep dist/ so that the CSS is served while rebuilding
          FULL_BUILD="npm run build-tokens && npm run build-scss"
          # core.css only, for SCSS changes
          CORE_BUILD="npx paragon build-scss --corePath ./paragon/core.scss \\
            --themesPath /tmp/indigo-no-themes"
          if [ -f dist/theme-urls.json ]; then
            sh -c "$$FULL_BUILD" &
          else
            sh -c "$$FULL_BUILD"
          fi
          npx nodemon --legacy-watch --on-change-only --watch paragon --watch themes \\
            --ignore 'paragon/build/**' --ignore 'paragon/tokens/**' \\
            --ext scss,css --exec "$$CORE_BUILD" &
          npx nodemon --legacy-watch --on-change-only --watch paragon/tokens \\
            --ext json --exec "$$FULL_BUILD" &
          exec npx paragon serve-theme-css -h 0.0.0.0 \\
            -p {{ INDIGO_BRAND_OPENEDX_DEV_PORT }}
    ports:
        - "{{ INDIGO_BRAND_OPENEDX_DEV_PORT }}:{{ INDIGO_BRAND_OPENEDX_DEV_PORT }}"
    volumes:
        - "{{ INDIGO_BRAND_OPENEDX_PATH|indigo_brand_path }}:/openedx/brand-openedx"
        # Don't use the host's node_modules
        - /openedx/brand-openedx/node_modules
    restart: unless-stopped
{%- endif %}
""",
    )
)

# Low priority: override the theme URLs set by tutor-mfe and other plugins
hooks.Filters.ENV_PATCHES.add_item(
    (
        "openedx-lms-development-settings",
        """
{%- if INDIGO_BRAND_OPENEDX_PATH %}
_INDIGO_BRAND_URL = "http://localhost:{{ INDIGO_BRAND_OPENEDX_DEV_PORT }}"
# Same structure as the production theme URLs, served from the local service
MFE_CONFIG["PARAGON_THEME_URLS"] = {
    "core": {"urls": {"brandOverride": f"{_INDIGO_BRAND_URL}/core.css"}},
    "variants": {
        variant: {"urls": {"brandOverride": f"{_INDIGO_BRAND_URL}/{variant}.css"}}
        for variant in ("light", "dark")
    },
}
FRONTEND_SITE_CONFIG.setdefault("commonAppConfig", {})
FRONTEND_SITE_CONFIG["commonAppConfig"]["PARAGON_THEME_URLS"] = MFE_CONFIG[
    "PARAGON_THEME_URLS"
]
FRONTEND_SITE_CONFIG["theme"] = {
    "core": {"url": f"{_INDIGO_BRAND_URL}/core.css"},
    "defaults": {"light": "light", "dark": "dark"},
    "variants": {
        variant: {"url": f"{_INDIGO_BRAND_URL}/{variant}.css"}
        for variant in ("light", "dark")
    },
}
{%- endif %}
""",
    ),
    priority=hooks.priorities.LOW,
)
