/**
 * Tests for the enrolled-card links of the Learning Library (lw-course-cards.js).
 *
 * Run from the theme repo root, no dependencies:
 *   node tests/js/lw-course-cards.test.js
 *
 * Only the pure logic behind `window.__LW_TEST__` is exercised (link choice, started state and
 * the completion cache); rendering is checked in the browser.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = path.join(
  __dirname, '..', '..', 'tutorindigo', 'templates', 'indigo', 'lms', 'static', 'js', 'lw-course-cards.js'
);

function load(sandbox) {
  const window = { __LW_TEST__: {}, addEventListener() {} };
  const document = { addEventListener() {} };
  vm.runInContext(
    fs.readFileSync(SOURCE, 'utf8'),
    vm.createContext(Object.assign({ window, document }, sandbox)),
  );
  return window.__LW_TEST__.courseCards;
}

const COURSE = 'course-v1:SSED+CS101+2026';
const ABOUT = `/courses/${encodeURIComponent(COURSE)}/about`;
const COURSEWARE = `/courses/${encodeURIComponent(COURSE)}/courseware`;

const ROW_ABOUT = '/courses/custom-about-link';
const cases = [
  // [name, tab, row about URL, not open yet, expected title, expected action]
  ['Assigned: title opens the detail page (PRD LMS 4.2), the action opens the player', 'assigned', null, false, ABOUT, COURSEWARE],
  ['Continue Learning: title and action open the player (PRD LMS 5.2)', 'continue', null, false, COURSEWARE, COURSEWARE],
  ['Other tabs: title and action open the player', 'new', null, false, COURSEWARE, COURSEWARE],
  ['A card outside a tab: title and action open the player', null, null, false, COURSEWARE, COURSEWARE],
  ['Course not open yet: Start and the title open the detail page', 'new', null, true, ABOUT, ABOUT],
  ["The row's own detail-page URL is used", 'assigned', ROW_ABOUT, true, ROW_ABOUT, ROW_ABOUT],
];

const api = load();
let failed = 0;
cases.forEach(([name, tab, rowAbout, notOpenYet, title, cta]) => {
  try {
    // Compare fields: objects made inside the VM have another realm's prototype.
    const links = api.enrolledCardLinks(COURSE, tab, rowAbout, notOpenYet);
    assert.strictEqual(links.title, title, 'title link');
    assert.strictEqual(links.cta, cta, 'action link');
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
});

// [name, course-completion row, expected started]
const startedCases = [
  ['Block completed, % still rounds to 0: Resume at 0%', { hasStarted: true, completion: 0 }, true],
  ['Older API without hasStarted: falls back to completion > 0', { completion: 12 }, true],
  ['Older API without hasStarted, 0%: Start', { completion: 0 }, false],
  ['Nothing completed: Start', { hasStarted: false, completion: 0 }, false],
  ['The backend decides when it sends hasStarted', { hasStarted: false, completion: 12 }, false],
  ['Not enrolled (no row): not started', undefined, false],
];
startedCases.forEach(([name, row, expected]) => {
  try {
    assert.strictEqual(api.isStarted(row), expected);
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
});

// The completion list is shared by cards rendered together but refetched after 30s, so cards
// re-rendered when the learner returns to the page show their new progress.
async function cacheCase() {
  const name = 'Completion list is reused within 30s and refetched after';
  const clock = { now: 1000000 };
  class FakeDate extends Date {
    static now() { return clock.now; }
  }
  let calls = 0;
  const fetch = () => {
    calls += 1;
    return Promise.resolve({ ok: true, json: () => Promise.resolve([{ courseId: COURSE, completion: calls }]) });
  };
  const cards = load({ Date: FakeDate, fetch });
  try {
    const first = await cards.getCompletionById();
    clock.now += 10 * 1000;
    await cards.getCompletionById();
    assert.strictEqual(calls, 1, 'one request within 30s');
    clock.now += 25 * 1000;
    const later = await cards.getCompletionById();
    assert.strictEqual(calls, 2, 'refetched after 30s');
    assert.strictEqual(first[COURSE].completion, 1);
    assert.strictEqual(later[COURSE].completion, 2);
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
}

// A failed request is retried on the next render instead of being kept for 30s.
async function failedFetchCase() {
  const name = 'A failed completion request is not cached';
  let calls = 0;
  const fetch = () => {
    calls += 1;
    return Promise.resolve(calls === 1
      ? { ok: false }
      : { ok: true, json: () => Promise.resolve([{ courseId: COURSE, completion: 40 }]) });
  };
  const cards = load({ fetch });
  try {
    const failedLoad = await cards.getCompletionById();
    assert.strictEqual(Object.keys(failedLoad).length, 0);
    // Marked, so a redraw on page return keeps the cards it already drew.
    assert.strictEqual(failedLoad, cards.completionUnavailable);
    const retried = await cards.getCompletionById();
    assert.strictEqual(calls, 2, 'retried');
    assert.strictEqual(retried[COURSE].completion, 40);
    assert.notStrictEqual(retried, cards.completionUnavailable);
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
}

// A failed refetch on page return keeps the last good progress instead of blanking the cards.
async function failedRefetchCase() {
  const name = 'A failed refetch keeps the last good completion list';
  let now = 0;
  class FakeDate extends Date { static now() { return now; } }
  let calls = 0;
  const fetch = () => {
    calls += 1;
    return Promise.resolve(calls === 1
      ? { ok: true, json: () => Promise.resolve([{ courseId: COURSE, completion: 40 }]) }
      : { ok: false });
  };
  const cards = load({ Date: FakeDate, fetch });
  try {
    const first = await cards.getCompletionById();
    now += 31 * 1000;
    const refetched = await cards.getCompletionById();
    assert.strictEqual(calls, 2, 'refetched after 30s');
    assert.strictEqual(refetched, first);
    assert.strictEqual(refetched[COURSE].completion, 40);
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
}

// A slow, older response that resolves after a newer one never replaces the newer list.
async function outOfOrderCase() {
  const name = 'An older response does not replace a newer completion list';
  let now = 0;
  class FakeDate extends Date { static now() { return now; } }
  const pending = [];
  const fetch = () => new Promise((resolve) => { pending.push(resolve); });
  const respond = (index, completion) => pending[index]({
    ok: true, json: () => Promise.resolve([{ courseId: COURSE, completion }]),
  });
  const cards = load({ Date: FakeDate, fetch });
  try {
    const older = cards.getCompletionById();
    now += 31 * 1000;
    const newer = cards.getCompletionById();
    respond(1, 60);
    assert.strictEqual((await newer)[COURSE].completion, 60);
    respond(0, 10);
    assert.strictEqual((await older)[COURSE].completion, 60, 'older resolves to the newer list');
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
}

// A course that has not opened yet sends Start to the detail page; staff go to the course.
const NOW = Date.parse('2026-10-28T00:00:00Z');
[
  ['Course opens next month: not open yet', '2026-11-28T00:00:00+00:00', false, true],
  ['Course already open', '2026-01-01T00:00:00+00:00', false, false],
  ['No start date: treated as open', '', false, false],
  ['Staff before the start date: treated as open', '2026-11-28T00:00:00+00:00', true, false],
].forEach(([name, start, isStaff, expected]) => {
  try {
    assert.strictEqual(api.isNotOpenYet(start, NOW, isStaff), expected);
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
});

// A response sent before an unenroll is used without the unenrolled course; responses to
// requests sent after it reflect the real enrollment.
async function unenrollRaceCase() {
  const name = 'An unenroll removes the course from earlier requests only; re-enrolling shows it';
  let now = 0;
  class FakeDate extends Date { static now() { return now; } }
  const pending = [];
  const fetch = () => new Promise((resolve) => { pending.push(resolve); });
  const respond = (index, rows) => pending[index](
    rows ? { ok: true, json: () => Promise.resolve(rows) } : { ok: false },
  );
  const OTHER = 'course-v1:SSED+CS102+2026';
  const cards = load({ Date: FakeDate, fetch });
  try {
    // A: nothing loaded yet; a response sent before the unenroll arrives after it. It is
    // used, without the unenrolled course (no request thrown away, none sent by the unenroll).
    const before = cards.getCompletionById();
    cards.forgetCompletionList(COURSE);
    assert.strictEqual(pending.length, 1, 'the unenroll sends no request itself');
    respond(0, [{ courseId: COURSE, completion: 40 }, { courseId: OTHER, completion: 55 }]);
    const a = await before;
    assert.strictEqual(a[COURSE], undefined, 'the unenrolled course is removed');
    assert.strictEqual(a[OTHER].completion, 55, 'the rest of the response is used');

    // B: the refetch after the unenroll fails: the other course keeps its progress.
    const afterUnenroll = cards.getCompletionById();
    respond(1, null);
    const b = await afterUnenroll;
    assert.notStrictEqual(b, cards.completionUnavailable, 'not the empty list');
    assert.strictEqual(b[COURSE], undefined);
    assert.strictEqual(b[OTHER].completion, 55);

    // C: the learner enrolled again (e.g. on the detail page, then Back): a request sent after
    // the unenroll lists the course, and it shows again.
    const later = cards.getCompletionById();
    respond(2, [{ courseId: COURSE, completion: 0 }, { courseId: OTHER, completion: 70 }]);
    const c = await later;
    assert.strictEqual(c[COURSE].completion, 0, 'the re-enrolled course is back');
    assert.strictEqual(c[OTHER].completion, 70);
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
}

cacheCase().then(failedFetchCase).then(failedRefetchCase).then(outOfOrderCase)
  .then(unenrollRaceCase).then(() => {
  const total = cases.length + startedCases.length + 5 + 4;
  console.log(`\n${total - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
});
