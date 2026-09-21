indigo-theme
============

Django app that powers the Indigo dynamic theme feature.

It stores, per learner, a preset theme (light or dark) and a set of Paragon
design-token colour overrides, and exposes them over a small REST API that the
Open edX micro-frontends read at runtime.

It is an edx-platform plugin app: installing it in the ``openedx`` image is
enough, it registers itself through the ``lms.djangoapp`` entry point and its
API is served under ``/api/indigo/v1/theme/``.

Endpoints
---------

``GET``, ``PUT``, ``PATCH`` and ``DELETE`` on ``/api/indigo/v1/theme/`` read and
write the authenticated user's theme.

License
-------

This work is licensed under the terms of the GNU Affero General Public
License (AGPL) version 3.
