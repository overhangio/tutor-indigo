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
    
You will then have to enable the "indigo" theme, as per the `Tutor documentation <https://docs.tutor.overhang.io/local.html#setting-a-new-theme>`__::
    
    tutor local settheme indigo localhost studio.localhost \
        $(tutor config printvalue LMS_HOST) $(tutor config printvalue CMS_HOST)

Customization
-------------

Setting custom values
~~~~~~~~~~~~~~~~~~~~~

A few settings in the theme can be easily customised: this includes the theme primary color, landing page tagline, footer legal links. Theme settings are defined in the `config.yml <https://github.com/overhangio/indigo/blob/master/config.yml>`__ file at the root of the repository. You can override all or part of those settings by creating you own ``config-custom.yml`` file. Then, render the theme with::
    
    tutor config render \
        --extra-config ./indigo/config.yml \
        --extra-config ./indigo/config-custom.yml \
        ./indigo/theme "$(tutor config printroot)/env/build/openedx/themes/indigo"

Changing the default logo and other images
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The theme images are stored in `indigo/theme/lms/static/images <https://github.com/overhangio/indigo/tree/master/theme/lms/static/images>`__ for the LMS, and in `indigo/theme/cms/static/images <https://github.com/overhangio/indigo/tree/master/theme/cms/static/images>`__ for the CMS. To use custom images in your theme, just replace the files stored in these folders with your own prior to running ``tutor config render``.

License
-------

This work is licensed under the terms of the `GNU Affero General Public License (AGPL) <https://github.com/overhangio/indigo/blob/master/LICENSE.txt>`_.