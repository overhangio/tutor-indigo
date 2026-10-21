import os
import re

from setuptools import find_packages, setup

HERE = os.path.abspath(os.path.dirname(__file__))


def get_version():
    with open(os.path.join(HERE, "indigo_theme", "__init__.py"), encoding="utf-8") as f:
        return re.search(r'^__version__ = ["\'](.*)["\']', f.read(), re.M).group(1)


setup(
    name="indigo-theme",
    version=get_version(),
    description="Per-user dynamic theming for Open edX, by the Indigo theme",
    long_description=open(os.path.join(HERE, "README.rst"), encoding="utf-8").read(),
    long_description_content_type="text/x-rst",
    author="Edly",
    author_email="hello@edly.io",
    url="https://github.com/overhangio/tutor-indigo",
    license="AGPL-3.0",
    packages=find_packages(include=["indigo_theme", "indigo_theme.*"]),
    include_package_data=True,
    python_requires=">=3.11",
    entry_points={
        "lms.djangoapp": [
            "indigo_theme = indigo_theme.apps:IndigoThemeConfig",
        ],
    },
    classifiers=[
        "Framework :: Django",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
