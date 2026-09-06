/**
 * RetroCSS Table Component
 *
 * Click-to-sort columns on `.retro-table-sortable`.
 *
 *   <table class="retro-table retro-table-sortable">
 *     <thead>
 *       <tr>
 *         <th>Name</th>
 *         <th data-sort="number">Size</th>
 *         <th data-sort="none">Actions</th>
 *       </tr>
 *     </thead>
 *     <tbody>...</tbody>
 *   </table>
 *
 * `data-sort` is optional: `number`, `text`, or `none` to opt a column out.
 * Without it the column is sniffed from its first non-empty cell.
 */

/** Read the sort key for a row's cell in the given column. */
const cellValue = (row, index) => {
  const cell = row.children[index];
  if (!cell) return '';
  // An explicit data-sort-value wins, so a page can sort a formatted cell
  // ("2 days ago", "$1,204.00") by the value it actually means.
  return (cell.dataset.sortValue ?? cell.textContent).trim();
};

const asNumber = (s) => {
  // Tolerate a leading currency symbol, thousands separators and a trailing
  // unit, but require everything else to be one complete number. Two traps a
  // loose parseFloat falls into: it reads "2023-09-01" as 2023, turning a date
  // column into a sort by year, and it reads "SKU-001" as -1, turning an ID
  // column into a sort by the digits after the first dash. Hence the anchored
  // match and the narrow prefix.
  const m = String(s)
    .trim()
    .replace(/,/g, '')
    .match(/^[$€£¥\s]*([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*[^\d]*$/);
  return m ? parseFloat(m[1]) : null;
};

const RetroTable = {
  init(root = document) {
    root.querySelectorAll('.retro-table-sortable').forEach((table) => {
      // Idempotent. RetroCSS.init() is documented as a manual entry point and
      // this used to add another click listener to the same table on every
      // call, so the second call sorted twice per click and landed back where
      // it started.
      if (table.dataset.retroSortBound === 'true') return;
      table.dataset.retroSortBound = 'true';

      // Header cells only. This used to query every `th` in the table, so a
      // table with row headers in the body produced column indexes that did
      // not line up with the columns being read.
      const headers = Array.from(table.querySelectorAll('thead th'));
      if (!headers.length) return;

      const sortable = headers.filter((th) => th.dataset.sort !== 'none');
      sortable.forEach((th) => {
        // Sorting was mouse-only: a th is not focusable and not activatable
        // from the keyboard.
        if (!th.hasAttribute('tabindex')) th.tabIndex = 0;
        if (!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort', 'none');
        th.classList.add('retro-th-sortable');
      });

      const sortBy = (th) => {
        const index = headers.indexOf(th);
        const tbody = table.querySelector('tbody');
        if (index === -1 || !tbody) return;

        const rows = Array.from(tbody.rows);
        if (rows.length < 2) return;

        // Toggle this column, and reset every other one -- including its
        // aria-sort, which is what a screen reader reads out.
        const ascending = th.getAttribute('aria-sort') !== 'ascending';
        headers.forEach((other) => {
          if (other === th) return;
          other.setAttribute('aria-sort', 'none');
          other.classList.remove('asc', 'desc');
        });
        th.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
        th.classList.toggle('asc', ascending);
        th.classList.toggle('desc', !ascending);

        // Declared type wins; otherwise sniff from the first non-empty cell.
        let numeric = th.dataset.sort === 'number';
        if (!th.dataset.sort) {
          const sample = rows.map((r) => cellValue(r, index)).find((v) => v !== '');
          numeric = sample !== undefined && asNumber(sample) !== null;
        }

        const dir = ascending ? 1 : -1;
        // Array.prototype.sort is stable, so rows that compare equal keep the
        // order they were in.
        rows.sort((a, b) => {
          const x = cellValue(a, index);
          const y = cellValue(b, index);
          if (numeric) {
            const nx = asNumber(x);
            const ny = asNumber(y);
            // Non-numeric cells in a numeric column sort to the bottom either
            // way, rather than being compared against NaN.
            if (nx === null && ny === null) return 0;
            if (nx === null) return 1;
            if (ny === null) return -1;
            return (nx - ny) * dir;
          }
          return x.localeCompare(y, undefined, { numeric: true }) * dir;
        });

        // One reflow instead of one per row.
        const frag = document.createDocumentFragment();
        rows.forEach((row) => frag.appendChild(row));
        tbody.appendChild(frag);
      };

      table.addEventListener('click', (e) => {
        const th = e.target.closest('thead th');
        if (th && sortable.includes(th)) sortBy(th);
      });

      table.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const th = e.target.closest('thead th');
        if (!th || !sortable.includes(th)) return;
        // Space scrolls the page otherwise.
        e.preventDefault();
        sortBy(th);
      });
    });
  },
};

export default RetroTable;
