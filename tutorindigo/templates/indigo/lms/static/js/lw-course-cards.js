/**
 * /courses: fills the learner-specific parts of .lw-course-card the same way the learner
 * dashboard CourseCard does (src/utils/dueDate.js resolveDueInfo, CourseCardMeta/hooks.js):
 *
 *  - GET /api/openlms/course-completion/      enrolled courses, completion %, completedAt
 *  - GET /api/course_assignments/v1/card-info/ provider, content type, duration, rating,
 *                                              assignment due and status
 *  - GET /api/openlms/certificates/<username>/ certificate dates (when a course was completed)
 *
 * Status badge on the image (CourseCardImage useStatusBadge): Completed (with its date) wins,
 * then "Overdue for N days", then "Due in N days", each with the due date.
 *
 * Enrolled + started  -> "In Progress" bar + Resume
 * Enrolled, 0%        -> Enroll and Start (learner dashboard BeginCourseButton label)
 * Not enrolled        -> View Course (about page), no progress
 *
 * Signed-in learners also get the actions menu: "Add to / Remove from my list" (POST/DELETE
 * /api/course_assignments/v1/my-list/) and, when enrolled, "Rate this course"
 * (lw-course-rating.js) and "Unenroll" (lw-course-unenroll.js). "Share to Facebook / Twitter"
 * shows when the LMS enables social sharing (data-share-settings on .lw-courses-library).
 *
 * lw-courses-tabs.js calls window.lwCourseCardsEnhance after each render.
 * Anonymous users get 401s and keep the catalog card.
 */
(function () {
  'use strict';

  var DUE_SOON_WINDOW_DAYS = 7;
  var MS_PER_DAY = 1000 * 60 * 60 * 24;
  var COMPLETION_URL = '/api/openlms/course-completion/';
  var CERTIFICATES_URL = '/api/openlms/certificates/';
  var CARD_INFO_URL = '/api/course_assignments/v1/card-info/';
  var MY_LIST_URL = '/api/course_assignments/v1/my-list/';
  var EVENT_URL = '/event';
  var SHARE_SITES = {
    // Same endpoints react-share opens for the learner dashboard's share buttons.
    facebook: function (url) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url); },
    twitter: function (url, text) {
      return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
    },
  };

  var gettext = window.gettext || function (s) { return s; };
  var ngettext = window.ngettext || function (s, p, n) { return n === 1 ? s : p; };
  var interpolate = function (fmt, values) {
    return fmt.replace(/%\((\w+)\)s/g, function (match, key) { return values[key]; });
  };

  function getJson(url) {
    return fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (response) { return response.ok ? response.json() : null; })
      .catch(function () { return null; });
  }

  // One request per page: every active enrollment with its completion %.
  var completionPromise = null;
  function getCompletionById() {
    if (!completionPromise) {
      completionPromise = getJson(COMPLETION_URL).then(function (rows) {
        var byId = {};
        (Array.isArray(rows) ? rows : []).forEach(function (row) {
          byId[row.courseId] = row;
        });
        return byId;
      });
    }
    return completionPromise;
  }

  // One request per page: when each course's certificate was generated, keyed by course id.
  var certificatesPromise = null;
  function getCertificateDateById() {
    if (!certificatesPromise) {
      var holder = document.querySelector('.lw-courses-library');
      var username = holder && holder.getAttribute('data-username');
      certificatesPromise = !username
        ? Promise.resolve({})
        : getJson(CERTIFICATES_URL + encodeURIComponent(username) + '/').then(function (data) {
          return dateEntries(data && data.certificates, 'completionDate');
        });
    }
    return certificatesPromise;
  }

  // { courseId: Date } from rows with a full timestamp in dateKey; bad dates are skipped.
  function dateEntries(rows, dateKey) {
    var byId = {};
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      var date = row && row.courseId && row[dateKey] ? new Date(row[dateKey]) : null;
      if (date && !isNaN(date.getTime())) { byId[row.courseId] = date; }
    });
    return byId;
  }

  /**
   * As dueDate.js buildCompletedDateById: the certificate's date, else completion
   * completedAt (the earlier of first passing and reaching 100% without failing).
   */
  function completedDate(courseId, completionById, certificateDateById) {
    if (certificateDateById[courseId]) { return certificateDateById[courseId]; }
    var completion = completionById[courseId];
    return dateEntries(completion ? [completion] : [], 'completedAt')[courseId] || null;
  }

  // Card info is cached per course id as a promise, so a card rendered while its request
  // is still in flight waits for it. Only ids not requested yet are fetched.
  var cardInfoRequests = {};
  function loadCardInfo(courseIds) {
    var missing = courseIds.filter(function (id) { return !(id in cardInfoRequests); });
    if (missing.length) {
      var query = missing.map(function (id) { return 'course_id=' + encodeURIComponent(id); }).join('&');
      var request = getJson(CARD_INFO_URL + '?' + query).then(function (data) {
        var byId = {};
        ((data && data.results) || []).forEach(function (info) { byId[info.course_id] = info; });
        return byId;
      });
      missing.forEach(function (id) {
        cardInfoRequests[id] = request.then(function (byId) { return byId[id] || null; });
      });
    }
    return Promise.all(courseIds.map(function (id) { return cardInfoRequests[id]; }))
      .then(function (infos) {
        var cardInfoById = {};
        courseIds.forEach(function (id, index) { cardInfoById[id] = infos[index]; });
        return cardInfoById;
      });
  }

  // Calendar day, as the learner dashboard parseDateOnly reads due and end dates.
  function parseDateOnly(value) {
    if (!value) { return null; }
    var parts = String(value).split('T')[0].split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) { return new Date(value); }
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function daysUntil(date, now) {
    return Math.ceil((date.getTime() - now) / MS_PER_DAY);
  }

  function formatShortDate(date) {
    var lang = document.documentElement.lang || undefined;
    return date.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Port of dueDate.js resolveDueInfo. Due date: the assignment's, else none. Overdue and due
   * soon need an assignment (spec: "an assignment record exists with a due_date in the past");
   * a course's end date alone never makes it overdue. A course is completed once finished (a certificate,
   * or the course-completion API's completedAt) or when its assignment is marked completed;
   * completed courses are never overdue or due soon. 100% alone is not finished: a course
   * that is 100% done but failed has no completedAt and comes back with failed: true
   * (completion_helpers.is_completed / is_failed).
   */
  function resolveDueInfo(cardInfo, completion, completedOn, now) {
    var finished = completion !== undefined && Boolean(completedOn);
    var isCompleted = finished || Boolean(cardInfo && cardInfo.status === 'completed');
    var info = {
      dueDate: null,
      daysUntilDue: 0,
      daysOverdue: 0,
      isOverdue: false,
      isDueSoon: false,
      isCompleted: isCompleted,
      completedDate: isCompleted ? completedOn : null,
      isFailed: Boolean(completion && completion.failed) && !isCompleted,
    };

    if (cardInfo && cardInfo.due_date) {
      info.dueDate = parseDateOnly(cardInfo.due_date);
      info.daysUntilDue = daysUntil(info.dueDate, now);
      // The API owns overdue for assignments, but only skips a stored status=completed; nothing
      // updates that status when the learner passes, so a finished course is never overdue here.
      info.isOverdue = Boolean(cardInfo.is_overdue) && !isCompleted;
      // Server and browser can disagree on "today" near midnight; never "0 days overdue".
      info.daysOverdue = info.isOverdue ? Math.max(1, -info.daysUntilDue) : 0;
      info.isDueSoon = !info.isOverdue && !isCompleted
        && info.daysUntilDue >= 0 && info.daysUntilDue <= DUE_SOON_WINDOW_DAYS;
    }
    return info;
  }

  // As CourseCardImage useStatusBadge: completed wins over overdue / due soon. Failed comes
  // after overdue (spec precedence: Overdue > Failed); hideFailed skips it where the Assigned
  // tab's "Failed" chip already says so.
  function statusBadge(due, hideFailed) {
    if (due.isCompleted) {
      return {
        variant: 'completed',
        label: due.completedDate
          ? interpolate(gettext('Completed – %(completed_date)s'), { completed_date: formatShortDate(due.completedDate) })
          : gettext('Completed'),
      };
    }
    if (due.isOverdue) {
      return {
        variant: 'overdue',
        label: interpolate(
          ngettext('Overdue for %(days)s day – %(due_date)s', 'Overdue for %(days)s days – %(due_date)s', due.daysOverdue),
          { days: due.daysOverdue, due_date: formatShortDate(due.dueDate) }
        ),
      };
    }
    if (due.isFailed) {
      return hideFailed ? null : { variant: 'failed', label: gettext('Failed') };
    }
    if (due.isDueSoon) {
      var template = due.daysUntilDue === 0
        ? gettext('Due today – %(due_date)s')
        : ngettext('Due in %(days)s day – %(due_date)s', 'Due in %(days)s days – %(due_date)s', due.daysUntilDue);
      return {
        variant: 'due-soon',
        label: interpolate(template, { days: due.daysUntilDue, due_date: formatShortDate(due.dueDate) }),
      };
    }
    return null;
  }

  // Whole minutes from card-info, or null. Older card-info responses only carry hours.
  function durationMinutes(cardInfo) {
    var minutes = Number(cardInfo.estimated_duration_minutes);
    if (isFinite(minutes) && minutes > 0) { return Math.round(minutes); }
    var hours = Number(cardInfo.estimated_duration_hours);
    if (isFinite(hours) && hours > 0) { return Math.round(hours * 60); }
    return null;
  }

  // As CourseCardMeta formatDuration: "45 min", "1 hour", "2.2 hours".
  function formatDuration(minutes) {
    if (minutes === null) { return null; }
    if (minutes < 60) {
      return interpolate(gettext('%(minutes)s min'), { minutes: minutes });
    }
    var hours = Math.round((minutes / 60) * 10) / 10;
    return interpolate(ngettext('%(hours)s hour', '%(hours)s hours', hours), { hours: hours });
  }

  // Average learner rating beside the title; hidden until someone has rated the course.
  function renderRating(card, cardInfo) {
    var count = (cardInfo && Number(cardInfo.rating_count)) || 0;
    var average = count > 0 ? Number(cardInfo.rating_average) : NaN;
    var hasRating = isFinite(average);
    if (hasRating) {
      var rating = average.toFixed(1);
      field(card, 'rating-value').textContent = rating;
      field(card, 'rating-summary').textContent = interpolate(
        ngettext(
          'Rated %(rating)s out of 5 by %(count)s learner',
          'Rated %(rating)s out of 5 by %(count)s learners',
          count
        ),
        { rating: rating, count: count }
      );
    }
    show(field(card, 'rating'), hasRating);
  }

  function field(card, name) {
    return card.querySelector('[data-lw="' + name + '"]');
  }

  function show(element, visible) {
    if (element) { element.hidden = !visible; }
  }

  function renderCard(card, completionById, cardInfoById, certificateDateById, now) {
    var courseId = card.getAttribute('data-course-id');
    var completion = completionById[courseId];
    var cardInfo = cardInfoById[courseId];

    // Content type always shows, "Video" until card-info says otherwise (CourseCardMeta).
    var contentType = field(card, 'content-type');
    contentType.textContent = (cardInfo && cardInfo.content_type_display) || gettext('Video');
    show(contentType, true);

    if (cardInfo) {
      if (cardInfo.provider_display_name) {
        field(card, 'provider').textContent = interpolate(
          gettext('By %(provider_name)s'), { provider_name: cardInfo.provider_display_name }
        );
      }
      var duration = formatDuration(durationMinutes(cardInfo));
      if (duration) {
        field(card, 'duration').textContent = duration;
      }
      show(field(card, 'duration-chip'), Boolean(duration));
    }
    renderRating(card, cardInfo);

    var due = resolveDueInfo(
      cardInfo,
      completion,
      completedDate(courseId, completionById, certificateDateById),
      now
    );
    var status = statusBadge(due, Boolean(card.querySelector('.lw-course-card__chip--failed')));
    var badge = field(card, 'badge');
    badge.className = 'lw-course-card__badge';
    if (status) {
      badge.textContent = status.label;
      // Long labels are truncated; the full text stays available on hover.
      badge.title = status.label;
      badge.classList.add('lw-course-card__badge--' + status.variant);
    }
    show(badge, Boolean(status));

    // Under "Completed - date": the learner's course grade, e.g. "Scored 87%" (course-completion
    // API score). Hidden without a grade, or at 0% (ungraded courses).
    var score = due.isCompleted && completion ? Number(completion.score) : NaN;
    var hasScore = isFinite(score) && score > 0;
    if (hasScore) {
      field(card, 'score-badge').textContent = interpolate(gettext('Scored %(score)s'), { score: score + '%' });
    }
    show(field(card, 'score-badge'), hasScore);

    // Progress + CTA, as CourseCardProgress / CourseCardActions. A completed course shows no
    // progress bar and a "Revisit Course" action instead; so does a failed one (not "In Progress").
    var isCompleted = Boolean(completion) && due.isCompleted;
    var isRevisit = isCompleted || (Boolean(completion) && due.isFailed);
    var hasStarted = Boolean(completion) && completion.completion > 0 && !isRevisit;
    var showProgress = hasStarted;
    if (showProgress) {
      var percent = Math.max(0, Math.min(100, Math.round(completion.completion)));
      field(card, 'progress-value').textContent = percent + '%';
      field(card, 'progress-bar').style.width = percent + '%';
      field(card, 'progress-track').setAttribute('aria-valuenow', String(percent));
    }
    show(field(card, 'progress'), showProgress);

    if (completion) {
      var coursewareUrl = '/courses/' + encodeURIComponent(courseId) + '/courseware';
      field(card, 'cta').setAttribute('href', coursewareUrl);
      // PRD LMS 5.2: for an enrolled learner, the card opens the course player, not the about page.
      field(card, 'title-link').setAttribute('href', coursewareUrl);
      var ctaLabel = gettext('Enroll and Start');
      if (isRevisit) {
        ctaLabel = gettext('Revisit Course');
      } else if (hasStarted) {
        ctaLabel = gettext('Resume');
      }
      field(card, 'cta-label').textContent = ctaLabel;
    }
    field(card, 'cta').classList.toggle('lw-course-card__cta--revisit', isRevisit);
    show(field(card, 'cta-icon'), hasStarted);
    // Card info only loads for signed-in learners; the rating API only accepts enrolled
    // ones (CourseCardMenu useOptionVisibility).
    show(field(card, 'menu'), Boolean(cardInfo));
    show(field(card, 'rate-item'), Boolean(completion));
    // The learner dashboard also hides Unenroll once a certificate is earned; /courses has no
    // certificate data, so the LMS refuses that case and the dialog shows its error.
    // An assigned course is an obligation: it leaves Assigned only when completed or revoked by
    // an admin (Learning Library spec), so the learner can't unenroll from it.
    show(field(card, 'unenroll-item'), Boolean(completion) && !(cardInfo && cardInfo.due_date));
    Object.keys(SHARE_SITES).forEach(function (site) {
      show(field(card, 'share-' + site + '-item'), Boolean(shareSettings()[site] && shareSettings()[site].isEnabled));
    });
    renderMyListItem(card, cardInfo);
  }

  function renderMyListItem(card, cardInfo) {
    field(card, 'my-list-item').textContent = cardInfo && cardInfo.in_my_list
      ? gettext('Remove from my list')
      : gettext('Add to my list');
  }

  // Resolves once the cards are filled in, so lw-courses-tabs.js can build them off-screen and
  // show them complete. Never rejects (the lookups resolve null/{} on failure).
  function enhance(root) {
    var cards = Array.prototype.filter.call(
      root.querySelectorAll('.lw-course-card[data-course-id]'),
      function (card) { return !card.hasAttribute('data-lw-ready'); }
    );
    if (!cards.length) { return Promise.resolve(); }
    cards.forEach(function (card) { card.setAttribute('data-lw-ready', ''); });

    var ids = cards.map(function (card) { return card.getAttribute('data-course-id'); });
    return Promise.all([getCompletionById(), loadCardInfo(ids), getCertificateDateById()]).then(function (results) {
      var now = Date.now();
      cards.forEach(function (card) { renderCard(card, results[0], results[1], results[2], now); });
    });
  }

  // A saved rating returns the course's new average and count; merge them into the cached
  // card info and redraw that course's rating wherever it is shown.
  function applyRatingSummary(courseId, summary) {
    var previous = cardInfoRequests[courseId] || Promise.resolve(null);
    cardInfoRequests[courseId] = previous.then(function (info) {
      return Object.assign({}, info, {
        rating_average: summary.rating_average,
        rating_count: summary.rating_count,
        user_rating: summary.user_rating,
      });
    });
    cardInfoRequests[courseId].then(function (info) {
      document.querySelectorAll('.lw-course-card[data-course-id]').forEach(function (card) {
        if (card.getAttribute('data-course-id') === courseId) { renderRating(card, info); }
      });
    });
  }

  function csrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  // One polite live region for the page, so menu actions are confirmed to screen readers
  // (focus goes back to the "..." toggle, which doesn't change).
  var liveRegion = null;
  function announce(message) {
    if (!liveRegion) {
      liveRegion = document.createElement('p');
      liveRegion.className = 'lw-sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    // A fresh text node after clearing makes repeated messages announce again.
    window.setTimeout(function () { liveRegion.textContent = message; }, 50);
  }

  // Saves or unsaves the course, then updates every card showing it and tells
  // lw-courses-tabs.js (which refreshes the My List tab when it is open).
  function toggleMyList(card, item) {
    var courseId = card.getAttribute('data-course-id');
    if (item.getAttribute('aria-disabled') === 'true') { return; }
    item.setAttribute('aria-disabled', 'true');

    (cardInfoRequests[courseId] || Promise.resolve(null)).then(function (info) {
      var adding = !(info && info.in_my_list);
      var url = MY_LIST_URL + (adding ? '' : '?course_id=' + encodeURIComponent(courseId));
      return fetch(url, {
        method: adding ? 'POST' : 'DELETE',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken(),
        },
        body: adding ? JSON.stringify({ course_id: courseId }) : undefined,
      }).then(function (response) {
        if (!response.ok) { throw new Error('my_list_failed'); }
        return response.json();
      }).then(function (result) {
        // Build on the current cache entry, not the snapshot above: a rating saved meanwhile
        // has updated it (applyRatingSummary).
        cardInfoRequests[courseId] = (cardInfoRequests[courseId] || Promise.resolve(null)).then(function (current) {
          return Object.assign({}, current, { in_my_list: Boolean(result.in_my_list) });
        });
        return cardInfoRequests[courseId].then(function (updated) {
          announce(updated.in_my_list ? gettext('Added to my list') : gettext('Removed from my list'));
          document.querySelectorAll('.lw-course-card[data-course-id]').forEach(function (other) {
            if (other.getAttribute('data-course-id') === courseId) { renderMyListItem(other, updated); }
          });
          document.dispatchEvent(new CustomEvent('lw:my-list-changed', {
            detail: { courseId: courseId, inMyList: updated.in_my_list },
          }));
        });
      });
    }).catch(function () {
      // Label stays as it was; the learner can try again.
      announce(gettext('Your list could not be updated. Please try again.'));
    }).then(function () {
      item.removeAttribute('aria-disabled');
    });
  }

  // Actions menu: one listener set for every card, so re-rendered cards need no wiring.
  function setMenuOpen(menu, open) {
    var toggle = menu.querySelector('[data-lw="menu-toggle"]');
    var list = menu.querySelector('[data-lw="menu-list"]');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    list.hidden = !open;
    if (open) {
      var first = list.querySelector('[role="menuitem"]');
      if (first) { first.focus(); }
    }
  }

  function closeMenus(except) {
    document.querySelectorAll('.lw-course-card [data-lw="menu"]').forEach(function (menu) {
      if (menu !== except && !menu.querySelector('[data-lw="menu-list"]').hidden) {
        setMenuOpen(menu, false);
      }
    });
  }

  function openRatingDialog(card, toggle) {
    var courseId = card.getAttribute('data-course-id');
    if (typeof window.lwCourseRatingOpen !== 'function') {
      toggle.focus();
      return;
    }
    (cardInfoRequests[courseId] || Promise.resolve(null)).then(function (cardInfo) {
      var title = card.querySelector('.lw-course-card__title');
      window.lwCourseRatingOpen({
        courseId: courseId,
        courseName: title ? title.textContent.trim() : '',
        cardInfo: cardInfo,
        returnFocus: toggle,
        onSaved: function (summary) { applyRatingSummary(courseId, summary); },
      });
    });
  }

  // Learner dashboard socialShareSettings (learner_home get_social_share_settings), rendered
  // into the page by courses.html. Empty when sharing is off or unavailable.
  var shareSettingsCache = null;
  function shareSettings() {
    if (shareSettingsCache === null) {
      var holder = document.querySelector('.lw-courses-library');
      try {
        shareSettingsCache = JSON.parse((holder && holder.getAttribute('data-share-settings')) || '{}') || {};
      } catch (error) {
        shareSettingsCache = {};
      }
    }
    return shareSettingsCache;
  }

  // As SocialShareMenu: share the course about page with the site's UTM params, in a popup,
  // and log edx.course.share_clicked (logShare) to the LMS tracking endpoint.
  function shareCourse(card, site) {
    var settings = shareSettings()[site];
    if (!settings || !settings.isEnabled) { return; }
    var courseId = card.getAttribute('data-course-id');
    var title = card.querySelector('.lw-course-card__title');
    var aboutUrl = new URL('/courses/' + courseId + '/about', window.location.origin).href;
    var shareUrl = aboutUrl + (settings.utmParams ? '?' + settings.utmParams : '');
    var text = interpolate(gettext("I'm taking %(course_name)s online with %(social_brand)s.  Check it out!"), {
      course_name: title ? title.textContent.trim() : '',
      social_brand: settings.socialBrand,
    });

    var width = 550;
    var height = 400;
    var left = Math.max(0, (window.screen.width - width) / 2);
    var top = Math.max(0, (window.screen.height - height) / 2);
    window.open(
      SHARE_SITES[site](shareUrl, text),
      'lw-share-' + site,
      'noopener,noreferrer,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top
    );

    fetch(EVENT_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRFToken': csrfToken() },
      body: new URLSearchParams({
        courserun_key: courseId,
        event_type: 'edx.course.share_clicked',
        page: window.location.href,
        event: JSON.stringify({ course_id: courseId, social_media_site: site, location: 'courses' }),
      }),
    }).catch(function () { /* Tracking is best effort. */ });
  }

  function openUnenrollDialog(card, toggle) {
    if (typeof window.lwCourseUnenrollOpen !== 'function') {
      toggle.focus();
      return;
    }
    var courseId = card.getAttribute('data-course-id');
    var title = card.querySelector('.lw-course-card__title');
    window.lwCourseUnenrollOpen({
      courseId: courseId,
      courseName: title ? title.textContent.trim() : '',
      returnFocus: toggle,
      onUnenrolled: function () {
        // Enrollments changed: drop the cached completion list, then let lw-courses-tabs.js
        // reload the open tab (its new cards fetch fresh data).
        completionPromise = null;
        document.dispatchEvent(new CustomEvent('lw:enrollment-changed', { detail: { courseId: courseId } }));
      },
    });
  }

  document.addEventListener('click', function (event) {
    var menu = event.target.closest('.lw-course-card [data-lw="menu"]');
    closeMenus(menu);
    if (!menu) { return; }

    var toggle = menu.querySelector('[data-lw="menu-toggle"]');
    if (event.target.closest('[data-lw="menu-toggle"]')) {
      setMenuOpen(menu, toggle.getAttribute('aria-expanded') !== 'true');
      return;
    }
    if (event.target.closest('[data-lw-action="rate"]')) {
      setMenuOpen(menu, false);
      openRatingDialog(menu.closest('.lw-course-card'), toggle);
      return;
    }
    var shareItem = event.target.closest('[data-lw-action="share"]');
    if (shareItem) {
      setMenuOpen(menu, false);
      toggle.focus();
      shareCourse(menu.closest('.lw-course-card'), shareItem.getAttribute('data-lw-site'));
      return;
    }
    if (event.target.closest('[data-lw-action="unenroll"]')) {
      setMenuOpen(menu, false);
      openUnenrollDialog(menu.closest('.lw-course-card'), toggle);
      return;
    }
    var myListItem = event.target.closest('[data-lw-action="my-list"]');
    if (myListItem) {
      setMenuOpen(menu, false);
      toggle.focus();
      toggleMyList(menu.closest('.lw-course-card'), myListItem);
    }
  });

  document.addEventListener('keydown', function (event) {
    var menu = event.target.closest && event.target.closest('.lw-course-card [data-lw="menu"]');
    if (!menu || menu.querySelector('[data-lw="menu-list"]').hidden) { return; }

    if (event.key === 'Escape') {
      setMenuOpen(menu, false);
      menu.querySelector('[data-lw="menu-toggle"]').focus();
      return;
    }
    // Up/Down move between the visible items (menu pattern), wrapping at the ends.
    var step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!step) { return; }
    var items = Array.prototype.filter.call(
      menu.querySelectorAll('[role="menuitem"]'),
      function (item) { return !item.closest('[hidden]'); }
    );
    if (!items.length) { return; }
    event.preventDefault();
    var index = items.indexOf(document.activeElement);
    items[(index + step + items.length) % items.length].focus();
  });

  // Tabbing out of an open menu closes it. No relatedTarget means a mouse click (Safari and
  // macOS Firefox don't focus clicked buttons); the click handler above deals with those.
  document.addEventListener('focusout', function (event) {
    if (!event.relatedTarget) { return; }
    var menu = event.target.closest && event.target.closest('.lw-course-card [data-lw="menu"]');
    if (menu && !menu.contains(event.relatedTarget)) {
      if (!menu.querySelector('[data-lw="menu-list"]').hidden) { setMenuOpen(menu, false); }
    }
  });

  // Exposed for lw-courses-tabs.js after it injects card markup.
  window.lwCourseCardsEnhance = enhance;
}());
