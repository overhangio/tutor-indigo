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

<a id='changelog-18.1.1'></a>
## v18.1.1 (2024-08-27)

- [BugFix] Add the Indigo footer in MFEs via env.config.jsx to resolve display issues on the /account/ page after upgrading to Redwood. (by @hinakhadim)

<a id='changelog-18.1.0'></a>
## v18.1.0 (2024-07-23)

- [Improvement] Instead of forcing users to use Authentication MFe, the platform decides how users should log in. (by @CodeWithEmad)

- [Feature] Dark theme: the Indigo theme now covers dark theme for LMS pages, including the MFEs, and they are more beautiful!  (by @tanveer65 and @hinakhadim)

<a id='changelog-18.0.0'></a>
## v18.0.0 (2024-06-20)

- 💥[Feature] Upgrade to Redwood (by @hinakhadim)

<a id='changelog-17.4.2'></a>
## v17.4.2 (2024-06-11)

- [BugFix] Add big screen variable of screen responsiveness (by @tanveer65)

<a id='changelog-17.4.1'></a>
## v17.4.1 (2024-06-10)

- [BugFix] Remove undefined variables of dark-theme. (by @hinakhadim)

<a id='changelog-17.4.0'></a>
## v17.4.0 (2024-06-10)

- [Bugfix] Make plugin compatible with Python 3.12 by removing dependency on `pkg_resources`. (by @regisb)

- [Bugfix] *.scss files in cms directory were not rendered in the tutor environment because they are stored in a "partials" subdirectory. (by @Talha-Rizwan)

- [Improvement] Add styles for Profile and Account MFE and increase container width for better readability. (by @tanveer65)

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


