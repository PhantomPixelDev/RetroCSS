// Retro Table Responsive Enhancements
// Automatically wraps .retro-table in .retro-table-responsive for horizontal scrolling.

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('table.retro-table').forEach(function (table) {
    // Wrap table in .retro-table-responsive if not already
    if (!table.parentElement.classList.contains('retro-table-responsive')) {
      var wrapper = document.createElement('div');
      wrapper.className = 'retro-table-responsive';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
}); 