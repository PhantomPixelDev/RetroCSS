/**
 * RetroCSS Modal Component
 * Provides modal dialog functionality with open/close actions
 */

// Elements that can hold focus. `:not([tabindex="-1"])` keeps programmatically
// focusable-but-not-tabbable nodes out of the tab cycle.
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Modal System
const RetroModal = {
  // The element that had focus when the modal opened, so it can be restored.
  _lastFocused: null,

  /**
   * Visible, focusable descendants, in DOM order.
   * offsetParent filters out anything display:none; the getClientRects check
   * catches position:fixed elements, which have no offsetParent.
   */
  _focusable(modal) {
    return Array.from(modal.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el.getClientRects().length > 0
    );
  },

  /**
   * Take the rest of the page out of the accessibility tree and the tab order
   * while the modal is open. Without this, Tab walks straight out of the
   * dialog and into the page behind it.
   */
  _isolate(modal) {
    this._release();
    // Walk from the modal up to <body>, inerting every sibling at each level.
    // Only inerting body's children would leave anything alongside the modal
    // inside a wrapper still tabbable -- and modals are usually nested.
    for (let node = modal; node && node !== document.body; node = node.parentElement) {
      const parent = node.parentElement;
      if (!parent) break;
      Array.from(parent.children).forEach((el) => {
        if (el === node || el.id === 'retro-toast-container') return;
        if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') return;
        el.setAttribute('inert', '');
        // aria-hidden for engines that do not support inert yet.
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('data-retro-inert', '');
      });
    }
  },

  _release() {
    document.querySelectorAll('[data-retro-inert]').forEach((el) => {
      el.removeAttribute('inert');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('data-retro-inert');
    });
  },

  /** Keep Tab and Shift+Tab cycling inside the open dialog. */
  _trap(e, modal) {
    if (e.key !== 'Tab') return;
    const items = this._focusable(modal);
    if (!items.length) {
      // Nothing focusable inside: keep focus on the dialog itself.
      e.preventDefault();
      modal.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || active === modal)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    } else if (!modal.contains(active)) {
      // Focus escaped (e.g. it was in the address bar); pull it back.
      e.preventDefault();
      first.focus();
    }
  },

  init(root = document) {
    // Event delegation for modal open/close
    document.addEventListener('click', (e) => {
      // Open modal
      const openTrigger = e.target.closest('[data-toggle="modal"], .modal-demo-btn, [data-retro-modal]');
      if (openTrigger && root.contains(openTrigger)) {
        e.preventDefault();
        const targetId = openTrigger.getAttribute('data-target') || openTrigger.getAttribute('data-retro-modal');
        if (targetId) {
          this.show(targetId);
        } else {
          console.warn('Modal trigger missing target ID', openTrigger);
        }
        return;
      }
      // Close modal
      const closeBtn = e.target.closest('.retro-modal-close, [data-close="modal"]');
      if (closeBtn && root.contains(closeBtn)) {
        e.preventDefault();
        const modal = closeBtn.closest('.retro-modal');
        if (modal) this.hide(modal.id);
        return;
      }
      // Click on backdrop
      if (e.target.classList.contains('retro-modal')) this.hide(e.target.id);
    });

    document.addEventListener('keydown', (e) => {
      const openModal = document.querySelector('.retro-modal.show');
      if (!openModal) return;
      if (e.key === 'Escape') {
        this.hide(openModal.id);
        return;
      }
      this._trap(e, openModal);
    });

    console.log('Modal component initialized');
  },

  show(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`Modal with ID ${modalId} not found`);
      return;
    }

    // Re-entry guard. If something opens the same modal twice, the second
    // call must not overwrite _lastFocused with a node inside the dialog --
    // that is how focus restore silently starts returning to the wrong place.
    if (modal.classList.contains('show')) return;

    this._lastFocused = document.activeElement;

    // Dialog semantics, applied here so existing markup needs no changes.
    if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    // Focusable as a fallback target for the trap, but not in the tab order.
    if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');

    // Name the dialog from its header if the author has not already.
    if (!modal.hasAttribute('aria-label') && !modal.hasAttribute('aria-labelledby')) {
      const header = modal.querySelector('.retro-modal-header');
      if (header) {
        if (!header.id) header.id = `${modalId}-title`;
        modal.setAttribute('aria-labelledby', header.id);
      }
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    this._isolate(modal);

    // Move focus in: an explicit [autofocus] wins, else the first control,
    // else the dialog itself.
    const target = modal.querySelector('[autofocus]') || this._focusable(modal)[0] || modal;
    target.focus();

    console.log(`Modal ${modalId} opened`);
  },

  hide(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('show');
    modal.removeAttribute('aria-modal');
    document.body.style.overflow = '';
    this._release();

    // Return focus to whatever opened the modal, so keyboard users do not get
    // dropped back at the top of the document.
    if (this._lastFocused && document.contains(this._lastFocused)) {
      this._lastFocused.focus();
    }
    this._lastFocused = null;

    console.log(`Modal ${modalId} closed`);
  },
};

export default RetroModal;
