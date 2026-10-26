/**
 * Tests for the response and cache logic of the Learning Library (lw-courses-tabs.js).
 *
 * Run from the theme repo root, no dependencies:
 *   node tests/js/lw-courses-tabs.test.js
 *
 * The script is loaded into a minimal browser stub and only the pure logic behind the
 * `window.__LW_TEST__` hook is exercised: the per-tab cache and TTLs, stale previews, response
 * normalising (order, de-duplication, true count) and failures. DOM behaviour (rendering,
 * scrolling, gestures) is not covered here; check it in the browser.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = path.join(
  __dirname, '..', '..', 'tutorindigo', 'templates', 'indigo', 'lms', 'static', 'js', 'lw-courses-tabs.js'
);

// A controllable clock and a fake library API.
function setup(handler, options) {
  const opts = options || {};
  const clock = { now: 1000000 };
  class FakeDate extends Date {
    static now() { return clock.now; }
  }
  const calls = [];
  const fakeFetch = (url, fetchOptions) => {
    const params = new URL(url, 'http://lms.test').searchParams;
    const tab = params.get('tab');
    const page = Number(params.get('page'));
    calls.push(`${tab}:${page}`);
    if (handler(tab, page) === 'HANG') {
      // Never answers; only an abort ends it, like a stuck network request.
      return new Promise((resolve, reject) => {
        fetchOptions.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    }
    return Promise.resolve(handler(tab, page)).then((body) => {
      if (body instanceof Error) { return { ok: false, status: 500, json: () => Promise.resolve({}) }; }
      return { ok: true, json: () => Promise.resolve(body) };
    });
  };
  const window = {
    __LW_TEST__: {},
    gettext: (s) => s,
    location: { origin: 'http://lms.test', search: '' },
    setTimeout: opts.timers ? (fn, ms) => { opts.timers.push({ fn, ms }); return opts.timers.length; } : setTimeout,
    clearTimeout,
  };
  const document = { readyState: 'loading', addEventListener() {} };
  const context = vm.createContext({
    window, document, fetch: fakeFetch, performance: { now: () => 0 }, Date: FakeDate,
    URL, URLSearchParams, Promise, JSON, setTimeout, clearTimeout, AbortController,
  });
  vm.runInContext(fs.readFileSync(SOURCE, 'utf8'), context);
  return { api: window.__LW_TEST__.coursesTabs, clock, calls };
}

// A tab response like the real API: `shown` rows (ids c0..), the learner's true `total`.
function pageBody(shown, total) {
  const results = Array.from({ length: shown }, (_, i) => ({ courseId: `c${i}` }));
  return { results, count: total === undefined ? shown : total, page: 1, pageSize: 15, next: null };
}

// Values made inside the vm sandbox have their own prototypes; compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));
const ids = (rows) => rows.map((row) => row.courseId);
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('TTL is set per tab', () => {
  const { api } = setup(() => pageBody(1));
  assert.strictEqual(api.ttlFor('assigned'), 60 * 1000);
  assert.strictEqual(api.ttlFor('continue'), 60 * 1000);
  assert.strictEqual(api.ttlFor('mylist'), 5 * 60 * 1000);
  assert.strictEqual(api.ttlFor('new'), 5 * 60 * 1000);
  assert.strictEqual(api.ttlFor('suggested'), 5 * 60 * 1000);
  assert.strictEqual(api.ttlFor('unknown-tab'), 60 * 1000);
});

test('the request asks for one page of 15', async () => {
  const urls = [];
  const { api } = setup(() => pageBody(1));
  // setup() records `tab:page`; the page size is checked through the real URL builder below.
  await api.getPage('assigned');
  urls.push(api.tabUrl('assigned'));
  assert.ok(/[?&]tab=assigned(&|$)/.test(urls[0]));
  assert.ok(/[?&]page=1(&|$)/.test(urls[0]));
  assert.ok(/[?&]page_size=15(&|$)/.test(urls[0]));
});

test('normalizePage keeps API order, drops repeats and keeps the true count', () => {
  const { api } = setup(() => pageBody(1));
  const page = pageBody(15, 40);
  page.results.splice(3, 0, { courseId: 'c1' }); // a repeat
  const out = api.normalizePage(page);
  assert.deepStrictEqual(plain(ids(out.results)), plain(ids(pageBody(15).results)));
  assert.strictEqual(out.count, 40, 'count is the learner total, not the 15 shown');
});

test('normalizePage falls back to the row count and rejects bad data', () => {
  const { api } = setup(() => pageBody(1));
  assert.strictEqual(api.normalizePage({ results: [{ courseId: 'a' }] }).count, 1);
  assert.throws(() => api.normalizePage(null), /library_fetch_failed/);
  assert.throws(() => api.normalizePage({ results: 'nope' }), /library_fetch_failed/);
});

test('getPage caches within the TTL and refetches after it', async () => {
  const { api, clock, calls } = setup(() => pageBody(15, 20));
  await api.getPage('assigned');
  await api.getPage('assigned');
  assert.deepStrictEqual(plain(calls), ['assigned:1']);
  clock.now += 59 * 1000;
  await api.getPage('assigned');
  assert.strictEqual(calls.length, 1, 'still fresh at 59 s');
  clock.now += 2 * 1000;
  await api.getPage('assigned');
  assert.strictEqual(calls.length, 2, 'refetched after 60 s');
});

test('getPage uses a longer TTL for mylist and caches each tab on its own', async () => {
  const { api, clock, calls } = setup(() => pageBody(15, 20));
  await api.getPage('mylist');
  await api.getPage('new');
  assert.deepStrictEqual(plain(calls), ['mylist:1', 'new:1']);
  clock.now += 4 * 60 * 1000;
  await api.getPage('mylist');
  assert.strictEqual(calls.length, 2, 'fresh at 4 minutes');
  clock.now += 2 * 60 * 1000;
  await api.getPage('mylist');
  assert.strictEqual(calls.length, 3, 'refetched after 5 minutes');
});

test('getPage force skips the cache; clearCache empties it', async () => {
  const { api, calls } = setup(() => pageBody(15));
  await api.getPage('new');
  await api.getPage('new', true);
  assert.strictEqual(calls.length, 2);
  api.clearCache();
  await api.getPage('new');
  assert.strictEqual(calls.length, 3);
});

test('a failed request is not cached', async () => {
  let fail = true;
  const { api, calls } = setup(() => (fail ? new Error('boom') : pageBody(10)));
  await assert.rejects(api.getPage('new'), /library_fetch_failed/);
  fail = false;
  const data = await api.getPage('new');
  assert.strictEqual(data.results.length, 10);
  assert.strictEqual(calls.length, 2, 'the retry went to the network');
});

test('peekPage returns a fresh copy, then a stale one, then nothing', async () => {
  const { api, clock } = setup(() => pageBody(15, 20));
  assert.strictEqual(api.peekPage('assigned'), null, 'nothing cached yet');
  await api.getPage('assigned');
  assert.strictEqual(api.peekPage('assigned').fresh, true);
  clock.now += 2 * 60 * 1000;
  const stale = api.peekPage('assigned');
  assert.strictEqual(stale.fresh, false, 'past the TTL: a stale preview');
  assert.strictEqual(stale.data.results.length, 15);
  clock.now += api.MAX_STALE_MS;
  assert.strictEqual(api.peekPage('assigned'), null, 'too old to show');
});

test('a request that passes the timeout is aborted, fails and is not cached', async () => {
  const timers = [];
  let hang = true;
  const { api, calls } = setup(() => (hang ? 'HANG' : pageBody(3)), { timers });
  const pending = api.getPage('new');
  const timeout = timers.find((timer) => timer.ms === api.REQUEST_TIMEOUT_MS);
  assert.ok(timeout, 'a 10 s timer is set');
  assert.strictEqual(api.REQUEST_TIMEOUT_MS, 10 * 1000);
  timeout.fn();
  await assert.rejects(pending);
  hang = false;
  const data = await api.getPage('new');
  assert.strictEqual(data.results.length, 3);
  assert.strictEqual(calls.length, 2, 'the retry went to the network');
});

test('countLabel says how many exist when the list is capped', () => {
  const { api } = setup(() => pageBody(1));
  assert.strictEqual(api.countLabel(0, 0), '');
  assert.strictEqual(api.countLabel(1, 1), '1 course in this list');
  assert.strictEqual(api.countLabel(12, 12), '12 courses in this list');
  assert.strictEqual(api.countLabel(17, 15), 'Showing 15 of 17 courses in this list');
});

async function main() {
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ok   ${name}`);
    } catch (error) {
      failed += 1;
      console.log(`  FAIL ${name}\n       ${error && error.message}`);
    }
  }
  console.log(`\n${tests.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main();
