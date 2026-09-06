/**
 * RetroCSS Toast Component
 * Provides toast notification functionality
 */

const RetroToast = {
  /**
   * The container is a live region. Without this, toasts were shown silently:
   * a screen reader had no way to know anything had appeared, which made the
   * theme toggle and every `data-retro-toast` trigger inaudible.
   */
  container() {
    let el = document.getElementById('retro-toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'retro-toast-container';
      document.body.appendChild(el);
    }
    // Set every time: the container may have been created by markup.
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'false');
    return el;
  },

  show(message, options = {}) {
    const container = this.container();

    const toast = document.createElement('div');
    toast.className = 'retro-toast';
    if (options.type) toast.classList.add(`retro-toast-${options.type}`);

    // An error should interrupt rather than wait its turn.
    if (options.type === 'danger') {
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
    }

    const body = document.createElement('div');
    body.className = 'retro-toast-body';
    if (options.html) {
      // Opt-in only. This assigns unsanitised markup, so never pass user
      // input here — the default path below uses textContent.
      toast.classList.add('retro-toast-html');
      body.innerHTML = message;
    } else {
      body.textContent = message;
    }
    toast.appendChild(body);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'retro-toast-close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';
    close.addEventListener('click', () => dismiss());
    toast.appendChild(close);

    container.appendChild(toast);

    // Auto-dismiss, but pausable. A fixed timer with no way to extend it is a
    // WCAG 2.2.1 (Timing Adjustable) failure; hovering or focusing the toast
    // holds it open, and `duration: 0` disables the timer entirely.
    const duration = options.duration === undefined ? 3000 : options.duration;
    let timer = null;
    let dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(timer);
      toast.remove();
    }
    const start = () => {
      if (duration > 0) timer = setTimeout(dismiss, duration);
    };
    const pause = () => clearTimeout(timer);

    toast.addEventListener('mouseenter', pause);
    toast.addEventListener('mouseleave', start);
    toast.addEventListener('focusin', pause);
    toast.addEventListener('focusout', start);

    start();
    return { dismiss, element: toast };
  },
};

export default RetroToast;
