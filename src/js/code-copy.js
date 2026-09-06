/**
 * RetroCSS Code Copy Button
 *
 * Adds a copy button to every `.retro-code` block. Called from
 * RetroCSS.init(); previously the module was bundled but never initialised, so
 * the button existed only in the stylesheet.
 */

const RetroCodeCopy = {
  /** How long the "Copied!" / "Failed" state stays up, in ms. */
  feedbackDuration: 2000,

  init(root = document) {
    root.querySelectorAll('.retro-code').forEach((block) => {
      // Idempotent: RetroCSS.init() is documented as a manual entry point, so
      // a second call must not stack a second button on every block.
      if (block.querySelector('.retro-code-copy')) return;

      const code = block.querySelector('code');
      // Nothing to copy. The old version read `.textContent` off this without
      // a guard, so a `.retro-code` with no <code> child threw on click.
      if (!code) return;

      const button = document.createElement('button');
      // Without an explicit type a <button> inside a <form> submits it.
      button.type = 'button';
      button.className = 'retro-code-copy';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      // The label changes to report the result, so it has to be announced.
      button.setAttribute('aria-live', 'polite');

      let timer = null;
      const report = (label, state) => {
        clearTimeout(timer);
        button.textContent = label;
        // A class, not an inline hex. The old version assigned '#c0c0c0' and
        // '#ffcccc' directly, which ignored [data-theme] entirely and left
        // pale-on-pale text on the dark chassis.
        button.classList.toggle('retro-code-copy-ok', state === 'ok');
        button.classList.toggle('retro-code-copy-fail', state === 'fail');
        timer = setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('retro-code-copy-ok', 'retro-code-copy-fail');
        }, this.feedbackDuration);
      };

      button.addEventListener('click', async () => {
        const text = code.textContent;
        try {
          // navigator.clipboard is undefined outside a secure context, which
          // includes anyone opening the docs over plain http or from file://.
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            throw new Error('clipboard unavailable');
          }
          report('Copied!', 'ok');
        } catch {
          // Leave the code selected so the reader can copy it by hand.
          const range = document.createRange();
          range.selectNodeContents(code);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          report('Press Ctrl+C', 'fail');
        }
      });

      block.appendChild(button);
    });
  },
};

window.RetroCodeCopy = RetroCodeCopy;

export default RetroCodeCopy;
