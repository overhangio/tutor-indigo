(function () {
    'use strict';

    var ENABLED = {% if INDIGO_ENABLE_DYNAMIC_THEME %}true{% else %}false{% endif %};
    var CACHE_KEY = 'indigo-user-theme-legacy';
    var CACHE_TTL_MS = 5 * 60 * 1000;
    var lastFetched = 0;
    var API_PATH = '/api/indigo/v1/theme/';
    var HEX_RE = /^#[0-9a-f]{6}$/;

    var applied = [];
    var appliedChanges = null;
    var signature = null;
    var stats = null;

    function readCookie(name) {
        var parts = document.cookie ? document.cookie.split('; ') : [];
        for (var i = 0; i < parts.length; i += 1) {
            if (parts[i].indexOf(name + '=') === 0) {
                return parts[i].slice(name.length + 1);
            }
        }
        return null;
    }

    function currentUsername() {
        try {
            var raw = readCookie('edx-user-info');
            if (!raw) {
                return null;
            }
            var decoded = decodeURIComponent(raw).replace(/\\"/g, '"');
            var match = /"username"\s*:\s*"([^"]+)"/.exec(decoded);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    }

    function clearCache() {
        try {
            window.localStorage.removeItem(CACHE_KEY);
        } catch (error) {}
    }

    function readCache() {
        try {
            var raw = window.localStorage.getItem(CACHE_KEY);
            var cache = raw ? JSON.parse(raw) : null;
            var username = currentUsername();
            if (!cache || !username || cache.username !== username) {
                clearCache();
                return null;
            }
            lastFetched = cache.fetched || 0;
            return cache.payload;
        } catch (error) {
            return null;
        }
    }

    function cacheIsFresh() {
        return lastFetched > 0 && (Date.now() - lastFetched) < CACHE_TTL_MS;
    }

    function writeCache(payload) {
        try {
            var username = currentUsername();
            if (!username) {
                clearCache();
                return;
            }
            lastFetched = Date.now();
            window.localStorage.setItem(CACHE_KEY, JSON.stringify({
                username: username,
                fetched: lastFetched,
                payload: payload
            }));
        } catch (error) {}
    }

    function colorChanges(payload) {
        var presets = (payload && payload.presets) || [];
        var active = null;
        for (var i = 0; i < presets.length; i += 1) {
            if (presets[i].slug === payload.preset) {
                active = presets[i];
            }
        }
        if (!active) {
            return [];
        }
        var defaults = active.tokens || {};
        var effective = payload.tokens || {};
        var seen = {};
        var changes = [];
        Object.keys(defaults).forEach(function (token) {
            var from = String(defaults[token] || '').trim().toLowerCase();
            var to = String(effective[token] || '').trim().toLowerCase();
            if (!HEX_RE.test(from) || !HEX_RE.test(to) || from === to || seen[from]) {
                return;
            }
            seen[from] = true;
            changes.push({ from: from, to: to });
        });
        return changes;
    }

    function channels(hex) {
        return [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
    }

    function patternFor(change) {
        var rgb = channels(change.from);
        var sep = '(\\s*[,\\s]\\s*)';
        return '#' + change.from.slice(1) + '([0-9a-f]{2})?(?![0-9a-f])'
            + '|rgba?\\(\\s*' + rgb[0] + sep + rgb[1] + sep + rgb[2] + '(?=\\s*[,)\\/])';
    }

    function hexKey(r, g, b) {
        var parts = [r, g, b].map(function (channel) {
            var hex = Number(channel).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        });
        return '#' + parts.join('');
    }

    var COLOR_RE = new RegExp(
        '#([0-9a-f]{6})([0-9a-f]{2})?(?![0-9a-f])'
        + '|rgba?\\(\\s*(\\d{1,3})(\\s*[,\\s]\\s*)(\\d{1,3})(\\s*[,\\s]\\s*)(\\d{1,3})(?=\\s*[,)\\/])',
        'gi'
    );

    function buildColorMap(changes) {
        var map = {};
        for (var i = 0; i < changes.length; i += 1) {
            map[changes[i].from.toLowerCase()] = changes[i].to;
        }
        return map;
    }

    function remap(value, colorMap) {
        COLOR_RE.lastIndex = 0;
        return value.replace(COLOR_RE, function (match, hex, alpha, r, sep1, g, sep2, b) {
            if (hex) {
                var toHex = colorMap['#' + hex.toLowerCase()];
                return toHex ? toHex + (alpha || '') : match;
            }
            var toRgb = colorMap[hexKey(r, g, b)];
            if (!toRgb) {
                return match;
            }
            var rgb = channels(toRgb);
            return match.slice(0, match.indexOf('(')) + '(' + rgb[0] + sep1 + rgb[1] + sep2 + rgb[2];
        });
    }

    function revert() {
        for (var i = applied.length - 1; i >= 0; i -= 1) {
            try {
                applied[i].style.setProperty(applied[i].name, applied[i].value, applied[i].priority);
            } catch (error) {}
        }
        applied = [];
    }

    function visitStyleRule(rule, context) {
        var style = rule.style;
        if (!style || !style.length) {
            return;
        }
        var text = style.cssText;
        if (!text || !context.probe.test(text)) {
            return;
        }
        var touched = false;
        for (var i = 0; i < style.length; i += 1) {
            var name = style[i];
            var value = style.getPropertyValue(name);
            context.declarations += 1;
            var next = remap(value, context.colorMap);
            if (next === value) {
                continue;
            }
            var priority = style.getPropertyPriority(name);
            try {
                style.setProperty(name, next, priority);
            } catch (error) {
                continue;
            }
            applied.push({ style: style, name: name, value: value, priority: priority });
            context.remapped += 1;
            touched = true;
        }
        if (touched) {
            context.rules += 1;
        }
    }

    function visitRules(rules, context) {
        for (var i = 0; i < rules.length; i += 1) {
            var rule = rules[i];
            context.scanned += 1;
            if (rule.type === 1) {
                visitStyleRule(rule, context);
            } else if (rule.cssRules && (rule.type === 4 || rule.type === 12)) {
                visitRules(rule.cssRules, context);
            }
        }
    }

    function retint(changes) {
        var context = {
            colorMap: buildColorMap(changes),
            probe: new RegExp(changes.map(patternFor).join('|'), 'i'),
            sheets: 0,
            blocked: 0,
            scanned: 0,
            declarations: 0,
            remapped: 0,
            rules: 0
        };
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i += 1) {
            var rules = null;
            try {
                rules = sheets[i].cssRules;
            } catch (error) {
                context.blocked += 1;
                continue;
            }
            if (!rules) {
                continue;
            }
            context.sheets += 1;
            visitRules(rules, context);
        }
        return context;
    }

    function apply(payload) {
        var changes = colorChanges(payload);
        var key = JSON.stringify(changes);
        if (key !== appliedChanges) {
            revert();
            appliedChanges = key;
            signature = null;
            stats = null;
        }
        if (!changes.length || signature === document.styleSheets.length) {
            return;
        }
        signature = document.styleSheets.length;
        var clock = window.performance && window.performance.now ? window.performance : null;
        var started = clock ? clock.now() : 0;
        var context = retint(changes);
        var elapsed = clock ? clock.now() - started : 0;
        stats = {
            changes: changes,
            scans: (stats ? stats.scans : 0) + 1,
            sheets: context.sheets,
            blockedSheets: context.blocked,
            rulesScanned: (stats ? stats.rulesScanned : 0) + context.scanned,
            declarationsScanned: (stats ? stats.declarationsScanned : 0) + context.declarations,
            declarationsRetinted: applied.length,
            rulesRetinted: (stats ? stats.rulesRetinted : 0) + context.rules,
            milliseconds: (stats ? stats.milliseconds : 0) + elapsed
        };
    }

    function refresh() {
        var payload = readCache();
        if (payload) {
            apply(payload);
        }
    }

    function load() {
        window.fetch(API_PATH, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        }).then(function (response) {
            if (response.status === 401 || response.status === 403) {
                clearCache();
                revert();
                appliedChanges = null;
                signature = null;
                stats = null;
                return null;
            }
            return response.ok ? response.json() : null;
        }).then(function (payload) {
            if (payload) {
                writeCache(payload);
                apply(payload);
            }
        }).catch(function () {});
    }

    function start() {
        if (!ENABLED) {
            clearCache();
            return;
        }
        window.indigoDynamicTheme = {
            stats: function () {
                return stats;
            },
            refresh: refresh,
            revert: revert
        };
        refresh();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', refresh);
        }
        window.addEventListener('load', refresh);
        if (currentUsername()) {
            if (!cacheIsFresh()) {
                load();
            }
        } else {
            clearCache();
            revert();
        }
    }

    start();
}());
