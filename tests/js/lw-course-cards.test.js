/**
 * Tests for the enrolled-card links of the Learning Library (lw-course-cards.js).
 *
 * Run from the theme repo root, no dependencies:
 *   node tests/js/lw-course-cards.test.js
 *
 * Only the pure link choice behind `window.__LW_TEST__` is exercised; rendering is checked in
 * the browser.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = path.join(
  __dirname, '..', '..', 'tutorindigo', 'templates', 'indigo', 'lms', 'static', 'js', 'lw-course-cards.js'
);

function load() {
  const window = { __LW_TEST__: {} };
  const document = { addEventListener() {} };
  vm.runInContext(fs.readFileSync(SOURCE, 'utf8'), vm.createContext({ window, document }));
  return window.__LW_TEST__.courseCards;
}

const COURSE = 'course-v1:SSED+CS101+2026';
const ABOUT = `/courses/${encodeURIComponent(COURSE)}/about`;
const COURSEWARE = `/courses/${encodeURIComponent(COURSE)}/courseware`;

const cases = [
  // [name, tab, hasStarted, isRevisit, expected title, expected cta]
  ['Assigned, not started: title and Enroll and Start open the detail page', 'assigned', false, false, ABOUT, ABOUT],
  ['Assigned, started: title opens the detail page, Resume opens the player', 'assigned', true, false, ABOUT, COURSEWARE],
  ['Assigned, completed or failed: Revisit opens the player', 'assigned', false, true, ABOUT, COURSEWARE],
  ['Continue Learning: card opens the player (PRD LMS 5.2)', 'continue', true, false, COURSEWARE, COURSEWARE],
  ['Other tabs keep the player links', 'new', false, false, COURSEWARE, COURSEWARE],
  ['A card outside a tab keeps the player links', null, false, false, COURSEWARE, COURSEWARE],
];

const api = load();
let failed = 0;
cases.forEach(([name, tab, hasStarted, isRevisit, title, cta]) => {
  try {
    // Compare fields: objects made inside the VM have another realm's prototype.
    const links = api.enrolledCardLinks(COURSE, tab, hasStarted, isRevisit);
    assert.strictEqual(links.title, title, 'title link');
    assert.strictEqual(links.cta, cta, 'action link');
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${error && error.message}`);
  }
});
console.log(`\n${cases.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
