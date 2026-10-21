/**
 * LMS theme notifications drawer — vanilla JS mirror of frontend-plugin-notifications.
 * Shell + list: counts, drawer animation, mark-seen/all, paginated cards.
 */
(function () {
  'use strict';

  var DRAWER_OPEN_MS = 300;
  var DRAWER_CLOSE_MS = 250;
  var DEFAULT_NOTIFICATION_APP = 'assignments';
  var LEGACY_NOTIFICATION_APP = 'discussion';
  var PAGE_SIZE = 10;
  var COUNT_REFRESH_MS = 60000;

  var STR = {
    assignedTitle: 'New Course Assigned',
    reminderTitle: 'Due Date Reminder',
    overdueTitle: 'Course Overdue',
    completedTitle: 'Course Completed',
    badgeEarned: 'You earned the %s badge. View it on your profile.',
    certificateAvailable: 'Your certificate is available on your profile.',
    loading: 'Loading…',
    loadMore: 'Load more',
    emptyTitle: 'No notifications yet',
    emptyHelp: 'When you receive notifications they\u2019ll show up here',
    unreadLabel: 'Unread notification',
  };

  var TIME_LOCALE = [
    ['just now', 'right now'],
    ['%s seconds ago', 'in %s seconds'],
    ['1 minute ago', 'in 1 minute'],
    ['%s mins ago', 'in %s minutes'],
    ['1 hour ago', 'in 1 hour'],
    ['%s hours ago', 'in %s hours'],
    ['1 day ago', 'in 1 day'],
    ['%s days ago', 'in %s days'],
    ['1 week ago', 'in 1 week'],
    ['%s weeks ago', 'in %s weeks'],
    ['1 month ago', 'in 1 month'],
    ['%s months ago', 'in %s months'],
    ['1 year ago', 'in 1 year'],
    ['%s years ago', 'in %s years'],
  ];

  var NEW_COURSE_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" class="lw-notification-card__icon" aria-hidden="true"><path d="M10 4.99993C11.1401 4.34166 12.4335 3.99512 13.75 3.99512C15.0665 3.99512 16.3599 4.34166 17.5 4.99993V15.8333C16.3599 15.175 15.0665 14.8285 13.75 14.8285C12.4335 14.8285 11.1401 15.175 10 15.8333C8.85986 15.175 7.56652 14.8285 6.25 14.8285C4.93347 14.8285 3.64014 15.175 2.5 15.8333V4.99993C3.64014 4.34166 4.93347 3.99512 6.25 3.99512C7.56652 3.99512 8.85986 4.34166 10 4.99993ZM10 15.8333V4.99993" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // 24-unit line icons drawn at 20px; colour comes from the card variant (currentColor).
  function cardIconSvg(paths) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" '
      + 'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" '
      + 'class="lw-notification-card__icon" aria-hidden="true">' + paths + '</svg>';
  }

  var DUE_REMINDER_ICON_SVG = cardIconSvg(
    '<rect x="3" y="4" width="18" height="18" rx="2"/>'
    + '<path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>'
  );
  var OVERDUE_ICON_SVG = cardIconSvg(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>'
    + '<path d="M12 9v4M12 17h.01"/>'
  );
  var COMPLETED_ICON_SVG = cardIconSvg('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>');

  function reminderBody(courseTitle, days) {
    if (days <= 0) {
      return courseTitle + ' is due today';
    }
    if (days === 1) {
      return courseTitle + ' is due tomorrow';
    }
    return courseTitle + ' is due in ' + days + ' days';
  }

  // Structured card types; everything else renders as a legacy card. Mirrors the plugin's
  // notificationTypes.ts (frontend-plugin-notifications), keep the two in sync.
  var TYPE_CONFIG = {
    course_assigned: {
      variant: 'assigned',
      icon: NEW_COURSE_ICON_SVG,
      title: STR.assignedTitle,
      body: function (title) { return title + ' has been assigned to you'; },
    },
    course_due_reminder: {
      variant: 'reminder',
      icon: DUE_REMINDER_ICON_SVG,
      title: STR.reminderTitle,
      body: function (title, context) {
        var days = typeof context.days_until_due === 'number' ? context.days_until_due : 1;
        return reminderBody(title, days);
      },
    },
    course_overdue: {
      variant: 'overdue',
      icon: OVERDUE_ICON_SVG,
      title: STR.overdueTitle,
      body: function (title) { return title + ' is now overdue'; },
    },
    course_completed: {
      variant: 'completed',
      icon: COMPLETED_ICON_SVG,
      title: STR.completedTitle,
      body: function (title) { return 'Congratulations! You have completed ' + title; },
    },
  };

  var EMPTY_BELL_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" class="lw-notifications-drawer__empty-icon" aria-hidden="true"><path d="M9 17V18C9 18.7957 9.31607 19.5587 9.87868 20.1213C10.4413 20.6839 11.2044 21 12 21C12.7956 21 13.5587 20.6839 14.1213 20.1213C14.6839 19.5587 15 18.7957 15 18V17M10 5C10 4.46957 10.2107 3.96086 10.5858 3.58579C10.9609 3.21071 11.4696 3 12 3C12.5304 3 13.0391 3.21071 13.4142 3.58579C13.7893 3.96086 14 4.46957 14 5C15.1484 5.54303 16.1274 6.38833 16.8321 7.4453C17.5367 8.50227 17.9404 9.73107 18 11V14C18.0753 14.6217 18.2954 15.2171 18.6428 15.7381C18.9902 16.2592 19.4551 16.6914 20 17H4C4.54494 16.6914 5.00981 16.2592 5.35719 15.7381C5.70457 15.2171 5.92474 14.6217 6 14V11C6.05956 9.73107 6.4633 8.50227 7.16795 7.4453C7.8726 6.38833 8.85159 5.54303 10 5Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var root = document.getElementById('lw-notifications-root');
  var bell = document.getElementById('lw-notification-bell');
  var drawerCount = document.getElementById('lw-notifications-drawer-count');
  var bellBadge = document.getElementById('lw-notification-bell-badge');
  var bellLabel = bell ? bell.getAttribute('aria-label') : '';
  var backdrop = document.getElementById('lw-notifications-backdrop');
  var drawer = document.getElementById('lw-notifications-drawer');
  var closeBtn = document.getElementById('lw-notifications-close');
  var markAllBtn = document.getElementById('lw-notifications-mark-all');
  var listEl = document.getElementById('lw-notifications-list');

  if (!root || !bell || !drawer || !listEl || !closeBtn) {
    return;
  }

  ensureGoogleSansFlexFonts();
  clearStaleScrollLock();
  // Bell is always shown; it only opens the drawer once the API enables the tray.
  root.hidden = false;

  var state = {
    appName: DEFAULT_NOTIFICATION_APP,
    appsId: [],
    tabsCount: { count: 0 },
    showNotificationsTray: false,
    isDrawerOpen: false,
    closeTimer: null,
    csrfToken: null,
    urlParamsApplied: false,
  };

  var listState = {
    items: [],
    currentPage: 0,
    hasMorePages: false,
    isFetching: false,
    courseTitleMap: {},
    sectionEl: null,
    loadingEl: null,
    loadMoreBtn: null,
  };

  function clearStaleScrollLock() {
    document.documentElement.classList.remove('lw-scroll-locked');
    document.documentElement.style.removeProperty('overflow');
    document.body.style.removeProperty('overflow');
  }

  function ensureGoogleSansFlexFonts() {
    if (document.getElementById('lw-google-sans-flex-fonts')) {
      return;
    }
    var href = 'https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@8..144,400;8..144,500;8..144,700&display=swap';
    var preconnectGoogle = document.createElement('link');
    preconnectGoogle.rel = 'preconnect';
    preconnectGoogle.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnectGoogle);
    var preconnectGstatic = document.createElement('link');
    preconnectGstatic.rel = 'preconnect';
    preconnectGstatic.href = 'https://fonts.gstatic.com';
    preconnectGstatic.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectGstatic);
    var link = document.createElement('link');
    link.id = 'lw-google-sans-flex-fonts';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isCourseKey(value) {
    return !!value && /^course-v1:/i.test(String(value).trim());
  }

  function extractCourseIdFromUrl(contentUrl) {
    if (!contentUrl) {
      return null;
    }
    var match = String(contentUrl).match(/\/courses\/(course-v1:[^/]+)\//i);
    return match ? match[1] : null;
  }

  function humanizeCourseKey(value) {
    var trimmed = String(value).trim();
    var parts = trimmed.match(/^course-v1:([^+]+)\+([^+]+)\+([^/?]+)$/i);
    if (!parts) {
      return trimmed;
    }
    var run = parts[3];
    if (run && !/^\d/.test(run)) {
      return run.replace(/_/g, ' ');
    }
    return parts[2].replace(/_/g, ' ');
  }

  function getCourseTitle(contentContext, contentUrl, courseTitleMap) {
    contentContext = contentContext || {};
    courseTitleMap = courseTitleMap || {};
    var candidates = [
      contentContext.course_title,
      contentContext.course_name,
    ].filter(Boolean);

    var i;
    for (i = 0; i < candidates.length; i += 1) {
      if (!isCourseKey(candidates[i])) {
        return candidates[i];
      }
      var courseId = extractCourseIdFromUrl(contentUrl) || candidates[i];
      if (courseTitleMap[courseId]) {
        return courseTitleMap[courseId];
      }
    }

    var fallbackKey = extractCourseIdFromUrl(contentUrl);
    if (!fallbackKey) {
      for (i = 0; i < candidates.length; i += 1) {
        if (isCourseKey(candidates[i])) {
          fallbackKey = candidates[i];
          break;
        }
      }
    }

    if (fallbackKey && courseTitleMap[fallbackKey]) {
      return courseTitleMap[fallbackKey];
    }
    if (fallbackKey) {
      return humanizeCourseKey(fallbackKey);
    }
    return candidates[0] || '';
  }

  function formatDueDate(dueDate) {
    if (!dueDate) {
      return null;
    }
    var parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  }

  function getSafeNotificationUrl(url) {
    if (!url) {
      return null;
    }
    try {
      var parsed = new URL(url, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch (err) {
      return null;
    }
    return null;
  }

  function formatRelativeTime(dateStr) {
    var date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    var diffSec = Math.round((Date.now() - date.getTime()) / 1000);
    var index;
    var number = diffSec;

    if (diffSec < 45) {
      index = 0;
    } else if (diffSec < 90) {
      index = 1;
    } else if (diffSec < 45 * 60) {
      number = Math.round(diffSec / 60);
      index = number === 1 ? 2 : 3;
    } else if (diffSec < 22 * 3600) {
      number = Math.round(diffSec / 3600);
      index = number === 1 ? 4 : 5;
    } else if (diffSec < 26 * 86400) {
      number = Math.round(diffSec / 86400);
      index = number === 1 ? 6 : 7;
    } else if (diffSec < 320 * 86400) {
      number = Math.round(diffSec / (7 * 86400));
      index = number === 1 ? 8 : 9;
    } else if (diffSec < 540 * 86400) {
      index = 10;
      number = 1;
    } else if (diffSec < 86400 * 365 * 1.5) {
      number = Math.round(diffSec / (30 * 86400));
      index = number === 1 ? 10 : 11;
    } else {
      number = Math.round(diffSec / (365 * 86400));
      index = number === 1 ? 12 : 13;
    }

    var pair = TIME_LOCALE[index] || TIME_LOCALE[0];
    return pair[0].replace('%s', String(number));
  }

  function sanitizeHtml(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('script, style, iframe, object, embed, link').forEach(function (node) {
      node.remove();
    });
    template.content.querySelectorAll('*').forEach(function (node) {
      Array.prototype.slice.call(node.attributes).forEach(function (attr) {
        if (/^on/i.test(attr.name) || attr.name === 'srcdoc') {
          node.removeAttribute(attr.name);
        }
      });
    });
    return template.innerHTML;
  }

  function collectCourseIds(notifications) {
    var ids = {};
    notifications.forEach(function (notification) {
      if (!TYPE_CONFIG[notification.notification_type]) {
        return;
      }
      var context = notification.content_context || {};
      var candidates = [context.course_title, context.course_name].filter(Boolean);
      var needsResolution = candidates.some(isCourseKey) || !!extractCourseIdFromUrl(notification.content_url);
      if (!needsResolution) {
        return;
      }
      var fromUrl = extractCourseIdFromUrl(notification.content_url);
      if (fromUrl) {
        ids[fromUrl] = true;
      }
      candidates.filter(isCourseKey).forEach(function (courseId) {
        ids[courseId] = true;
      });
    });
    return Object.keys(ids);
  }

  function fetchCourseTitles(courseIds) {
    if (!courseIds.length) {
      return Promise.resolve({});
    }
    var params = new URLSearchParams();
    courseIds.forEach(function (courseId) {
      params.append('course_id', courseId);
    });
    return apiGet('/api/course_assignments/v1/course-titles/?' + params.toString())
      .then(function (data) {
        var map = {};
        (data.results || []).forEach(function (result) {
          map[result.course_id] = result.course_title;
        });
        return map;
      })
      .catch(function () {
        return {};
      });
  }


  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function fetchCsrfToken() {
    if (state.csrfToken) {
      return Promise.resolve(state.csrfToken);
    }
    var fromCookie = getCookie('csrftoken');
    if (fromCookie) {
      state.csrfToken = fromCookie;
      return Promise.resolve(fromCookie);
    }
    return fetch('/csrf/api/v1/token', { credentials: 'include' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        state.csrfToken = data.csrfToken;
        return state.csrfToken;
      })
      .catch(function () { return null; });
  }

  function apiGet(url) {
    return fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Request failed: ' + res.status);
        }
        return res.json();
      });
  }

  function apiMutate(method, url, body) {
    return fetchCsrfToken().then(function (token) {
      var headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
      if (token) {
        headers['X-CSRFToken'] = token;
      }
      return fetch(url, {
        method: method,
        credentials: 'include',
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
      }).then(function (res) {
        if (!res.ok) {
          throw new Error('Request failed: ' + res.status);
        }
        return res.json().catch(function () { return {}; });
      });
    });
  }

  function resolveDefaultAppName(appsId, requestedApp) {
    if (requestedApp && appsId.indexOf(requestedApp) !== -1) {
      return requestedApp;
    }
    if (appsId.indexOf(DEFAULT_NOTIFICATION_APP) !== -1) {
      return DEFAULT_NOTIFICATION_APP;
    }
    if (appsId.length > 0) {
      return appsId[0];
    }
    return LEGACY_NOTIFICATION_APP;
  }

  function updateCountBadge(el, count) {
    if (!el) {
      return;
    }
    var safeCount = typeof count === 'number' && count >= 0 ? count : 0;
    el.classList.remove('lw-notifications-drawer__count-badge--hidden');
    el.textContent = safeCount >= 100 ? '99+' : String(safeCount);
    el.removeAttribute('aria-hidden');
    if (safeCount >= 10) {
      el.classList.add('lw-notifications-drawer__count-badge--wide');
    } else {
      el.classList.remove('lw-notifications-drawer__count-badge--wide');
    }
  }

  // Corner badge on the bell: hidden at 0, otherwise the unread count (99+ cap).
  function updateBellBadge(count) {
    var safeCount = typeof count === 'number' && count >= 0 ? count : 0;
    var unreadLabel = bell.getAttribute('data-unread-label');
    if (safeCount > 0 && unreadLabel) {
      bell.setAttribute('aria-label', unreadLabel.replace('{count}', String(safeCount)));
    } else {
      bell.setAttribute('aria-label', bellLabel);
    }
    if (!bellBadge) {
      return;
    }
    bellBadge.textContent = safeCount >= 100 ? '99+' : String(safeCount);
    bellBadge.classList.toggle('lw-notification-badge--hidden', safeCount === 0);
    bellBadge.classList.toggle('lw-notification-badge--wide', safeCount >= 10);
  }

  function updateBadges(count) {
    updateCountBadge(drawerCount, count);
    updateBellBadge(count);
  }

  function mountDrawerPortal() {
    if (backdrop && backdrop.parentNode !== document.body) {
      document.body.appendChild(backdrop);
    }
    if (drawer && drawer.parentNode !== document.body) {
      document.body.appendChild(drawer);
    }
  }

  function ensureSection() {
    if (!listState.sectionEl) {
      listState.sectionEl = document.createElement('div');
      listState.sectionEl.className = 'lw-notifications-drawer__section';
      listState.sectionEl.setAttribute('data-testid', 'notification-tray-section');
      listEl.appendChild(listState.sectionEl);
    }
    return listState.sectionEl;
  }

  function setLoading(isLoading) {
    if (isLoading) {
      if (!listState.loadingEl) {
        listState.loadingEl = document.createElement('div');
        listState.loadingEl.className = 'lw-notifications-drawer__loading';
        listState.loadingEl.setAttribute('data-testid', 'notifications-loading-spinner');
      }
      listState.loadingEl.textContent = STR.loading;
      ensureSection().appendChild(listState.loadingEl);
      return;
    }
    if (listState.loadingEl && listState.loadingEl.parentNode) {
      listState.loadingEl.parentNode.removeChild(listState.loadingEl);
    }
  }

  function renderEmptyState(section) {
    var empty = document.createElement('div');
    empty.className = 'lw-notifications-drawer__empty';
    empty.setAttribute('data-testid', 'notifications-empty-list');
    empty.innerHTML = EMPTY_BELL_SVG
      + '<div class="lw-notifications-drawer__empty-title">' + escapeHtml(STR.emptyTitle) + '</div>'
      + '<div class="lw-notifications-drawer__empty-help">' + escapeHtml(STR.emptyHelp) + '</div>';
    section.appendChild(empty);
  }

  function appendMeta(content, testId, text, className) {
    var span = document.createElement('span');
    if (className) {
      span.className = className;
    }
    span.setAttribute('data-testid', testId);
    span.textContent = text;
    content.appendChild(span);
  }

  function buildStructuredCard(notification, config) {
    var context = notification.content_context || {};
    var courseTitle = getCourseTitle(context, notification.content_url, listState.courseTitleMap);
    var dueDateLabel = formatDueDate(context.due_date);
    var isUnread = !notification.last_read;
    var safeUrl = getSafeNotificationUrl(notification.content_url) || '#';
    var relativeTime = formatRelativeTime(notification.created);
    var id = notification.id;

    var link = document.createElement('a');
    link.href = safeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'lw-notification-card lw-notification-card--structured lw-notification-card--'
      + config.variant + (isUnread ? ' lw-notification-card--unread' : '');
    link.setAttribute('data-testid', 'notification-' + id);

    var accent = document.createElement('span');
    accent.className = 'lw-notification-card__accent';
    accent.setAttribute('aria-hidden', 'true');

    var content = document.createElement('div');
    content.className = 'lw-notification-card__content';

    var header = document.createElement('div');
    header.className = 'lw-notification-card__header';
    header.innerHTML = (isUnread
      ? '<span class="lw-notification-card__unread-dot" role="img" data-testid="unread-notification-'
        + id + '" aria-label="' + escapeHtml(STR.unreadLabel) + '"></span>'
      : '')
      + config.icon
      + '<span class="lw-notification-card__heading" data-testid="notification-' + config.variant
      + '-title-' + id + '">' + escapeHtml(config.title) + '</span>';

    var message = document.createElement('p');
    message.className = 'lw-notification-card__message';
    message.setAttribute('data-testid', 'notification-course-' + id);
    message.textContent = config.body(courseTitle, context);

    content.appendChild(header);
    content.appendChild(message);

    if (dueDateLabel) {
      appendMeta(content, 'notification-due-date-' + id, 'Due: ' + dueDateLabel);
    }

    // The design shows the course provider as the assigning authority; older rows fall back to
    // the admin who assigned the course.
    var assignedBy = config.variant === 'assigned' ? (context.provider || context.assigned_by) : '';
    if (assignedBy) {
      appendMeta(content, 'notification-assigned-by-' + id, 'Assigned by: ' + assignedBy);
    }

    if (config.variant === 'completed' && context.badge_name) {
      appendMeta(
        content,
        'notification-badge-' + id,
        STR.badgeEarned.replace('%s', function () { return context.badge_name; }),
        'lw-notification-card__award'
      );
    }
    if (config.variant === 'completed' && context.has_certificate) {
      appendMeta(
        content,
        'notification-certificate-' + id,
        STR.certificateAvailable,
        'lw-notification-card__award'
      );
    }

    appendMeta(content, 'notification-created-date-' + id, relativeTime, 'lw-notification-card__timestamp');

    link.appendChild(accent);
    link.appendChild(content);
    link.addEventListener('click', function (event) {
      handleCardClick(event, notification);
    });

    return link;
  }

  function buildLegacyCard(notification) {
    var context = notification.content_context || {};
    var courseName = context.course_name || '';
    var isUnread = !notification.last_read;
    var safeUrl = getSafeNotificationUrl(notification.content_url) || '#';
    var relativeTime = formatRelativeTime(notification.created);

    var link = document.createElement('a');
    link.href = safeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'lw-notification-card' + (isUnread ? ' lw-notification-card--unread' : '');
    link.setAttribute('data-testid', 'notification-' + notification.id);

    var body = document.createElement('div');
    body.className = 'lw-notification-card__legacy-content';
    body.setAttribute('data-testid', 'notification-content-' + notification.id);
    body.innerHTML = sanitizeHtml(notification.content || '');

    var footer = document.createElement('div');
    footer.className = 'lw-notification-card__legacy-footer';

    if (courseName) {
      var course = document.createElement('span');
      course.setAttribute('data-testid', 'notification-course-' + notification.id);
      course.textContent = courseName;
      footer.appendChild(course);

      var dot = document.createElement('span');
      dot.className = 'px-1';
      dot.textContent = '\u2022';
      footer.appendChild(dot);
    }

    var created = document.createElement('span');
    created.setAttribute('data-testid', 'notification-created-date-' + notification.id);
    created.textContent = relativeTime;
    footer.appendChild(created);

    if (isUnread) {
      var unread = document.createElement('span');
      unread.className = 'lw-notification-card__unread-dot ms-2 d-inline-block';
      unread.setAttribute('data-testid', 'unread-notification-' + notification.id);
      unread.setAttribute('aria-label', STR.unreadLabel);
      footer.appendChild(unread);
    }

    link.appendChild(body);
    link.appendChild(footer);
    link.addEventListener('click', function (event) {
      handleCardClick(event, notification);
    });

    return link;
  }

  function buildCard(notification) {
    var config = TYPE_CONFIG[notification.notification_type];
    if (config) {
      return buildStructuredCard(notification, config);
    }
    return buildLegacyCard(notification);
  }

  function handleCardClick(event, notification) {
    event.preventDefault();
    var safeUrl = getSafeNotificationUrl(notification.content_url);
    if (!safeUrl) {
      return;
    }
    var markPromise = notification.last_read
      ? Promise.resolve()
      : apiMutate('PATCH', '/api/notifications/read/', { notification_id: notification.id });
    markPromise
      .then(function () {
        notification.last_read = notification.last_read || new Date().toISOString();
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
        return fetchCounts();
      })
      .catch(function () {
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
      });
  }

  function updateLoadMoreButton(section) {
    if (listState.loadMoreBtn && listState.loadMoreBtn.parentNode) {
      listState.loadMoreBtn.parentNode.removeChild(listState.loadMoreBtn);
      listState.loadMoreBtn = null;
    }
    if (!listState.hasMorePages || !listState.items.length) {
      return;
    }
    listState.loadMoreBtn = document.createElement('button');
    listState.loadMoreBtn.type = 'button';
    listState.loadMoreBtn.className = 'lw-notifications-drawer__load-more';
    listState.loadMoreBtn.setAttribute('data-testid', 'load-more-notifications');
    listState.loadMoreBtn.textContent = STR.loadMore;
    listState.loadMoreBtn.addEventListener('click', function () {
      loadNotificationList(false);
    });
    section.appendChild(listState.loadMoreBtn);
  }

  function renderNotificationList() {
    var section = ensureSection();
    section.querySelectorAll('.lw-notification-card, .lw-notifications-drawer__empty').forEach(function (node) {
      node.remove();
    });

    if (!listState.items.length) {
      renderEmptyState(section);
      return;
    }

    listState.items.forEach(function (notification) {
      section.appendChild(buildCard(notification));
    });
    updateLoadMoreButton(section);
  }

  function buildListUrl(page) {
    var params = new URLSearchParams({
      app_name: state.appName,
      page: String(page),
      page_size: String(PAGE_SIZE),
      tray_opened: 'true',
    });
    return '/api/notifications/?' + params.toString();
  }

  function loadNotificationList(reset) {
    if (listState.isFetching) {
      return Promise.resolve();
    }

    if (reset) {
      listState.items = [];
      listState.currentPage = 0;
      listState.hasMorePages = false;
      listState.sectionEl = null;
      listState.loadMoreBtn = null;
      listEl.innerHTML = '';
    }

    listState.isFetching = true;
    // Loading the next page keeps the button in place (disabled) so the list does not jump.
    var pendingBtn = reset ? null : listState.loadMoreBtn;
    if (pendingBtn) {
      pendingBtn.disabled = true;
      pendingBtn.setAttribute('aria-busy', 'true');
      pendingBtn.textContent = STR.loading;
    } else {
      setLoading(true);
    }

    var nextPage = reset ? 1 : listState.currentPage + 1;

    return apiGet(buildListUrl(nextPage))
      .then(function (data) {
        var results = data.results || [];
        listState.currentPage = data.current_page || nextPage;
        listState.hasMorePages = !!data.next;
        listState.items = reset ? results : listState.items.concat(results);

        return fetchCourseTitles(collectCourseIds(results)).then(function (titleMap) {
          Object.keys(titleMap).forEach(function (courseId) {
            listState.courseTitleMap[courseId] = titleMap[courseId];
          });
          renderNotificationList();
        });
      })
      .catch(function () {
        if (reset) {
          listEl.innerHTML = '';
          renderEmptyState(ensureSection());
        }
      })
      .then(function () {
        listState.isFetching = false;
        setLoading(false);
        // A successful load re-renders a fresh button; restore the old one only if the fetch failed.
        if (pendingBtn && pendingBtn === listState.loadMoreBtn) {
          pendingBtn.disabled = false;
          pendingBtn.removeAttribute('aria-busy');
          pendingBtn.textContent = STR.loadMore;
        }
      });
  }

  function markAllAsRead() {
    if (!state.appName) {
      return;
    }
    apiMutate('PATCH', '/api/notifications/read/', { app_name: state.appName })
      .then(function () {
        listState.items.forEach(function (notification) {
          notification.last_read = notification.last_read || new Date().toISOString();
        });
        renderNotificationList();
        return fetchCounts();
      })
      .catch(function () { /* non-fatal */ });
  }

  function openDrawer() {
    if (state.closeTimer) {
      clearTimeout(state.closeTimer);
      state.closeTimer = null;
    }
    mountDrawerPortal();
    listEl.innerHTML = '';
    listState.sectionEl = null;
    listState.loadMoreBtn = null;
    backdrop.hidden = false;
    drawer.hidden = false;
    bell.setAttribute('aria-expanded', 'true');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        state.isDrawerOpen = true;
        backdrop.classList.add('lw-notifications-drawer__backdrop--open');
        drawer.classList.add('lw-notifications-drawer--open');
        backdrop.style.transitionDuration = DRAWER_OPEN_MS + 'ms';
        drawer.style.transitionDuration = DRAWER_OPEN_MS + 'ms';
        closeBtn.focus({ preventScroll: true });
        loadNotificationList(true);
      });
    });
  }

  function closeDrawer() {
    state.isDrawerOpen = false;
    bell.setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('lw-notifications-drawer__backdrop--open');
    drawer.classList.remove('lw-notifications-drawer--open');
    backdrop.style.transitionDuration = DRAWER_CLOSE_MS + 'ms';
    drawer.style.transitionDuration = DRAWER_CLOSE_MS + 'ms';

    state.closeTimer = setTimeout(function () {
      backdrop.hidden = true;
      drawer.hidden = true;
      state.closeTimer = null;
      bell.focus();
    }, DRAWER_CLOSE_MS);
  }

  function toggleDrawer() {
    if (!state.showNotificationsTray) {
      return;
    }
    if (state.isDrawerOpen || !drawer.hidden) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function fetchCounts() {
    return apiGet('/api/openlms/notifications/unread-count/').then(function (data) {
      var countByApp = data.count_by_app_name || {};
      var appsId = Object.keys(countByApp);
      state.appsId = appsId;
      state.tabsCount = Object.assign({ count: data.count || 0 }, countByApp);
      state.showNotificationsTray = !!data.show_notifications_tray;

      if (state.showNotificationsTray) {
        updateBadges(state.tabsCount.count);
      }

      if (!state.urlParamsApplied) {
        state.urlParamsApplied = true;
        applyUrlParams(appsId);
      }
    });
  }

  // The ?app= and ?showNotifications= deep-link params, applied once on the first successful
  // count fetch (as the MFE plugin does). fetchCounts() also runs on every refresh, card click
  // and mark-all, which must not reset the tab or reopen (and reload) the drawer.
  function applyUrlParams(appsId) {
    var params = new URLSearchParams(window.location.search);
    state.appName = resolveDefaultAppName(appsId, params.get('app'));

    if (params.get('showNotifications') === 'true' && state.showNotificationsTray) {
      openDrawer();
    }
  }

  bell.addEventListener('click', toggleDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) {
    backdrop.addEventListener('click', closeDrawer);
  }
  if (markAllBtn) {
    markAllBtn.addEventListener('click', function (event) {
      event.preventDefault();
      markAllAsRead();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && state.isDrawerOpen) {
      closeDrawer();
    }
  });

  fetchCounts().catch(function () {
    // Notifications API unavailable: keep the bell visible but inert.
  });

  // Keep the badge fresh on long-lived pages, so a new assignment shows within a minute.
  function refreshCounts() {
    if (document.visibilityState === 'visible') {
      fetchCounts().catch(function () {});
    }
  }
  window.setInterval(refreshCounts, COUNT_REFRESH_MS);
  document.addEventListener('visibilitychange', refreshCounts);
})();
