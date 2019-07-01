Indigo, a cool blue theme for Open edX
======================================

Indigo is an elegant, customizable theme for `Open edX <https://open.edx.org>`__.

.. image:: ./screenshots/01-landing-page.png
    :alt: Platform landing page

Installation
------------

Indigo was specially developed to be used with `Tutor <https://docs.overhang.io>`__ (at least v3.11.1). If you have not installed Open edX with Tutor, then installation instructions will vary.

Clone the theme repository::

    git clone https://github.com/overhangio/indigo

Render your theme::
    
    tutor config render --extra-config ./indigo/config.yml ./indigo/theme "$(tutor config printroot)/env/build/openedx/themes/indigo"

Rebuild the Openedx docker image::

    tutor images build openedx

Restart your platform::
    
    tutor local start -d
    
You will then have to enable the "indigo" theme, as per the `official documentation <https://edx.readthedocs.io/projects/edx-installing-configuring-and-running/en/latest/configuration/changing_appearance/theming/enable_themes.html#apply-a-theme-to-a-site>`__ (starting from step 3).

Customization
-------------

A few settings in the theme can be easily customised: this includes the theme primary color, landing page tagline, footer legal links. Theme settings are defined in the `config.yml <https://github.com/overhangio/indigo/blob/master/config.yml>`__ file at the root of the repository. You can override all or part of those settings by creating you own ``config-custom.yml`` file. Then, render the theme with::
    
    tutor config render \
        --extra-config ./indigo/config.yml \
        --extra-config ./indigo/config-custom.yml \
        ./indigo/theme "$(tutor config printroot)/env/build/openedx/themes/indigo"


License
-------

This work is licensed under the terms of the `GNU Affero General Public License (AGPL) <https://github.com/overhangio/indigo/blob/master/LICENSE.txt>`_.