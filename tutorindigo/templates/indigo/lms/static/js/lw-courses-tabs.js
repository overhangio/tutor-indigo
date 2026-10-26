/**
 * Learning Library on /courses (Figma 662:236 — tabs, section, empty state).
 * Loads server-filtered collections from GET /api/openlms/library/ and renders .lw-course-card shells.
 */
(function () {
  'use strict';

  var LIBRARY_URL = '/api/openlms/library/';
  var VALID_TABS = ['continue', 'assigned', 'suggested', 'new', 'mylist'];

  var gettext = window.gettext || function (s) { return s; };
  var interpolate = window.interpolate || function (fmt, values) {
    return fmt.replace(/%\((\w+)\)s/g, function (match, key) { return values[key]; });
  };

  var EMPTY_CONFIG = {
    continue: {
      title: gettext('No ongoing courses.'),
      body: gettext('Browse available courses to find what interests you!'),
      showDiscoverCta: true,
    },
    assigned: {
      title: gettext('No assigned courses yet.'),
      body: gettext('Browse other courses for the meantime while waiting'),
      showDiscoverCta: true,
    },
    suggested: {
      title: gettext('No suggested courses yet.'),
      body: gettext('Check back as new courses are added to the library.'),
      showDiscoverCta: true,
    },
    new: {
      title: gettext('No new courses.'),
      body: gettext('There are no courses published in the last 30 days.'),
      showDiscoverCta: true,
    },
    mylist: {
      title: gettext('No saved courses.'),
      body: gettext('Build your own list by saving courses you are interested in!'),
      showDiscoverCta: true,
      ctaLabel: gettext('Browse your library'),
    },
  };

  // One request per tab: the API returns at most 15 courses (library_helpers.LIST_TAB_MAX) and
  // the true total in `count`. See Personal-setup/pr-spec-deviation-library-caps.md.
  var PAGE_SIZE = 15;

  // Loading (no flicker): responses are cached briefly and prefetched when a tab is hovered or
  // focused; cards are built and filled in off-screen, then swapped in at once. The skeleton
  // only appears when loading is slow, and once shown stays long enough not to blink.
  var SKELETON_DELAY_MS = 150;
  var SKELETON_MIN_MS = 300;
  // Don't hold finished rows back forever on a slow card-info / completion lookup.
  var ENHANCE_TIMEOUT_MS = 2500;
  var SKELETON_COUNT = 3;
  // Above-the-fold card images load eagerly so they are ready when the cards are swapped in.
  var EAGER_IMAGES = 3;

  var state = {
    tab: 'continue',
    // Incremented per fetch; only the newest response may render (see fetchTab).
    requestId: 0,
    // performance.now() when the skeleton went up, or null while it is down.
    skeletonShownAt: null,
    // scrollLeft saved when the skeleton replaces the cards, restored on a same-tab refresh.
    savedScroll: null,
    skeletonTimer: null,
  };

  // The list on screen: which tab and how many courses the learner has in it.
  var view = {
    tab: null,
    count: 0,
    // Every row on screen, in order: a background refresh compares against this.
    rows: [],
    loadedAt: 0,
  };

  var HTML_ESCAPES = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };

  // Safe in text and in quoted attributes (cardHtml puts API fields in both).
  // An href from page data: only http(s) URLs (absolute or relative), never javascript: or data:.
  function safeHref(value, fallback) {
    if (!value) { return fallback; }
    try {
      var url = new URL(value, window.location.origin);
      if (url.protocol === 'https:' || url.protocol === 'http:') { return url.href; }
    } catch (e) { /* not a URL */ }
    return fallback;
  }

  function escapeHtml(value) {
    return (value == null ? '' : String(value)).replace(/[&<>"']/g, function (ch) {
      return HTML_ESCAPES[ch];
    });
  }

  // PRD LMS 2.3: a load that passes 10 s ends in the error state, which offers Retry.
  var REQUEST_TIMEOUT_MS = 10 * 1000;

  function getJson(url) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = window.setTimeout(function () {
      if (controller) { controller.abort(); }
    }, REQUEST_TIMEOUT_MS);
    var options = { credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (controller) { options.signal = controller.signal; }
    return fetch(url, options)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('library_fetch_failed');
        }
        return response.json();
      })
      .then(function (data) {
        window.clearTimeout(timer);
        return data;
      }, function (error) {
        window.clearTimeout(timer);
        throw error;
      });
  }

  function tabUrl(tab) {
    return LIBRARY_URL + '?tab=' + encodeURIComponent(tab)
      + '&page=1&page_size=' + PAGE_SIZE;
  }

  // Each tab's response is cached. It is "fresh" within its tab's TTL; an older copy (up to
  // MAX_STALE_MS) can still paint at once as a preview while a fresh one loads in the
  // background (stale-while-revalidate). The list changes after the learner's own actions,
  // which call clearCache(); changes made elsewhere show up on the next refresh or return.
  var TTL_MS = {
    continue: 60 * 1000,
    assigned: 60 * 1000,
    mylist: 5 * 60 * 1000,
    new: 5 * 60 * 1000,
    suggested: 5 * 60 * 1000,
  };
  var DEFAULT_TTL_MS = 60 * 1000;
  var MAX_STALE_MS = 30 * 60 * 1000;
  // Coming back to the tab or window re-checks the open list when it is older than this.
  var FOCUS_REVALIDATE_MS = 30 * 1000;

  // tab -> { at, promise, data }
  var pageCache = {};

  function ttlFor(tab) {
    return TTL_MS[tab] || DEFAULT_TTL_MS;
  }

  // The response for a tab. `force` skips the cache. A failed request is dropped from the cache
  // so the next try refetches.
  function getPage(tab, force) {
    var entry = pageCache[tab];
    if (!force && entry && Date.now() - entry.at < ttlFor(tab)) { return entry.promise; }
    var created = { at: Date.now(), promise: getJson(tabUrl(tab)), data: null };
    pageCache[tab] = created;
    created.promise.then(function (data) {
      created.data = data;
    }, function () {
      if (pageCache[tab] === created) { delete pageCache[tab]; }
    });
    return created.promise;
  }

  // A cached response that can paint right now: { data, fresh }, or null.
  function peekPage(tab) {
    var entry = pageCache[tab];
    if (!entry || !entry.data) { return null; }
    var age = Date.now() - entry.at;
    return age < MAX_STALE_MS ? { data: entry.data, fresh: age < ttlFor(tab) } : null;
  }

  // The rows of a response, de-duplicated by courseId in API order (the server owns the sort),
  // with the learner's true total. A malformed response is an error.
  function normalizePage(data) {
    if (!data || !Array.isArray(data.results)) { throw new Error('library_fetch_failed'); }
    var seen = {};
    var results = data.results.filter(function (row) {
      if (!row || seen[row.courseId]) { return false; }
      seen[row.courseId] = true;
      return true;
    });
    return { results: results, count: Number(data.count) || results.length };
  }

  // Hovering or focusing a tab warms its response.
  function prefetchTab(tab) {
    if (VALID_TABS.indexOf(tab) >= 0) { getPage(tab).catch(function () {}); }
  }

  function clearCache() {
    pageCache = {};
  }

  function tabFromQuery() {
    var tab = new URLSearchParams(window.location.search).get('tab');
    return VALID_TABS.indexOf(tab) >= 0 ? tab : 'continue';
  }

  function setQueryTab(tab) {
    var params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    var query = params.toString();
    var nextUrl = window.location.pathname + (query ? '?' + query : '');
    window.history.replaceState({}, '', nextUrl);
  }

  // Assigned tab: completion-state tag per card (PRD LMS 5.3). Due and overdue dates are left to
  // the image badge, as on the learner dashboard card (CourseCardMeta).
  var STATUS_LABELS = {
    not_started: gettext('Not Started'),
    in_progress: gettext('In Progress'),
    failed: gettext('Failed'),
  };

  // Assigned rows carry status; other tabs don't, so nothing renders for them.
  function assignedChipsHtml(row) {
    if (!STATUS_LABELS[row.status]) { return ''; }
    return '<span class="lw-course-card__chip lw-course-card__chip--status lw-course-card__chip--' + escapeHtml(row.status) + '">'
      + escapeHtml(STATUS_LABELS[row.status]) + '</span>';
  }

  function cardHtml(row, index) {
    var courseId = escapeHtml(row.courseId);
    var title = escapeHtml(row.title);
    var imageUrl = escapeHtml(row.imageUrl || '');
    var aboutUrl = escapeHtml(row.url || ('/courses/' + row.courseId + '/about'));
    var org = escapeHtml(row.org || '');
    var description = row.shortDescription ? '<p class="lw-course-card__description">' + escapeHtml(row.shortDescription) + '</p>' : '';
    var providerLabel = interpolate(gettext('By %(provider_name)s'), { provider_name: org }, true);

    return (
      '<article class="lw-course-card" aria-label="' + title + '"'
      + ' data-course-id="' + courseId + '">'
      + '<div class="lw-course-card__image">'
      + '<img src="' + imageUrl + '" alt="" decoding="async"'
      + ' loading="' + (index < EAGER_IMAGES ? 'eager' : 'lazy') + '"'
      + ' onload="this.setAttribute(\'data-loaded\', \'\')"'
      + ' onerror="this.onerror=null;this.src=\'/theming/asset/images/no_course_image.png\';" />'
      + '<div class="lw-course-card__badges">'
      + '<span class="lw-course-card__badge" data-lw="badge" hidden></span>'
      + '<span class="lw-course-card__badge lw-course-card__badge--completed" data-lw="score-badge" hidden></span>'
      + '</div>'
      + '</div>'
      + '<div class="lw-course-card__body">'
      + '<div class="lw-course-card__meta">'
      + '<div class="lw-course-card__heading">'
      + '<div class="lw-course-card__title-row">'
      + '<h3 class="lw-course-card__title"><a href="' + aboutUrl + '" data-lw="title-link">' + title + '</a></h3>'
      + '<span class="lw-course-card__rating" data-lw="rating" hidden>'
      + '<span class="lw-icon lw-icon--star" aria-hidden="true"></span>'
      + '<span aria-hidden="true" data-lw="rating-value"></span>'
      + '<span class="lw-sr-only" data-lw="rating-summary"></span>'
      + '</span>'
      + '</div>'
      + '<span class="lw-course-card__provider" data-lw="provider">' + providerLabel + '</span>'
      + '</div>'
      + description
      + '<div class="lw-course-card__chips">'
      + '<span class="lw-course-card__chip" data-lw="content-type" hidden></span>'
      + '<span class="lw-course-card__chip-plain" data-lw="duration-chip" hidden>'
      + '<span class="lw-icon lw-icon--clock" aria-hidden="true"></span>'
      + '<span data-lw="duration"></span>'
      + '</span>'
      + assignedChipsHtml(row)
      + '</div>'
      + '</div>'
      + '<div class="lw-course-card__bottom">'
      + '<div class="lw-course-card__progress" data-lw="progress" hidden>'
      + '<div class="lw-course-card__progress-label">'
      + '<span>' + gettext('In Progress') + '</span>'
      + '<span class="lw-course-card__progress-value" data-lw="progress-value"></span>'
      + '</div>'
      + '<div class="lw-course-card__progress-track" role="progressbar" aria-label="' + gettext('Course progress') + '"'
      + ' aria-valuemin="0" aria-valuemax="100" data-lw="progress-track">'
      + '<div class="lw-course-card__progress-bar" data-lw="progress-bar"></div>'
      + '</div></div>'
      + '<div class="lw-course-card__actions">'
      + '<a class="lw-course-card__cta" href="' + aboutUrl + '" data-lw="cta">'
      + '<span class="lw-icon lw-icon--play" aria-hidden="true" data-lw="cta-icon" hidden></span>'
      + '<span data-lw="cta-label">' + gettext('View Course') + '</span>'
      + '</a>'
      // Actions menu (learner dashboard CourseCardMenu); lw-course-cards.js shows it to
      // signed-in learners, with "Rate this course" and "Unenroll" for enrolled ones only.
      + '<div class="lw-course-card__menu" data-lw="menu" hidden>'
      + '<button type="button" class="lw-course-card__menu-toggle" aria-haspopup="true" aria-expanded="false"'
      + ' aria-label="' + escapeHtml(gettext('Course actions dropdown')) + '" data-lw="menu-toggle">'
      + '<span class="lw-icon lw-icon--more" aria-hidden="true"></span>'
      + '</button>'
      + '<ul class="lw-course-card__menu-list" role="menu" data-lw="menu-list" hidden>'
      + '<li role="none"><button type="button" class="lw-course-card__menu-item" role="menuitem"'
      + ' data-lw-action="my-list" data-lw="my-list-item">' + escapeHtml(gettext('Add to my list')) + '</button></li>'
      + '<li role="none" data-lw="rate-item"><button type="button" class="lw-course-card__menu-item" role="menuitem" data-lw-action="rate">'
      + escapeHtml(gettext('Rate this course')) + '</button></li>'
      + '<li role="none" data-lw="unenroll-item"><button type="button" class="lw-course-card__menu-item" role="menuitem" data-lw-action="unenroll">'
      + escapeHtml(gettext('Unenroll')) + '</button></li>'
      + '<li role="none" data-lw="share-facebook-item" hidden><button type="button" class="lw-course-card__menu-item" role="menuitem"'
      + ' data-lw-action="share" data-lw-site="facebook">' + escapeHtml(gettext('Share to Facebook')) + '</button></li>'
      + '<li role="none" data-lw="share-twitter-item" hidden><button type="button" class="lw-course-card__menu-item" role="menuitem"'
      + ' data-lw-action="share" data-lw-site="twitter">' + escapeHtml(gettext('Share to Twitter')) + '</button></li>'
      + '</ul></div>'
      + '</div></div></div></article>'
    );
  }

  // A detached list of filled-in cards, ready to swap in (see fetchTab). `offset` is the number
  // of cards already in the row, so only the first cards of the row load their image eagerly.
  // data-lw-tab tells lw-course-cards.js which tab a card is in (Assigned links differ).
  function buildList(rows, offset, tab) {
    var staged = document.createElement('ul');
    staged.innerHTML = rows.map(function (row, index) {
      return '<li class="courses-listing-item" data-lw-tab="' + escapeHtml(tab || '') + '">'
        + cardHtml(row, index + (offset || 0)) + '</li>';
    }).join('');
    return staged;
  }

  function enhanceCards(root) {
    if (typeof window.lwCourseCardsEnhance !== 'function') { return Promise.resolve(); }
    var enhanced = Promise.resolve(window.lwCourseCardsEnhance(root)).catch(function () {});
    var timer;
    var timeout = new Promise(function (resolve) { timer = window.setTimeout(resolve, ENHANCE_TIMEOUT_MS); });
    return Promise.race([enhanced, timeout]).then(function () { window.clearTimeout(timer); });
  }

  function commitList(staged) {
    var list = document.getElementById('lw-courses-listing');
    if (!list) { return; }
    list.textContent = '';
    while (staged.firstChild) { list.appendChild(staged.firstChild); }
  }

  // Same shape as the server-rendered skeleton in courses.html.
  function skeletonHtml(count) {
    var item = '<li class="courses-listing-item lw-course-skeleton-item" aria-hidden="true">'
      + '<div class="lw-course-card lw-course-card--skeleton">'
      + '<div class="lw-course-card__image"></div>'
      + '<div class="lw-course-card__body">'
      + '<span class="lw-skeleton lw-skeleton--title"></span>'
      + '<span class="lw-skeleton lw-skeleton--text"></span>'
      + '<span class="lw-skeleton lw-skeleton--text lw-skeleton--short"></span>'
      + '<span class="lw-skeleton lw-skeleton--button"></span>'
      + '</div></div></li>';
    var html = '';
    for (var i = 0; i < (count || SKELETON_COUNT); i += 1) { html += item; }
    return html;
  }

  function navEl() {
    return document.querySelector('[data-lw-library="nav"]');
  }

  function showSkeleton(tab) {
    var list = document.getElementById('lw-courses-listing');
    if (!list) { return; }
    setEmptyState(tab, false);
    setMessage('', false);
    // Remember the place in the row: the skeleton is shorter, so the browser clamps scrollLeft.
    state.savedScroll = list.scrollLeft;
    list.innerHTML = skeletonHtml();
    state.skeletonShownAt = performance.now();
    var nav = navEl();
    if (nav) { nav.hidden = true; }
  }

  // Waits out SKELETON_MIN_MS when the skeleton is up, so it never just blinks.
  function skeletonSettled() {
    window.clearTimeout(state.skeletonTimer);
    state.skeletonTimer = null;
    if (state.skeletonShownAt === null) { return Promise.resolve(); }
    var remaining = SKELETON_MIN_MS - (performance.now() - state.skeletonShownAt);
    return remaining > 0
      ? new Promise(function (resolve) { window.setTimeout(resolve, remaining); })
      : Promise.resolve();
  }

  function setActiveTab(tab) {
    var tabs = document.querySelectorAll('.lw-courses-tabs__tab');
    tabs.forEach(function (button) {
      var isActive = button.getAttribute('data-tab') === tab;
      button.classList.toggle('lw-courses-tabs__tab--active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      // Roving tabindex: Tab enters the tablist on the active tab; arrows move between tabs.
      button.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    var activeButton = document.querySelector('.lw-courses-tabs__tab[data-tab="' + tab + '"]');
    var heading = document.getElementById('lw-courses-section-title');
    if (activeButton && heading) {
      heading.textContent = activeButton.getAttribute('data-heading') || heading.textContent;
    }
  }

  function setMessage(text, visible) {
    var message = document.querySelector('[data-lw-library="message"]');
    if (!message) { return; }
    message.textContent = text || '';
    message.hidden = !visible;
    // Only an error message comes with a Retry.
    var retry = document.querySelector('[data-lw-library="retry"]');
    if (retry) { retry.hidden = !visible; }
  }

  function setEmptyState(tab, visible) {
    var holder = document.querySelector('.lw-courses-library');
    var block = document.querySelector('[data-lw-library="empty"]');
    if (!block) { return; }

    var config = EMPTY_CONFIG[tab] || EMPTY_CONFIG.continue;
    var titleEl = block.querySelector('[data-lw-empty="title"]');
    var bodyEl = block.querySelector('[data-lw-empty="body"]');
    var ctaEl = block.querySelector('[data-lw-empty="cta"]');
    var ctaLabelEl = block.querySelector('[data-lw-empty="cta-label"]');

    if (titleEl) { titleEl.textContent = config.title; }
    if (bodyEl) { bodyEl.textContent = config.body; }
    if (ctaEl) {
      var discoverUrl = safeHref(holder && holder.getAttribute('data-discover-url'), '/search');
      ctaEl.setAttribute('href', discoverUrl);
      ctaEl.hidden = !config.showDiscoverCta;
    }
    if (ctaLabelEl) {
      ctaLabelEl.textContent = config.ctaLabel || gettext('Discover Courses');
    }

    block.hidden = !visible;
    if (holder) {
      holder.classList.toggle('lw-courses-library--has-empty', visible);
    }
    var container = document.querySelector('.courses-container');
    if (container) {
      container.classList.toggle('lw-courses-container--empty', visible);
    }
    if (visible) {
      setMessage('', false);
    }
  }

  // Prev / next buttons (the scrollbar is hidden). Shown only when the row overflows; each
  // click moves one card, which is where the scroll-snap points are.
  function updateNav() {
    var list = document.getElementById('lw-courses-listing');
    var nav = navEl();
    if (!list || !nav) { return; }
    var maxScroll = list.scrollWidth - list.clientWidth;
    nav.hidden = maxScroll <= 1;
    var prev = nav.querySelector('[data-lw-nav="prev"]');
    var next = nav.querySelector('[data-lw-nav="next"]');
    // aria-disabled, not disabled: a disabled button that has focus drops it to <body>.
    if (prev) { prev.setAttribute('aria-disabled', list.scrollLeft <= 1 ? 'true' : 'false'); }
    if (next) { next.setAttribute('aria-disabled', list.scrollLeft >= maxScroll - 1 ? 'true' : 'false'); }
  }

  // The centre column in viewport coordinates: the row minus its side padding, where the
  // full-opacity cards are. Read from the padding (the CSS --lw-edge is a calc() that
  // getComputedStyle does not resolve to a number).
  function columnBox(list) {
    var cs = window.getComputedStyle(list);
    var box = list.getBoundingClientRect();
    var left = box.left + (parseFloat(cs.paddingLeft) || 0);
    var right = box.right - (parseFloat(cs.paddingRight) || 0);
    return { left: left, right: right, width: right - left, style: cs };
  }

  function cardItems(list) {
    return list.querySelectorAll('.courses-listing-item:not(.lw-course-skeleton-item)');
  }

  // Per-card focus: a card's opacity follows how much of it is inside the middle column (the
  // row minus its side gutters). Fully inside = 1; leaving = dims toward the --lw-fade floor in
  // proportion. Measured directly (no IntersectionObserver: its root box differs between
  // browsers for a padded scroll container); one rAF per scroll frame.
  var focusFrame = 0;

  // `instant` skips the opacity transition (a freshly inserted row, so cards don't fade in
  // from fully opaque).
  function updateCardFocus(instant) {
    focusFrame = 0;
    var list = document.getElementById('lw-courses-listing');
    if (!list) { return; }
    var column = columnBox(list);
    // Lowest opacity: --lw-fade on the row ($lw-courses-list-fade in _discover.scss, the one
    // source). Without it, no dimming.
    var dim = parseFloat(column.style.getPropertyValue('--lw-fade'));
    if (!(dim >= 0 && dim <= 1)) { dim = 1; }
    var items = cardItems(list);
    // All reads first, then all writes: no layout thrash across up to 1000 cards.
    var opacities = Array.prototype.map.call(items, function (item) {
      var rect = item.getBoundingClientRect();
      var overlap = Math.min(rect.right, column.right) - Math.max(rect.left, column.left);
      // Against the narrower of card and column: on a phone the column is thinner than a card.
      var basis = Math.min(rect.width, column.width);
      var ratio = basis > 0 ? Math.max(0, Math.min(1, overlap / basis)) : 1;
      // A snap-aligned card can read 0.98-0.99 from subpixel widths: treat as fully in.
      if (ratio >= 0.97) { ratio = 1; }
      return String(dim + (1 - dim) * ratio);
    });
    if (instant) { list.classList.add('lw-courses-listing--instant'); }
    // Write only what changed: nearly every dimmed card keeps the same value frame to frame.
    Array.prototype.forEach.call(items, function (item, i) {
      if (item.lwOpacity !== opacities[i]) {
        item.lwOpacity = opacities[i];
        item.style.opacity = opacities[i];
      }
    });
    if (instant) {
      // Flush the no-transition style before the class comes off.
      void list.offsetWidth;
      list.classList.remove('lw-courses-listing--instant');
    }
  }

  // Scroll and resize refresh the nav state and the dimming, once per frame.
  function scheduleRowUpdate() {
    if (!focusFrame) {
      focusFrame = window.requestAnimationFrame(function () {
        updateNav();
        updateCardFocus(false);
      });
    }
  }

  // Geometry of the card row. Card i's snap position is i * step (the row's padding equals its
  // scroll-padding), so scrolling to a card is scrollTo(i * step).
  function rowMetrics(list) {
    var items = cardItems(list);
    if (!items.length) { return null; }
    var column = columnBox(list).width;
    var step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : items[0].offsetWidth;
    return {
      step: step,
      // Cards that fit in the column (3 at 1440px+, fewer below, never 0); caps a drag's reach.
      perColumn: Math.max(1, Math.floor((column + (step - items[0].offsetWidth)) / step)),
      max: list.scrollWidth - list.clientWidth,
      // Last card index the row can scroll to (at the end the row stops short of the last
      // snap positions), so a target never goes past what is reachable.
      last: Math.min(items.length - 1, Math.max(0, Math.ceil((list.scrollWidth - list.clientWidth) / step)))
    };
  }

  function nearestCard(left, metrics) {
    // At the very end the row stops short of the last snap position: that is the last card.
    if (left >= metrics.max - 1) { return metrics.last; }
    return Math.max(0, Math.min(metrics.last, Math.round(left / metrics.step)));
  }

  var reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function scrollToCard(list, metrics, index) {
    list.scrollTo({ left: Math.min(index * metrics.step, metrics.max), behavior: reducedMotion && reducedMotion.matches ? 'auto' : 'smooth' });
  }

  // The card the row is heading to while a move is still animating (see moveCards).
  var cardTarget = { index: null, at: 0 };

  // Move the row by `cards` (signed) snap points: prev / next move one card per click, like one
  // wheel notch. Counting starts from the card the row is already heading to, so quick repeats
  // (wheel notches, arrow clicks) add up instead of restarting.
  function moveCards(list, cards) {
    var metrics = rowMetrics(list);
    if (!metrics) { return; }
    var now = window.performance.now();
    var base = cardTarget.index !== null && now - cardTarget.at < 500 ? cardTarget.index : nearestCard(list.scrollLeft, metrics);
    cardTarget.index = Math.max(0, Math.min(metrics.last, base + cards));
    cardTarget.at = now;
    scrollToCard(list, metrics, cardTarget.index);
  }

  // Jump the row to `left` (0 = start) without the CSS smooth scroll animating across the swap.
  function resetRowScroll(left) {
    var list = document.getElementById('lw-courses-listing');
    if (!list) { return; }
    list.style.scrollBehavior = 'auto';
    list.scrollLeft = left;
    list.style.scrollBehavior = '';
    cardTarget.index = null;
  }

  // Mouse gestures on the row. A trackpad swipe and a touch swipe scroll it natively and snap
  // card by card; the mouse gets the same feel, only while the pointer is over the centre
  // column of cards (the dimmed side areas scroll the page):
  //  - wheel: a vertical wheel turn moves the row sideways. The first notch of a gesture moves
  //    one card; more movement in the same gesture adds a card per WHEEL_NOTCH_PX (capped per
  //    event at WHEEL_MAX_CARDS), so a fast spin goes further. Sideways swipes are native.
  //  - drag: also only from the centre column, with the grab cursor only there. The row follows
  //    the pointer 1:1; on release a short drag settles on the next card, and a longer or faster
  //    one carries on, proportionally, up to a full column of cards.
  // The click that ends a drag is swallowed so it doesn't open the card under the pointer.
  var WHEEL_GAP_MS = 150;        // quiet time that ends a wheel gesture
  var WHEEL_NOTCH_PX = 100;      // one more card per this much wheel delta within a gesture
  var WHEEL_MAX_CARDS = 8;
  var DRAG_THRESHOLD_PX = 5;
  var DRAG_INERTIA_MS = 200;     // how far a flick carries on after release
  var DRAG_MIN_CARDS = 0.08;     // below this (and slow) a drag just settles on the nearest card
  var SETTLE_MAX_MS = 600;

  // True when clientX is over the centre column: the row minus its side padding, where the
  // full-opacity cards are. The dimmed side areas hand wheel and drag back to the page.
  function inCentreColumn(list, clientX) {
    var column = columnBox(list);
    return clientX >= column.left && clientX <= column.right;
  }

  function initRowGestures(list) {
    var wheel = { last: 0, dir: 0, acc: 0 };

    function wheelDelta(event) {
      if (event.deltaMode === 1) { return event.deltaY * 16; }
      if (event.deltaMode === 2) { return event.deltaY * list.clientWidth; }
      return event.deltaY;
    }

    list.addEventListener('wheel', function (event) {
      // Sideways swipes (trackpad / tilt wheel) and pinch-zoom are native.
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) { return; }
      // Over the dimmed side areas the wheel scrolls the page.
      if (!inCentreColumn(list, event.clientX)) {
        wheel.last = 0;
        return;
      }
      if (list.scrollWidth - list.clientWidth <= 1) { return; }

      var delta = wheelDelta(event);
      var dir = delta > 0 ? 1 : -1;
      var fresh = event.timeStamp - wheel.last > WHEEL_GAP_MS || dir !== wheel.dir;
      wheel.last = event.timeStamp;
      if (fresh) {
        wheel.dir = dir;
        wheel.acc = 0;
      }

      // Always the row's, even at its first or last card (it just stops there): over the centre
      // cards the wheel never falls through to a page scroll.
      event.preventDefault();
      if (fresh) {
        moveCards(list, dir);
        return;
      }
      wheel.acc += Math.abs(delta);
      var cards = Math.min(WHEEL_MAX_CARDS, Math.floor(wheel.acc / WHEEL_NOTCH_PX));
      if (cards > 0) {
        wheel.acc -= cards * WHEEL_NOTCH_PX;
        moveCards(list, dir * cards);
      }
    }, { passive: false });

    var drag = null;
    var swallowClick = false;
    var settleTimer = null;

    function endSettle() {
      window.clearTimeout(settleTimer);
      list.classList.remove('lw-courses-listing--settling');
    }

    list.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse' || event.button !== 0) { return; }
      if (event.target.closest('.lw-course-card__menu-list')) { return; }
      if (!inCentreColumn(list, event.clientX)) { return; }
      endSettle();
      drag = { x: event.clientX, left: list.scrollLeft, active: false, id: event.pointerId, samples: [] };
    });

    list.addEventListener('pointermove', function (event) {
      // Hover: the grab hand only over the centre column; elsewhere the normal cursor.
      if (!drag && event.pointerType === 'mouse') {
        var overCentre = inCentreColumn(list, event.clientX);
        if (overCentre !== list.classList.contains('lw-courses-listing--grab')) {
          list.classList.toggle('lw-courses-listing--grab', overCentre);
        }
        return;
      }
      if (!drag || event.pointerId !== drag.id) { return; }
      var dx = event.clientX - drag.x;
      if (!drag.active) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) { return; }
        drag.active = true;
        list.classList.add('lw-courses-listing--dragging');
        // Capture only once it is a drag, so a plain click still reaches the card's link.
        list.setPointerCapture(drag.id);
      }
      drag.samples.push({ t: event.timeStamp, x: event.clientX });
      if (drag.samples.length > 8) { drag.samples.shift(); }
      list.scrollLeft = drag.left - dx;
    });

    // Where a released drag should land: nearest card for a nudge, else 1..perColumn cards
    // further in the drag's direction, by distance plus the speed at release.
    function dragTarget(event, metrics) {
      var scrolled = drag.x - event.clientX;
      var samples = drag.samples;
      var last = samples[samples.length - 1];
      var first = last && samples.filter(function (sample) { return last.t - sample.t <= 100; })[0];
      var velocity = first && last.t > first.t ? (first.x - last.x) / (last.t - first.t) : 0;
      var dir = scrolled !== 0 ? Math.sign(scrolled) : Math.sign(velocity);
      var fling = Math.max(0, velocity * dir);
      if (!dir || (Math.abs(scrolled) < DRAG_MIN_CARDS * metrics.step && fling < 0.3)) {
        return nearestCard(list.scrollLeft, metrics);
      }
      var startIndex = nearestCard(drag.left, metrics);
      var projected = Math.abs(scrolled) + fling * DRAG_INERTIA_MS;
      var cards = Math.max(1, Math.min(metrics.perColumn, Math.round(projected / metrics.step)));
      return Math.max(0, Math.min(metrics.last, startIndex + dir * cards));
    }

    function endDrag(event) {
      if (!drag || event.pointerId !== drag.id) { return; }
      if (drag.active) {
        swallowClick = true;
        window.setTimeout(function () { swallowClick = false; }, 0);
        var metrics = rowMetrics(list);
        cardTarget.index = null;
        if (list.hasPointerCapture(drag.id)) { list.releasePointerCapture(drag.id); }
        list.classList.remove('lw-courses-listing--dragging');
        if (metrics) {
          // Snap stays off until the animation lands on a snap point, so it can't pull elsewhere.
          list.classList.add('lw-courses-listing--settling');
          scrollToCard(list, metrics, dragTarget(event, metrics));
          settleTimer = window.setTimeout(endSettle, SETTLE_MAX_MS);
        }
      }
      drag = null;
    }
    // Snap comes back once the settle animation has landed (or after SETTLE_MAX_MS).
    list.addEventListener('scrollend', endSettle);
    list.addEventListener('pointerleave', function () {
      if (!drag) { list.classList.remove('lw-courses-listing--grab'); }
    });
    list.addEventListener('pointerup', endDrag);
    list.addEventListener('pointercancel', endDrag);

    // Capture phase: runs before the card link's own handling.
    list.addEventListener('click', function (event) {
      if (swallowClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    // Native drag-and-drop of links / images would fight the drag scroll.
    list.addEventListener('dragstart', function (event) { event.preventDefault(); });
  }

  // The total for screen readers. A capped list says how many exist and how many are shown.
  function countLabel(total, shown) {
    if (!total) { return ''; }
    if (total > shown) {
      return interpolate(
        gettext('Showing %(shown)s of %(total)s courses in this list'),
        { shown: shown, total: total },
        true
      );
    }
    if (total === 1) { return gettext('1 course in this list'); }
    return interpolate(gettext('%(total)s courses in this list'), { total: total }, true);
  }

  // Screen readers: the total, now that the pager's "Showing N of M" is gone.
  function announceCount() {
    var el = document.querySelector('[data-lw-library="count"]');
    if (!el) { return; }
    el.textContent = countLabel(view.count, view.rows.length);
  }

  function setBusy(busy) {
    var panel = document.getElementById('lw-courses-panel');
    if (panel) { panel.setAttribute('aria-busy', busy ? 'true' : 'false'); }
  }

  /**
   * Fetch a tab's courses, build and fill in the cards off-screen, then swap them in at once. The current content stays put until then; the
   * skeleton replaces it only if loading takes longer than SKELETON_DELAY_MS.
   *
   * A cached page 1 paints immediately, and a stale one is then refreshed in the background
   * (stale-while-revalidate). `background` fetches always hit the network, show no loading state,
   * and leave the row alone when nothing changed or the learner is mid-gesture.
   *
   * Resolves to true when this response was rendered, false when a newer request superseded it.
   */
  function fetchTab(tab, options) {
    var opts = options || {};
    var background = Boolean(opts.background);
    var requestId = ++state.requestId;
    var isCurrent = function () { return requestId === state.requestId; };
    if (!background) {
      setBusy(true);
      if (state.skeletonShownAt === null) {
        window.clearTimeout(state.skeletonTimer);
        state.skeletonTimer = window.setTimeout(function () {
          if (isCurrent()) { showSkeleton(tab); }
        }, SKELETON_DELAY_MS);
      }
    }

    var cached = !background ? peekPage(tab) : null;
    var source = cached
      ? Promise.resolve().then(function () { return normalizePage(cached.data); })
      : getPage(tab, background).then(normalizePage);

    var staged = null;
    return source.then(function (data) {
      if (!isCurrent()) { return false; }
      var list = document.getElementById('lw-courses-listing');
      var sig = JSON.stringify(data.results);
      if (background) {
        if (view.tab === tab && view.count === data.count && JSON.stringify(view.rows) === sig) {
          view.loadedAt = Date.now();
          return true;
        }
        if (list && /lw-courses-listing--(dragging|settling)/.test(list.className)) { return false; }
        // Swapping the cards would drop keyboard focus (or an open card menu) to <body>.
        if (list && list.contains(document.activeElement)) { return false; }
      }
      staged = buildList(data.results, 0, tab);
      return enhanceCards(staged).then(function () {
        // A superseded request must not touch the newer one's skeleton timer.
        return isCurrent() && !background ? skeletonSettled() : null;
      }).then(function () {
        if (!isCurrent()) { return false; }
        // A refresh in the background keeps the learner's place.
        if (background && list) { state.savedScroll = list.scrollLeft; }
        commitList(staged);
        state.skeletonShownAt = null;
        // A new tab starts at the left edge; a refresh of the same tab (My List remove,
        // unenroll, background revalidation) keeps the learner's place.
        if (opts.resetScroll) {
          resetRowScroll(0);
        } else if (state.savedScroll !== null) {
          resetRowScroll(state.savedScroll);
        }
        state.savedScroll = null;

        view.tab = tab;
        view.count = data.count;
        view.rows = data.results;
        view.loadedAt = Date.now();

        updateNav();
        updateCardFocus(true);
        setMessage('', false);
        setEmptyState(tab, !data.results.length);
        announceCount();
        if (!background) { setBusy(false); }
        // Showing a stale copy: refresh it quietly.
        if (cached && !cached.fresh) { fetchTab(tab, { background: true }); }
        return true;
      });
    }).catch(function () {
      // A 200 with a malformed body is cached by getPage; drop it so Retry fetches again.
      delete pageCache[tab];
      if (!isCurrent() || background) { return false; }
      return skeletonSettled().then(function () {
        if (!isCurrent()) { return false; }
        commitList(document.createElement('ul'));
        state.skeletonShownAt = null;
        view.tab = null;
        view.count = 0;
        view.rows = [];
        setEmptyState(tab, false);
        setMessage(gettext('Unable to load courses. Please try again.'), true);
        announceCount();
        state.savedScroll = null;
        updateNav();
        setBusy(false);
        return true;
      });
    });
  }

  function selectTab(tab, options) {
    var opts = options || {};
    if (VALID_TABS.indexOf(tab) < 0) { tab = 'continue'; }
    state.tab = tab;
    setActiveTab(tab);
    setQueryTab(tab);
    return fetchTab(tab, { resetScroll: true }).then(function (rendered) {
      if (rendered && !opts.silentFocus && document.getElementById('lw-courses-panel')) {
        document.getElementById('lw-courses-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function init() {
    var tablist = document.querySelector('.lw-courses-tabs');

    // lw-course-cards.js fires this after "Add to / Remove from my list"; keep the My List
    // tab in step with it (a removed course leaves the list).
    document.addEventListener('lw:my-list-changed', function () {
      clearCache();
      if (state.tab === 'mylist') { fetchTab('mylist'); }
    });
    // After an unenroll, reload the open tab so the course leaves Continue Learning and the
    // cards' progress and buttons are redrawn from fresh enrollment data.
    document.addEventListener('lw:enrollment-changed', function () {
      clearCache();
      fetchTab(state.tab).then(function (rendered) {
        // The card whose menu had focus was just replaced; keep focus in the section.
        var heading = document.getElementById('lw-courses-section-title');
        if (rendered && heading) { heading.focus(); }
      });
    });
    var list = document.getElementById('lw-courses-listing');
    if (!tablist || !list) { return; }

    initRowGestures(list);
    list.addEventListener('scroll', scheduleRowUpdate, { passive: true });
    window.addEventListener('resize', scheduleRowUpdate);

    // Retry on the load-error state: reload the open tab without reloading the page.
    var retryButton = document.querySelector('[data-lw-library="retry"]');
    if (retryButton) {
      retryButton.addEventListener('click', function () {
        // The button is hidden once loading starts; keep keyboard focus in the section.
        var heading = document.getElementById('lw-courses-section-title');
        if (heading) { heading.focus(); }
        fetchTab(state.tab, { resetScroll: true });
      });
    }

    // Coming back to this tab or window: if the open list is older than FOCUS_REVALIDATE_MS,
    // check it again quietly (a failed first load is retried instead).
    function onReturn() {
      if (document.visibilityState === 'hidden' || state.skeletonTimer) { return; }
      // A tab switch is still loading (view.tab only changes when it commits): don't let a
      // background refresh of the old tab supersede it.
      if (view.tab && view.tab !== state.tab) { return; }
      if (!view.tab) {
        fetchTab(state.tab, { resetScroll: true });
        return;
      }
      if (Date.now() - view.loadedAt < FOCUS_REVALIDATE_MS) { return; }
      view.loadedAt = Date.now();
      fetchTab(view.tab, { background: true });
    }
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    var nav = navEl();
    if (nav) {
      nav.addEventListener('click', function (event) {
        var button = event.target.closest('[data-lw-nav]');
        if (button && button.getAttribute('aria-disabled') !== 'true') { moveCards(list, button.getAttribute('data-lw-nav') === 'next' ? 1 : -1); }
      });
    }

    // courses.html paints the skeleton for the ?tab= tab, so the first load swaps straight
    // from it to the cards (or the empty state) with no minimum wait.
    if (document.querySelector('.lw-course-skeleton-item')) {
      state.skeletonShownAt = performance.now() - SKELETON_MIN_MS;
    }

    // Intent prefetch: hovering or focusing a tab warms its cards.
    ['pointerenter', 'focusin'].forEach(function (type) {
      tablist.addEventListener(type, function (event) {
        var button = event.target.closest && event.target.closest('.lw-courses-tabs__tab');
        if (button && button.getAttribute('data-tab') !== state.tab) {
          prefetchTab(button.getAttribute('data-tab'));
        }
      }, true);
    });

    tablist.addEventListener('click', function (event) {
      var button = event.target.closest('.lw-courses-tabs__tab');
      if (!button || !tablist.contains(button)) { return; }
      var tab = button.getAttribute('data-tab');
      if (tab && tab !== state.tab) {
        selectTab(tab, { silentFocus: true });
      }
    });

    // Arrow/Home/End move focus between tabs; Enter/Space are native button clicks.
    tablist.addEventListener('keydown', function (event) {
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('.lw-courses-tabs__tab'));
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) { return; }
      var nextIndex = index;
      if (event.key === 'ArrowRight') {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      tabs[nextIndex].focus();
    });

    selectTab(tabFromQuery(), { silentFocus: true });
  }

  // Test hook (tests/js): the pure response and cache logic, exposed only when a test asks for it.
  if (window.__LW_TEST__) {
    window.__LW_TEST__.coursesTabs = {
      getPage: getPage,
      peekPage: peekPage,
      tabUrl: tabUrl,
      countLabel: countLabel,
      REQUEST_TIMEOUT_MS: REQUEST_TIMEOUT_MS,
      normalizePage: normalizePage,
      clearCache: clearCache,
      ttlFor: ttlFor,
      TTL_MS: TTL_MS,
      MAX_STALE_MS: MAX_STALE_MS,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
