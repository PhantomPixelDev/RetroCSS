/**
 * RetroCSS Dropdown Component
 * Provides dropdown menu functionality
 */

// Dropdown
const RetroDropdown = {
  init(root = document) {
    // Event delegation for dropdown toggles and items
    document.addEventListener('click', function (e) {
      // Dropdown toggle
      const toggle = e.target.closest('.retro-dropdown .retro-dropdown-toggle');
      if (toggle && root.contains(toggle)) {
        e.preventDefault();
        e.stopPropagation();
        const drop = toggle.closest('.retro-dropdown');
        if (drop) {
          // Close all other open dropdowns
          root.querySelectorAll('.retro-dropdown.open').forEach((other) => {
            if (other !== drop) other.classList.remove('open');
          });
          drop.classList.toggle('open');
          // Position the dropdown menu
          const menu = drop.querySelector('.retro-dropdown-menu');
          if (menu) {
            // Warn if menu is not a direct child
            if (menu.parentElement !== drop) {
              console.warn('retro-dropdown-menu should be a direct child of retro-dropdown for CSS to work.');
            }
            const toggleRect = toggle.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();
            const spaceBelow = window.innerHeight - toggleRect.bottom;
            const spaceAbove = toggleRect.top;
            if (spaceBelow < menuRect.height && spaceAbove > spaceBelow) {
              menu.style.bottom = '100%';
              menu.style.top = 'auto';
            } else {
              menu.style.top = '100%';
              menu.style.bottom = 'auto';
            }
          }
        }
        return;
      }
      // Dropdown item
      const item = e.target.closest('.retro-dropdown-menu .retro-dropdown-item');
      if (item && root.contains(item)) {
        const drop = item.closest('.retro-dropdown');
        if (drop) drop.classList.remove('open');
        return;
      }
      // Click outside: close all open dropdowns
      root.querySelectorAll('.retro-dropdown.open').forEach((drop) => {
        if (!drop.contains(e.target)) {
          drop.classList.remove('open');
        }
      });
    });
    // Close dropdown when pressing Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        root.querySelectorAll('.retro-dropdown.open').forEach((drop) => {
          drop.classList.remove('open');
        });
      }
    });
  },
};

export default RetroDropdown; 