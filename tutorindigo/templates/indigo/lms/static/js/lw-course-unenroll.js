/**
 * /courses unenroll dialog: the learner dashboard UnenrollConfirmModal (src/containers/
 * UnenrollConfirmModal) on a native <dialog>, opened from a card's "Unenroll" menu item.
 *
 *   confirm -> reason survey -> finished
 *
 * As in the learner dashboard with SHOW_UNENROLL_SURVEY on, confirming only moves to the survey;
 * the learner is unenrolled when the survey is submitted (Cancel there leaves them enrolled).
 *
 *  - POST /change_enrollment  course_id + enrollment_action=unenroll (the LMS enrollment view)
 *
 * window.lwCourseUnenrollOpen({ courseId, courseName, returnFocus, onUnenrolled })
 */
(function () {
  'use strict';

  var UNENROLL_URL = '/change_enrollment';
  // Learner dashboard config SHOW_UNENROLL_SURVEY (true in its .env); keep the two in step.
  var SHOW_UNENROLL_SURVEY = true;
  var STEPS = { confirm: 'confirm', reason: 'reason', finished: 'finished' };

  // Learner dashboard UnenrollConfirmModal/constants.js, same keys and order.
  var REASONS = [
    ['prereqs', 'I don\'t have the academic or language prerequisites'],
    ['difficulty', 'The course material was too hard'],
    ['easy', 'The course material was too easy'],
    ['goals', 'This won\'t help me reach my goals'],
    ['broken', 'Something was broken'],
    ['time', 'I don\'t have the time'],
    ['browse', 'I just wanted to browse the material'],
    ['support', 'I don\'t have enough support'],
    ['quality', 'I am not happy with the quality of the content'],
  ];
  var CUSTOM_REASON = 'custom';
  var DEFAULT_REASON = 'prefer-not-to-say';

  var gettext = window.gettext || function (s) { return s; };

  var dialog = null;
  var parts = {};
  var state = null;

  function csrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text) { node.textContent = text; }
    return node;
  }

  function button(label, variant, onClick) {
    var node = element('button', 'lw-unenroll-dialog__button' + (variant ? ' lw-unenroll-dialog__button--' + variant : ''), label);
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
  }

  function actions() {
    var row = element('div', 'lw-unenroll-dialog__actions');
    Array.prototype.forEach.call(arguments, function (node) { row.appendChild(node); });
    return row;
  }

  // "…from the course “Name”", with the name in italics like the learner dashboard.
  function courseSentence(template) {
    var p = element('p', 'lw-unenroll-dialog__text');
    var pieces = template.split('%(course_title)s');
    p.appendChild(document.createTextNode(pieces[0]));
    p.appendChild(element('span', 'lw-unenroll-dialog__course', '“' + state.courseName + '”'));
    p.appendChild(document.createTextNode(pieces.slice(1).join('')));
    return p;
  }

  function reasonOption(value, label) {
    var row = element('label', 'lw-unenroll-dialog__reason');
    var radio = element('input');
    radio.type = 'radio';
    radio.name = 'lw-unenroll-reason';
    radio.value = value;
    row.appendChild(radio);
    row.appendChild(document.createTextNode(label));
    return row;
  }

  function build() {
    dialog = element('dialog', 'lw-dialog lw-unenroll-dialog');
    dialog.setAttribute('aria-labelledby', 'lw-unenroll-dialog-title');

    var header = element('div', 'lw-dialog__header');
    parts.title = element('h2', 'lw-dialog__title');
    parts.title.id = 'lw-unenroll-dialog-title';
    header.appendChild(parts.title);

    parts.body = element('div', 'lw-unenroll-dialog__body');
    dialog.appendChild(header);
    dialog.appendChild(parts.body);

    // Escape: before unenrolling it is Cancel; once finished it is Ok (refresh the list).
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      if (!state || state.isSaving) { return; }
      if (state.step === STEPS.finished) { finish(); } else { close(); }
    });
    dialog.addEventListener('close', function () {
      var returnFocus = state && state.returnFocus;
      state = null;
      if (returnFocus && document.contains(returnFocus)) { returnFocus.focus(); }
    });
    document.body.appendChild(dialog);
  }

  function errorLine() {
    parts.error = element('p', 'lw-dialog__error', gettext('You could not be unenrolled. Please try again.'));
    parts.error.setAttribute('role', 'alert');
    parts.error.hidden = !state.isError;
    return parts.error;
  }

  function renderConfirm() {
    parts.title.textContent = gettext('Confirm Unenrollment');
    parts.body.appendChild(courseSentence(gettext('Are you sure you want to unenroll from the course %(course_title)s ?')));
    parts.body.appendChild(errorLine());
    parts.submit = button(gettext('Unenroll'), null, function () {
      if (SHOW_UNENROLL_SURVEY) {
        state.step = STEPS.reason;
        render();
      } else {
        submitReason();
      }
    });
    parts.cancel = button(gettext('Cancel'), 'tertiary', close);
    parts.body.appendChild(actions(parts.cancel, parts.submit));
    return parts.submit;
  }

  function renderReason() {
    parts.title.textContent = gettext('Why are you unenrolling?');
    var fieldset = element('fieldset', 'lw-unenroll-dialog__reasons');
    fieldset.setAttribute('aria-labelledby', 'lw-unenroll-dialog-title');
    REASONS.forEach(function (reason) {
      fieldset.appendChild(reasonOption(reason[0], gettext(reason[1])));
    });

    // "Other": a free-text reason; typing in the box selects its radio.
    var customRow = reasonOption(CUSTOM_REASON, '');
    customRow.querySelector('input[type="radio"]').setAttribute('aria-label', gettext('Other'));
    var custom = element('input', 'lw-unenroll-dialog__custom');
    custom.type = 'text';
    custom.placeholder = gettext('Other');
    custom.setAttribute('aria-label', gettext('Other'));
    custom.value = state.customReason;
    custom.addEventListener('input', function () {
      state.customReason = custom.value;
      state.selectedReason = CUSTOM_REASON;
      customRow.querySelector('input[type="radio"]').checked = true;
    });
    customRow.appendChild(custom);
    fieldset.appendChild(customRow);
    fieldset.appendChild(reasonOption(DEFAULT_REASON, gettext('I prefer not to say')));

    fieldset.addEventListener('change', function (event) {
      if (event.target.type === 'radio') { state.selectedReason = event.target.value; }
    });
    var selected = fieldset.querySelector('input[value="' + state.selectedReason + '"]');
    if (selected) { selected.checked = true; }
    parts.body.appendChild(fieldset);

    parts.body.appendChild(errorLine());

    parts.submit = button(gettext('Unenroll'), null, submitReason);
    parts.cancel = button(gettext('Cancel'), 'tertiary', close);
    parts.body.appendChild(actions(parts.cancel, parts.submit));
    return fieldset.querySelector('input:checked');
  }

  function renderFinished() {
    parts.title.textContent = gettext('Unenrollment Successful');
    parts.body.appendChild(courseSentence(gettext('You have been unenrolled from the course %(course_title)s')));
    var ok = button(gettext('Ok'), null, finish);
    parts.body.appendChild(actions(ok));
    return ok;
  }

  function render() {
    parts.body.textContent = '';
    parts.error = null;
    parts.submit = null;
    parts.cancel = null;
    var focusTarget;
    if (state.step === STEPS.confirm) {
      focusTarget = renderConfirm();
    } else if (state.step === STEPS.reason) {
      focusTarget = renderReason();
    } else {
      focusTarget = renderFinished();
    }
    if (focusTarget) { focusTarget.focus(); }
  }

  function submittedReason(owner) {
    return owner.selectedReason === CUSTOM_REASON ? owner.customReason : owner.selectedReason;
  }

  // Same event the learner dashboard sends (tracking/trackers/engagement.js unenrollReason),
  // through Segment when the LMS page has it. Sent once, after the unenroll succeeds, and only
  // when the survey was shown.
  function trackReason(owner) {
    if (SHOW_UNENROLL_SURVEY && window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track('unenrollment_reason.selected', {
        reason: submittedReason(owner),
        course_id: owner.courseId,
        category: 'user-engagement',
        displayName: 'v1',
        app_name: 'lms_courses',
      });
    }
  }

  function setSaving(isSaving) {
    state.isSaving = isSaving;
    if (parts.submit) { parts.submit.disabled = isSaving; }
    if (parts.cancel) { parts.cancel.disabled = isSaving; }
  }

  function unenroll() {
    var owner = state;
    setSaving(true);
    var body = new URLSearchParams({ course_id: owner.courseId, enrollment_action: 'unenroll' });
    fetch(UNENROLL_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRFToken': csrfToken() },
      body: body,
    }).then(function (response) {
      if (!response.ok) { throw new Error('unenroll_failed'); }
      trackReason(owner);
      if (owner !== state) {
        // The dialog was closed mid-request (Chrome lets a repeated Escape through): the learner
        // is unenrolled all the same, so still refresh the page.
        owner.onUnenrolled();
        return;
      }
      owner.didUnenroll = true;
      owner.isSaving = false;
      owner.step = STEPS.finished;
      render();
    }).catch(function () {
      if (owner !== state) { return; }
      setSaving(false);
      owner.isError = true;
      parts.error.hidden = false;
    });
  }

  function submitReason() {
    if (state.isSaving) { return; }
    state.isError = false;
    if (parts.error) { parts.error.hidden = true; }
    unenroll();
  }

  function close() {
    if (dialog.open) { dialog.close(); }
  }

  // Ok after unenrolling: tell the page so it can refresh the cards, then close.
  function finish() {
    var onUnenrolled = state && state.didUnenroll ? state.onUnenrolled : null;
    close();
    if (onUnenrolled) { onUnenrolled(); }
  }

  function open(options) {
    if (!dialog) { build(); }
    if (typeof dialog.showModal !== 'function') { return; }
    state = {
      courseId: options.courseId,
      courseName: options.courseName || '',
      returnFocus: options.returnFocus || null,
      onUnenrolled: options.onUnenrolled || function () {},
      step: STEPS.confirm,
      selectedReason: DEFAULT_REASON,
      customReason: '',
      isSaving: false,
      isError: false,
      didUnenroll: false,
    };
    dialog.showModal();
    render();
  }

  window.lwCourseUnenrollOpen = open;
}());
