SHELL := /bin/bash

SRC=source ./.venv/bin/activate &&

translation.requirements:
	rm -rf .venv
	python3.11 -m venv .venv
	$(SRC) pip install -r requirements.txt

translation.extract:
	$(SRC) PYTHONPATH=. DJANGO_SETTINGS_MODULE=translation_settings i18n_tool extract --no-segment
	$(SRC) cd ./conf/locale/en/LC_MESSAGES && \
		msgcat django.po mako.po underscore.po -o django.po && \
		rm mako.po underscore.po

translation.compile:
	$(SRC) PYTHONPATH=. DJANGO_SETTINGS_MODULE=translation_settings i18n_tool generate
