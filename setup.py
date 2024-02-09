import io
import os
from setuptools import setup, find_packages

HERE = os.path.abspath(os.path.dirname(__file__))


def load_readme():
    with io.open(os.path.join(HERE, "README.rst"), "rt", encoding="utf8") as f:
        return f.read()


def load_about():
    about = {}
    with io.open(
        os.path.join(HERE, "nlatheme", "__about__.py"),
        "rt",
        encoding="utf-8",
    ) as f:
        exec(f.read(), about)  # pylint: disable=exec-used
    return about


ABOUT = load_about()


setup(
    name="nla-theme-tutor-plugin",
    version=ABOUT["__version__"],
    url="https://github.com/newliteraciesalliance/tutor-nla-theme",
    project_urls={
        "Documentation": "https://docs.tutor.edly.io/",
        "Code": "https://github.com/newliteraciesalliance/tutor-nla-theme",
        "Issue tracker": "https://github.com/newliteraciesalliance/tutor-nla-theme/issues",
    },
    license="AGPLv3",
    author="New Literacies Alliance",
    author_email="newliteraciesalliance@gmail.com",
    maintainer="K-State Libraries",
    maintainer_email="libadm@ksu.edu",
    description="NLA theme plugin for Tutor based on Indigo",
    long_description=load_readme(),
    packages=find_packages(exclude=["tests*"]),
    include_package_data=True,
    python_requires=">=3.8",
    install_requires=["tutor>=17.0.0,<18.0.0", "tutor-mfe>=17.0.0,<18.0.0"],
    extras_require={"dev": "tutor[dev]>=17.0.0,<18.0.0"},
    entry_points={"tutor.plugin.v1": ["nla-theme = nlatheme.plugin"]},
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
