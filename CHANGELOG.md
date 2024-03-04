# Changelog

This file includes a history of past releases. Changes that were not yet added to a release are in the [changelog.d/](./changelog.d) folder.

<!--
⚠️ DO NOT ADD YOUR CHANGES TO THIS FILE! (unless you want to modify existing changelog entries in this file)
Changelog entries are managed by scriv. After you have made some changes to this plugin, create a changelog entry with:

    scriv create

Edit and commit the newly-created file in changelog.d.

If you need to create a new release, create a separate commit just for that. It is important to respect these
instructions, because git commits are used to generate release notes:
  - Modify the version number in `__about__.py`.
  - Collect changelog entries with `scriv collect`
  - The title of the commit should be the same as the new version: "vX.Y.Z".
-->

<!-- scriv-insert-here -->

<a id='changelog-17.3.0'></a>
## v17.3.0 (2024-03-04)

- 💥[Improvement] Allow the no_course_image.png image to pull from the current theme, not specifically named indigo (by @misilot)

- [Improvement] Remove mentions of INDIGO_FOOTER_LEGAL_LINKS in docs since it is no longer used by the plugin. (by @misilot)

- [Improvement] Style static pages of About, Contact, Privacy and bookmarks page (by @tanveer65)

<a id='changelog-17.2.0'></a>
## v17.2.0 (2024-01-27)

- 💥[Bugfix] Fixes: Minor Bug fixes with styling updates for discussion and learner-dashboard MFEs (by @hinakhadim and @TanveerAhmed)

<a id='changelog-17.1.0'></a>
## v17.1.0 (2023-12-13)

- 💥[Improvement] Complete overhaul and redesign: the Indigo theme now covers more pages, including the MFE footer and header, and they are more beautiful than ever! (by @hinakhadim and @TanveerAhmed)

<a id='changelog-17.0.0'></a>
## v17.0.0 (2023-12-09)

- 💥[Feature] Upgrade to Quince (by @hinakhadim)
- [Improvement] Add a scriv-compliant changelog. (by @regisb)
- [Improvement] Added Makefile and test action to repository and formatted code with Black and isort. (by @CodeWithEmad)


