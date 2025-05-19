/**
 * RetroCSS Table Component
 * Provides table sorting functionality
 */

// Table Sorting
const RetroTable = {
  init(root = document) {
    root.querySelectorAll('.retro-table-sortable').forEach((table) => {
      table.addEventListener('click', function (e) {
        const th = e.target.closest('th');
        if (!th || !table.contains(th)) return;
        const ths = table.querySelectorAll('th');
        const idx = Array.from(ths).indexOf(th);
        if (idx === -1) return;
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const isAsc = th.classList.toggle('asc');
        th.classList.toggle('desc', !isAsc);
        ths.forEach((oth) => {
          if (oth !== th) oth.classList.remove('asc', 'desc');
        });
        rows.sort((a, b) => {
          let t1 = a.children[idx].textContent.trim();
          let t2 = b.children[idx].textContent.trim();
          let n1 = parseFloat(t1), n2 = parseFloat(t2);
          if (!isNaN(n1) && !isNaN(n2)) {
            return isAsc ? n1 - n2 : n2 - n1;
          }
          return isAsc ? t1.localeCompare(t2) : t2.localeCompare(t1);
        });
        rows.forEach((row) => tbody.appendChild(row));
      });
    });
  },
};

export default RetroTable; 