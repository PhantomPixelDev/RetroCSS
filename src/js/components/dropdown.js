/**
 * RetroCSS Dropdown Component
 * Provides dropdown menu functionality
 */

const RetroDropdown = {
  /** Visible menu items, in DOM order. */
  _items(drop) {
    const menu = drop.querySelector('.retro-dropdown-menu');
    if (!menu) return [];
    return Array.from(menu.querySelectorAll('.retro-dropdown-item')).filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true'
    );
  },

  /**
   * Menu semantics, applied on demand so existing markup needs no changes.
   * A toggle with no aria-expanded reads as a plain button to a screen reader,
   * giving no hint that it controls anything.
   */
  _annotate(drop) {
    const toggle = drop.querySelector('.retro-dropdown-toggle');
    const menu = drop.querySelector('.retro-dropdown-menu');
    if (toggle) {
      toggle.setAttribute('aria-haspopup', 'true');
      toggle.setAttribute('aria-expanded', drop.classList.contains('open') ? 'true' : 'false');
    }
    if (menu) {
      if (!menu.hasAttribute('role')) menu.setAttribute('role', 'menu');
      this._items(drop).forEach((item) => {
        if (!item.hasAttribute('role')) item.setAttribute('role', 'menuitem');
      });
    }
  },

  open(drop, { focus = null } = {}) {
    document.querySelectorAll('.retro-dropdown.open').forEach((other) => {
      if (other !== drop) this.close(other);
    });
    drop.classList.add('open');
    this._annotate(drop);
    this.position(drop);

    if (!focus) return;
    const items = this._items(drop);
    if (!items.length) return;
    // The closed menu is `visibility: hidden`, and a hidden element cannot take
    // focus. Reading offsetHeight forces the style/layout flush so the .open
    // class has actually taken effect before we call focus().
    const menu = drop.querySelector('.retro-dropdown-menu');
    if (menu) void menu.offsetHeight;
    (focus === 'last' ? items[items.length - 1] : items[0]).focus();
  },

  close(drop, { restoreFocus = false } = {}) {
    if (!drop.classList.contains('open')) return;
    drop.classList.remove('open');
    const toggle = drop.querySelector('.retro-dropdown-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      // Only pull focus back on a deliberate dismiss (Escape, or selecting an
      // item). Doing it on every outside click would steal focus from whatever
      // the user actually clicked.
      if (restoreFocus) toggle.focus();
    }
  },

  /** Flip the menu above the toggle when there is not room below. */
  position(drop) {
    const toggle = drop.querySelector('.retro-dropdown-toggle');
    const menu = drop.querySelector('.retro-dropdown-menu');
    if (!toggle || !menu) return;
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
  },

  /** Move focus by `delta`, wrapping at both ends. */
  _move(drop, delta) {
    const items = this._items(drop);
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    const next = current === -1
      ? (delta > 0 ? 0 : items.length - 1)
      : (current + delta + items.length) % items.length;
    items[next].focus();
  },

  init(root = document) {
    root.querySelectorAll('.retro-dropdown').forEach((drop) => this._annotate(drop));

    document.addEventListener('click', (e) => {
      // Dropdown toggle
      const toggle = e.target.closest('.retro-dropdown .retro-dropdown-toggle');
      if (toggle && root.contains(toggle)) {
        e.preventDefault();
        e.stopPropagation();
        const drop = toggle.closest('.retro-dropdown');
        if (drop) {
          if (drop.classList.contains('open')) this.close(drop);
          else this.open(drop);
        }
        return;
      }
      // Dropdown item
      const item = e.target.closest('.retro-dropdown-menu .retro-dropdown-item');
      if (item && root.contains(item)) {
        const drop = item.closest('.retro-dropdown');
        if (drop) this.close(drop, { restoreFocus: true });
        return;
      }
      // Click outside: close all open dropdowns
      root.querySelectorAll('.retro-dropdown.open').forEach((drop) => {
        if (!drop.contains(e.target)) this.close(drop);
      });
    });

    document.addEventListener('keydown', (e) => {
      const drop = e.target.closest && e.target.closest('.retro-dropdown');

      if (e.key === 'Escape') {
        const open = drop && drop.classList.contains('open')
          ? [drop]
          : Array.from(root.querySelectorAll('.retro-dropdown.open'));
        open.forEach((d) => this.close(d, { restoreFocus: d === drop }));
        return;
      }

      if (!drop) return;
      const onToggle = !!e.target.closest('.retro-dropdown-toggle');
      const isOpen = drop.classList.contains('open');

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) this.open(drop, { focus: 'first' });
          else this._move(drop, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) this.open(drop, { focus: 'last' });
          else this._move(drop, -1);
          break;
        case 'Home':
          if (isOpen && !onToggle) {
            e.preventDefault();
            const first = this._items(drop)[0];
            if (first) first.focus();
          }
          break;
        case 'End':
          if (isOpen && !onToggle) {
            e.preventDefault();
            const items = this._items(drop);
            if (items.length) items[items.length - 1].focus();
          }
          break;
        case 'Tab':
          // Tabbing away dismisses the menu, matching native select behaviour.
          if (isOpen) this.close(drop);
          break;
        default:
          break;
      }
    });
  },
};

export default RetroDropdown;
