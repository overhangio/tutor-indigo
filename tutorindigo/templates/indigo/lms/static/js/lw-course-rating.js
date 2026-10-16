/**
 * /courses rating dialog: the learner dashboard CourseRatingModal (src/containers/
 * CourseRatingModal) on a native <dialog>, opened from a card's "Rate this course" menu item.
 *
 *  - GET  /api/course_assignments/v1/rating/?course_id=…  average, count, own rating, raters
 *  - POST /api/course_assignments/v1/rating/              {course_id, rating} -> same summary
 *
 * Picking a star saves right away (no submit button). The pick shows immediately and reverts
 * to the saved rating if the save fails. Only one save per course runs at a time, even across
 * openings of the dialog: a pick made during a save is sent when that save settles, and the
 * summary loaded on open waits for it, so quick changes are never dropped or reordered.
 *
 * window.lwCourseRatingOpen({ courseId, courseName, cardInfo, returnFocus, onSaved })
 */
(function () {
  'use strict';

  var RATING_URL = '/api/course_assignments/v1/rating/';
  var STARS = [1, 2, 3, 4, 5];
  var KEY_STEPS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };

  var gettext = window.gettext || function (s) { return s; };
  var ngettext = window.ngettext || function (s, p, n) { return n === 1 ? s : p; };
  var interpolate = function (fmt, values) {
    return fmt.replace(/%\((\w+)\)s/g, function (match, key) { return values[key]; });
  };

  var dialog = null;
  var parts = {};
  var state = null;
  // Bumped on every open, so responses for a previous course never touch the dialog.
  var session = 0;
  // Course id -> the latest rating POST (settled either way), so saves and the summary
  // loaded on open run strictly after it, even if the dialog was closed and reopened.
  var inflight = {};

  function csrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function requestJson(url, options) {
    var init = Object.assign({ credentials: 'same-origin' }, options);
    init.headers = Object.assign({ Accept: 'application/json' }, init.headers);
    return fetch(url, init).then(function (response) {
      if (!response.ok) { throw new Error('rating_request_failed'); }
      return response.json();
    });
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text) { node.textContent = text; }
    return node;
  }

  function icon(name) {
    var node = element('span', 'lw-icon lw-icon--' + name);
    node.setAttribute('aria-hidden', 'true');
    return node;
  }

  function build() {
    dialog = element('dialog', 'lw-dialog lw-rating-dialog');
    dialog.setAttribute('aria-labelledby', 'lw-rating-dialog-title');

    var header = element('div', 'lw-dialog__header');
    parts.title = element('h2', 'lw-dialog__title');
    parts.title.id = 'lw-rating-dialog-title';
    var close = element('button', 'lw-dialog__close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', gettext('Close'));
    close.addEventListener('click', function () { dialog.close(); });
    header.appendChild(parts.title);
    header.appendChild(close);

    var body = element('div', 'lw-rating-dialog__body');
    var prompt = element('p', 'lw-rating-dialog__code', gettext('Select your rating'));
    prompt.id = 'lw-rating-dialog-prompt';

    parts.stars = element('div', 'lw-rating-dialog__stars');
    parts.stars.setAttribute('role', 'group');
    parts.stars.setAttribute('aria-labelledby', 'lw-rating-dialog-prompt');
    STARS.forEach(function (stars) {
      var button = element('button', 'lw-rating-dialog__star');
      button.type = 'button';
      button.setAttribute('data-stars', String(stars));
      button.setAttribute('aria-label', interpolate(
        ngettext('Rate %(stars)s star', 'Rate %(stars)s stars', stars), { stars: stars }
      ));
      button.appendChild(icon('star'));
      button.addEventListener('click', function () { selectRating(stars); });
      button.addEventListener('keydown', handleStarKey);
      // Hover (or keyboard focus) previews a rating; clicking it saves.
      button.addEventListener('mouseenter', function () { preview(stars); });
      button.addEventListener('focus', function () { preview(stars); });
      button.addEventListener('mouseleave', function () { preview(null); });
      button.addEventListener('blur', function () { preview(null); });
      parts.stars.appendChild(button);
    });

    parts.count = element('p', 'lw-rating-dialog__code');
    // Decorative: the count above already says how many learners rated.
    parts.raters = element('div', 'lw-rating-dialog__raters');
    parts.raters.setAttribute('aria-hidden', 'true');
    parts.status = element('p', 'lw-sr-only');
    parts.status.setAttribute('aria-live', 'polite');
    parts.error = element('p', 'lw-dialog__error', gettext('Your rating could not be saved. Please try again.'));
    parts.error.setAttribute('role', 'alert');

    [prompt, parts.stars, parts.count, parts.raters, parts.status, parts.error].forEach(function (node) {
      body.appendChild(node);
    });
    dialog.appendChild(header);
    dialog.appendChild(body);

    // A click on the backdrop lands on the <dialog> itself.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { dialog.close(); }
    });
    dialog.addEventListener('close', function () {
      var returnFocus = state && state.returnFocus;
      state = null;
      if (returnFocus && document.contains(returnFocus)) { returnFocus.focus(); }
    });
    document.body.appendChild(dialog);
  }

  function currentRating() {
    return state.pending !== null ? state.pending : state.saved;
  }

  function render() {
    var rating = currentRating();
    var shown = state.preview !== null ? state.preview : (rating || 0);
    parts.title.textContent = state.courseName || gettext('Select your rating');

    Array.prototype.forEach.call(parts.stars.children, function (button) {
      var stars = Number(button.getAttribute('data-stars'));
      button.classList.toggle('is-filled', shown >= stars);
      button.setAttribute('aria-pressed', rating === stars ? 'true' : 'false');
      // Roving tabindex: Tab lands on the current rating (or the first star).
      button.tabIndex = stars === (rating || 1) ? 0 : -1;
    });

    parts.count.textContent = state.count > 0
      ? interpolate(ngettext('Rated by %(count)s learner', 'Rated by %(count)s learners', state.count), { count: state.count })
      : gettext('Be the first to rate this course');

    parts.error.hidden = !state.isError;
  }

  // Learners whose profile isn't public (or whose photo fails to load) get a generic avatar.
  function genericAvatar() {
    var node = element('span', 'lw-rating-dialog__avatar');
    node.appendChild(icon('person'));
    return node;
  }

  function renderRaters() {
    parts.raters.textContent = '';
    state.raters.forEach(function (rater) {
      if (!rater.profile_image_url) {
        parts.raters.appendChild(genericAvatar());
        return;
      }
      var img = element('img', 'lw-rating-dialog__avatar');
      img.alt = '';
      img.src = rater.profile_image_url;
      img.addEventListener('error', function () { img.replaceWith(genericAvatar()); });
      parts.raters.appendChild(img);
    });
    var hidden = state.count - state.raters.length;
    if (state.raters.length && hidden > 0) {
      parts.raters.appendChild(element(
        'span', 'lw-rating-dialog__avatar lw-rating-dialog__avatar--more',
        interpolate(gettext('+%(count)s'), { count: hidden })
      ));
    }
    parts.raters.hidden = !state.raters.length;
  }

  function preview(stars) {
    if (!state) { return; }
    state.preview = stars;
    render();
  }

  // Arrow keys move focus between the stars; Enter/Space picks the focused one.
  function handleStarKey(event) {
    var step = KEY_STEPS[event.key];
    if (!step) { return; }
    event.preventDefault();
    var current = Number(event.currentTarget.getAttribute('data-stars'));
    var next = Math.min(5, Math.max(1, current + step));
    parts.stars.querySelector('[data-stars="' + next + '"]').focus();
  }

  function applySummary(summary) {
    state.saved = summary.user_rating === undefined ? state.saved : summary.user_rating;
    state.count = Number(summary.rating_count) || 0;
    state.raters = Array.isArray(summary.recent_raters) ? summary.recent_raters : state.raters;
    // Avatars are images: redraw them only when the raters change, not on every hover.
    renderRaters();
  }

  function save(rating, owner) {
    state.isSaving = true;
    // Once a save starts, the summary loaded on open is older than what the POST returns.
    state.hasSaved = true;
    state.isError = false;
    parts.status.textContent = gettext('Saving your rating');
    render();

    var previous = inflight[owner.courseId] || Promise.resolve();
    var request = previous.then(function () {
      return requestJson(RATING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
        body: JSON.stringify({ course_id: owner.courseId, rating: rating }),
      });
    });
    inflight[owner.courseId] = request.catch(function () {});

    request.then(function (summary) {
      owner.onSaved(summary);
      if (owner !== state) { return; }
      applySummary(summary);
      settle(rating, true);
    }, function () {
      if (owner !== state) { return; }
      settle(rating, false);
    });
  }

  function settle(rating, succeeded) {
    if (state.latestPick !== null && state.latestPick !== rating) {
      save(state.latestPick, state);
      return;
    }
    // Done. On error the saved rating shows again and the dialog explains why.
    state.isSaving = false;
    state.latestPick = null;
    state.pending = null;
    state.isError = !succeeded;
    parts.status.textContent = succeeded ? gettext('Your rating was saved') : '';
    render();
  }

  function selectRating(rating) {
    if (!state || rating === currentRating()) { return; }
    state.pending = rating;
    state.latestPick = rating;
    if (state.isSaving) {
      render();
    } else {
      save(rating, state);
    }
  }

  function open(options) {
    if (!dialog) { build(); }
    if (typeof dialog.showModal !== 'function') { return; }

    var cardInfo = options.cardInfo || {};
    session += 1;
    var openedSession = session;
    // Card-info already has the count and the learner's rating, so the dialog has numbers
    // to show while the summary (with the raters' avatars) loads.
    state = {
      courseId: options.courseId,
      courseName: options.courseName,
      returnFocus: options.returnFocus || null,
      onSaved: options.onSaved || function () {},
      saved: cardInfo.user_rating === undefined ? null : cardInfo.user_rating,
      count: Number(cardInfo.rating_count) || 0,
      raters: [],
      pending: null,
      latestPick: null,
      preview: null,
      isSaving: false,
      hasSaved: false,
      isError: false,
    };
    parts.status.textContent = '';
    renderRaters();
    render();
    dialog.showModal();

    var previous = inflight[options.courseId] || Promise.resolve();
    previous
      .then(function () {
        return requestJson(RATING_URL + '?course_id=' + encodeURIComponent(options.courseId));
      })
      .then(function (summary) {
        if (!state || session !== openedSession || state.hasSaved) { return; }
        applySummary(summary);
        render();
      })
      .catch(function () { /* Card-info numbers stay; avatars just don't show. */ });
  }

  window.lwCourseRatingOpen = open;
}());
