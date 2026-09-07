/**
 * Dropdown keyboard navigation and table sorting.
 *
 * Both are documented behaviour with real logic behind them -- a roving focus
 * model in one, type sniffing in the other -- and neither had a test. The
 * browser gates only assert that their controls are reachable and named.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePage, click, press } from './helpers/dom.mjs';

/* ---------------------------------------------------------------- dropdown */

const DROPDOWN = `
  <div class="retro-dropdown">
    <button class="retro-dropdown-toggle" data-retro-dropdown>Menu</button>
    <div class="retro-dropdown-menu">
      <a class="retro-dropdown-item" href="#1">One</a>
      <a class="retro-dropdown-item" href="#2">Two</a>
      <a class="retro-dropdown-item" href="#3">Three</a>
    </div>
  </div>
`;

const items = (document) => [...document.querySelectorAll('.retro-dropdown-item')];

test('the toggle advertises the menu it controls', () => {
  const { document } = makePage({ html: DROPDOWN });
  const toggle = document.querySelector('.retro-dropdown-toggle');

  assert.equal(toggle.getAttribute('aria-haspopup'), 'true');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.querySelector('.retro-dropdown-menu').getAttribute('role'), 'menu');
  assert.ok(items(document).every((i) => i.getAttribute('role') === 'menuitem'));
});

test('clicking the toggle opens the menu and flips aria-expanded', () => {
  const { window, document } = makePage({ html: DROPDOWN });
  const toggle = document.querySelector('.retro-dropdown-toggle');

  click(window, toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');

  click(window, toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('arrow keys move between items and Home/End jump to the ends', () => {
  const { window, document } = makePage({ html: DROPDOWN });
  const toggle = document.querySelector('.retro-dropdown-toggle');
  // A real click focuses the button it hits; a synthetic MouseEvent in jsdom
  // does not, so focus it first to match what a browser would do.
  toggle.focus();
  click(window, toggle);

  const [one, two, three] = items(document);

  // Opening with the mouse leaves focus on the toggle; the first ArrowDown is
  // what steps into the menu. Confirmed against Chromium before asserting it.
  assert.equal(document.activeElement, toggle, 'opening moved focus off the toggle');

  press(window, toggle, 'ArrowDown');
  assert.equal(document.activeElement, one, 'ArrowDown did not enter the menu');

  press(window, document.activeElement, 'ArrowDown');
  assert.equal(document.activeElement, two, 'ArrowDown did not advance');

  press(window, document.activeElement, 'ArrowUp');
  assert.equal(document.activeElement, one, 'ArrowUp did not go back');

  press(window, document.activeElement, 'End');
  assert.equal(document.activeElement, three, 'End did not reach the last item');

  press(window, document.activeElement, 'Home');
  assert.equal(document.activeElement, one, 'Home did not reach the first item');
});

test('Escape closes the menu and returns focus to the toggle', () => {
  const { window, document } = makePage({ html: DROPDOWN });
  const toggle = document.querySelector('.retro-dropdown-toggle');
  toggle.focus();
  click(window, toggle);
  press(window, toggle, 'ArrowDown');

  // Escape from inside the menu, which is where a keyboard user would be.
  press(window, document.activeElement, 'Escape');

  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, toggle, 'focus was stranded after Escape');
});

/* ------------------------------------------------------------------- table */

const TABLE = `
  <table class="retro-table retro-table-sortable">
    <thead>
      <tr>
        <th data-sort="text">Name</th>
        <th data-sort="number">Size</th>
        <th data-sort="none">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Charlie</td><td data-sort-value="2048">2 KB</td><td>edit</td></tr>
      <tr><td>alice</td><td data-sort-value="512">512 B</td><td>edit</td></tr>
      <tr><td>Bob</td><td data-sort-value="10240">10 KB</td><td>edit</td></tr>
    </tbody>
  </table>
`;

const column = (document, i) =>
  [...document.querySelectorAll('tbody tr')].map((r) => r.cells[i].textContent.trim());

test('sortable headers are focusable and announce their state', () => {
  const { document } = makePage({ html: TABLE });
  const [name, size, actions] = [...document.querySelectorAll('th')];

  assert.equal(name.tabIndex, 0);
  assert.equal(name.getAttribute('aria-sort'), 'none');
  assert.equal(size.getAttribute('aria-sort'), 'none');

  // data-sort="none" is the documented opt-out.
  assert.equal(actions.getAttribute('aria-sort'), null);
  assert.notEqual(actions.tabIndex, 0);
});

test('clicking a header sorts it, and clicking again reverses', () => {
  const { window, document } = makePage({ html: TABLE });
  const name = document.querySelectorAll('th')[0];

  click(window, name);
  assert.equal(name.getAttribute('aria-sort'), 'ascending');
  assert.deepEqual(column(document, 0), ['alice', 'Bob', 'Charlie'], 'not sorted case-insensitively');

  click(window, name);
  assert.equal(name.getAttribute('aria-sort'), 'descending');
  assert.deepEqual(column(document, 0), ['Charlie', 'Bob', 'alice']);
});

test('a numeric column sorts by data-sort-value, not by how it reads', () => {
  const { window, document } = makePage({ html: TABLE });
  const size = document.querySelectorAll('th')[1];

  click(window, size);

  // Sorted as text these would be "10 KB", "2 KB", "512 B".
  assert.deepEqual(column(document, 1), ['512 B', '2 KB', '10 KB']);
});

test('sorting one column clears the indicator on the others', () => {
  const { window, document } = makePage({ html: TABLE });
  const [name, size] = [...document.querySelectorAll('th')];

  click(window, name);
  click(window, size);

  assert.equal(name.getAttribute('aria-sort'), 'none', 'the old column kept its state');
  assert.equal(size.getAttribute('aria-sort'), 'ascending');
});

test('Enter and Space sort, so the header works without a mouse', () => {
  const { window, document } = makePage({ html: TABLE });
  const name = document.querySelectorAll('th')[0];

  press(window, name, 'Enter');
  assert.equal(name.getAttribute('aria-sort'), 'ascending');

  press(window, name, ' ');
  assert.equal(name.getAttribute('aria-sort'), 'descending');
});
