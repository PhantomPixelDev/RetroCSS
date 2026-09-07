/**
 * RetroCSS - A Retro-Inspired CSS Framework
 * Main JavaScript entry point that imports and exports all components
 */

// Import all components
import RetroModal from './components/modal.js';
import RetroToast from './components/toast.js';
import RetroForm from './components/form.js';
import RetroTable from './components/table.js';
import RetroDropdown from './components/dropdown.js';
import RetroFileUpload from './components/file-upload.js';
import RetroEvents from './components/events.js';

// Import standalone modules - this only imports them, 
// we need to actually reference them from the window object
import './carousel.js';
import './tabs.js';
import RetroCodeCopy from './code-copy.js';
import './infinite-scroll.js';
import './table-responsive.js';
import { bindOnce, claimGlobal } from './util/bind.js';

// localStorage is read at module scope, so anything that throws here takes the
// whole bundle down during evaluation -- which is what happens in a sandboxed
// iframe or with third-party storage blocked. Every access is guarded.
// Matches anything the browser will put in the tab order. Shared by the
// tooltip trigger check and the rating group.
const FOCUSABLE_SELECTOR =
  'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
  'select:not([disabled]),textarea:not([disabled]),iframe,[contenteditable]:not([contenteditable="false"]),' +
  '[tabindex]:not([tabindex="-1"])';

// Tooltips need stable ids to be referenced by aria-describedby.
let tooltipSeq = 0;

function storedTheme() {
  try {
    // `localStorage` is not merely blocked outside a browser, it is undefined,
    // so the guard covers SSR as well as sandboxed iframes.
    return typeof localStorage === 'undefined' ? null : localStorage.getItem('retro-theme');
  } catch (e) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem('retro-theme', theme);
  } catch (e) {
    // Storage unavailable. The theme still applies for this page view; it just
    // will not survive a reload.
  }
}

/** The OS-level preference, or null where matchMedia is unavailable. */
function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * An explicit choice always wins; otherwise follow the OS. Before this the
 * default was a hardcoded 'light', so a visitor whose system was set to dark
 * got a light page until they found the toggle -- on a framework that ships a
 * full dark theme.
 */
function readStoredTheme() {
  return storedTheme() || systemTheme() || 'light';
}

// Create a namespace for all RetroCSS components
const RetroCSS = {
  modal: RetroModal,
  toast: RetroToast,
  form: RetroForm,
  table: RetroTable,
  dropdown: RetroDropdown,
  fileUpload: RetroFileUpload,
  events: RetroEvents,
  
  // References to the standalone modules. Getters rather than values: read
  // eagerly they touch `window` during module evaluation, which throws the
  // moment a server-rendered app imports the package -- and they also captured
  // whatever was on `window` at import time rather than at call time.
  get carousel() {
    return typeof window === 'undefined' ? undefined : window.RetroCarousel;
  },
  get accordion() {
    return typeof window === 'undefined' ? undefined : window.RetroAccordion;
  },
  get tabs() {
    return typeof window === 'undefined' ? undefined : window.RetroTabs;
  },
  get infiniteScroll() {
    return typeof window === 'undefined' ? undefined : window.RetroInfiniteScroll;
  },
  
  // Store theme preference. Read defensively: in a sandboxed iframe, or with
  // third-party storage blocked, touching localStorage throws SecurityError —
  // and this runs during module evaluation, so it would take the whole bundle
  // down before init() ever ran.
  theme: readStoredTheme(),
  
  // Initialize all components
  init() {
    
    // Initialize modular components
    RetroModal.init();
    RetroDropdown.init();
    RetroForm.init();
    RetroTable.init();
    RetroFileUpload.init();
    
    // Initialize standalone components from window
    if (window.RetroCarousel && typeof window.RetroCarousel.init === 'function') {
      window.RetroCarousel.init();
    } else {
      console.warn("RetroCarousel not available");
    }
    
    if (window.RetroTabs && typeof window.RetroTabs.init === 'function') {
      window.RetroTabs.init();
    }
    
    if (window.RetroAccordion && typeof window.RetroAccordion.init === 'function') {
      window.RetroAccordion.init();
    }

    if (window.RetroInfiniteScroll && typeof window.RetroInfiniteScroll.init === 'function') {
      window.RetroInfiniteScroll.init();
    }

    // Was bundled but never called, so .retro-code-copy existed only in the
    // stylesheet and no code block ever got a button.
    RetroCodeCopy.init();
    
    // NOTE: [data-retro-modal] triggers used to get a per-element click
    // listener here, on top of the delegated one RetroModal.init() already
    // installs for the same selector -- so every trigger opened its modal
    // twice. Delegation alone is correct and also covers triggers added to
    // the DOM later.

    // Initialize tooltips
    this.initTooltips();
    
    // Initialize toast triggers
    this.initToastTriggers();
    
    // Initialize search bars
    this.initSearchBars();
    
    // Initialize tag inputs
    this.initTagInputs();
    
    // Initialize theme toggler
    this.initThemeToggle();
    this.initSystemThemeWatch();
    
    // Apply current theme
    this.applyTheme(this.theme);
    
    // Emit initialization event
    RetroEvents.emit('init', { timestamp: Date.now() });
    
    this.initRatingStars();
    
    return this;
  },
  
  // Custom tooltip implementation
  initTooltips() {
    // Find all elements with data-retro-tooltip attribute
    const tooltipTriggers = document.querySelectorAll('[data-retro-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
      if (!bindOnce(trigger, 'tooltip')) return;
      // Get tooltip content
      const content = trigger.getAttribute('data-retro-tooltip');
      if (!content) return;
      
      // Get tooltip position and variant
      const position = trigger.getAttribute('data-tooltip-position') || 'top';
      const variant = trigger.getAttribute('data-tooltip-variant') || '';
      
      // Create tooltip element
      const tooltip = document.createElement('div');
      tooltip.className = `retro-tooltip retro-tooltip-${position}`;
      if (variant) tooltip.classList.add(`retro-tooltip-${variant}`);
      tooltip.textContent = content;
      
      // Remove any existing tooltip
      const existingTooltip = trigger.querySelector('.retro-tooltip');
      if (existingTooltip) existingTooltip.remove();
      
      // Append tooltip to trigger
      trigger.style.position = 'relative';
      trigger.appendChild(tooltip);
      
      // Name the tooltip and point the trigger at it. Without this the text is
      // decorative: it renders, and a screen reader never reads it out.
      tooltip.setAttribute('role', 'tooltip');
      if (!tooltip.id) {
        tooltipSeq += 1;
        tooltip.id = `retro-tooltip-${tooltipSeq}`;
      }
      const describedBy = trigger.getAttribute('aria-describedby');
      if (!describedBy) {
        trigger.setAttribute('aria-describedby', tooltip.id);
      } else if (!describedBy.split(/\s+/).includes(tooltip.id)) {
        trigger.setAttribute('aria-describedby', `${describedBy} ${tooltip.id}`);
      }

      // A trigger that is not reachable cannot show its tooltip on focus. Every
      // trigger on the demo pages is already an <a> or <button>; this covers a
      // consumer who put the attribute on a <span>.
      if (!trigger.matches(FOCUSABLE_SELECTOR) && !trigger.hasAttribute('tabindex')) {
        trigger.tabIndex = 0;
      }

      const show = () => tooltip.classList.add('show');
      const hide = () => tooltip.classList.remove('show');

      trigger.addEventListener('mouseenter', show);
      trigger.addEventListener('mouseleave', hide);
      // WCAG 1.4.13: content revealed on hover must also appear on focus.
      trigger.addEventListener('focus', show);
      trigger.addEventListener('blur', hide);
      // ...and must be dismissible without moving the pointer or the focus.
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hide();
      });
    });
  },
  
  // Initialize toast trigger elements
  initToastTriggers() {
    const toastTriggers = document.querySelectorAll('[data-retro-toast]');
    
    toastTriggers.forEach(trigger => {
      // Without this each init() added another click handler, so a page
      // re-initialised three times showed three toasts per click.
      if (!bindOnce(trigger, 'toastTrigger')) return;
      trigger.addEventListener('click', () => {
        const message = trigger.getAttribute('data-retro-toast');
        const type = trigger.getAttribute('data-retro-toast-type') || '';
        const duration = parseInt(trigger.getAttribute('data-retro-toast-duration')) || 3000;
        const html = trigger.hasAttribute('data-retro-toast-html');
        
        RetroToast.show(message, {
          type,
          duration,
          html
        });
      });
    });
  },
  
  // Initialize search bar components
  initSearchBars() {
    const searchBars = document.querySelectorAll('.retro-search-bar');

    searchBars.forEach((searchBar) => {
      if (!bindOnce(searchBar, 'searchBar')) return;
      const input = searchBar.querySelector('.retro-search-input');
      const suggestions = searchBar.querySelector('.retro-search-suggestions');
      if (!input) return;

      // The author's own suggestion nodes. This used to do
      // `suggestions.innerHTML = ''` on every keystroke and inject three
      // hardcoded "<value> - Result N" items, destroying real markup in any
      // page that used the component. Filter what the author wrote instead.
      const items = suggestions
        ? Array.from(suggestions.querySelectorAll('.retro-search-suggestion'))
        : [];

      const choose = (item) => {
        input.value = item.textContent.trim();
        searchBar.classList.remove('active');
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus();
      };
      items.forEach((item) => item.addEventListener('click', () => choose(item)));

      input.addEventListener('focus', () => {
        if (suggestions) searchBar.classList.add('active');
      });

      input.addEventListener('input', () => {
        const value = input.value.trim().toLowerCase();

        // Authors filtering server-side can listen for this and rewrite the
        // list themselves; the default below is a plain client-side match.
        RetroEvents.emit('search', { searchBar, input, value });

        if (!suggestions) return;

        let visible = 0;
        items.forEach((item) => {
          const match = !value || item.textContent.toLowerCase().includes(value);
          item.hidden = !match;
          if (match) visible += 1;
        });

        searchBar.classList.toggle('active', visible > 0);
      });
    });

    // One delegated listener rather than one per search bar: the previous
    // version added a document-level listener inside the loop, so a page with
    // ten search bars accumulated ten of them, none removable. It is still one
    // per init() without this guard, which is the same leak more slowly.
    if (!claimGlobal('searchBarDismiss')) return;
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.retro-search-bar.active').forEach((bar) => {
        if (!bar.contains(e.target)) bar.classList.remove('active');
      });
    });
  },
  
  // Initialize tag input components
  initTagInputs() {
    const tagInputs = document.querySelectorAll('.retro-tag-input');
    
    tagInputs.forEach(container => {
      if (!bindOnce(container, 'tagInput')) return;
      const tagsContainer = container.querySelector('.retro-tags');
      const input = container.querySelector('.retro-tag-text');
      
      if (!tagsContainer || !input) return;
      
      // Initialize tags array
      const tags = [];
      
      // Add existing tags to array
      tagsContainer.querySelectorAll('.retro-tag').forEach(tag => {
        const tagText = tag.textContent.replace('×', '').trim();
        tags.push(tagText);
        
        // Add event listener to remove button
        const removeBtn = tag.querySelector('.retro-tag-remove');
        if (removeBtn) {
          // Authored markup uses a <span>. It cannot be turned into a <button>
          // without replacing the node, so give it the role and a tab stop.
          if (removeBtn.tagName !== 'BUTTON') {
            removeBtn.setAttribute('role', 'button');
            if (!removeBtn.hasAttribute('tabindex')) removeBtn.tabIndex = 0;
            removeBtn.addEventListener('keydown', (e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                removeBtn.click();
              }
            });
          }
          if (!removeBtn.hasAttribute('aria-label')) {
            removeBtn.setAttribute('aria-label', `Remove ${tagText}`);
          }
          removeBtn.addEventListener('click', () => {
            // Remove from DOM
            tag.remove();
            // Remove from array
            const index = tags.indexOf(tagText);
            if (index > -1) {
              tags.splice(index, 1);
            }
          });
        }
      });
      
      // Function to add a new tag
      const addTag = (tagText) => {
        // Skip empty tags or duplicates
        if (!tagText || tags.includes(tagText)) {
          input.value = '';
          return;
        }
        
        // Add to array
        tags.push(tagText);
        
        // Create tag element
        const tag = document.createElement('span');
        tag.className = 'retro-tag';
        tag.textContent = tagText;
        
        // A real button: as a <span> this was unreachable by keyboard and
        // announced as nothing, so a tag could be added but never removed
        // without a mouse.
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'retro-tag-remove';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('aria-label', `Remove ${tagText}`);
        removeBtn.addEventListener('click', () => {
          // Remove from DOM
          tag.remove();
          // Remove from array
          const index = tags.indexOf(tagText);
          if (index > -1) {
            tags.splice(index, 1);
          }
        });
        
        // Append remove button to tag
        tag.appendChild(removeBtn);
        
        // Add tag to container
        tagsContainer.appendChild(tag);
        
        // Clear input
        input.value = '';
      };
      
      // Add tag on Enter key or comma
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
          const tagText = input.value.trim().replace(',', '');
          addTag(tagText);
        }
      });
      
      // Add tag on blur (when input loses focus)
      input.addEventListener('blur', () => {
        const tagText = input.value.trim();
        if (tagText) {
          addTag(tagText);
        }
      });
    });
  },
  
  // Initialize theme toggle button
  initThemeToggle() {
    const themeToggles = document.querySelectorAll('.retro-theme-toggle');
    
    themeToggles.forEach(toggle => {
      if (!bindOnce(toggle, 'themeToggle')) return;
      toggle.addEventListener('click', () => {
        // Toggle theme
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        
        // Apply theme
        this.applyTheme(this.theme);
        
        // Save preference. From here on this choice outranks the OS setting.
        storeTheme(this.theme);
        
        // Show toast notification
        RetroToast.show(`Theme switched to ${this.theme} mode!`, {
          type: this.theme === 'dark' ? 'primary' : 'light'
            });
          });
    });
  },
  
  /**
   * Follow the OS while the visitor has expressed no preference of their own.
   * Once the toggle has been used, that choice is stored and this stops
   * applying -- flipping the system theme must not silently undo a deliberate
   * choice.
   */
  initSystemThemeWatch() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    // One media-query listener for the page, not one per init().
    if (!claimGlobal('systemTheme')) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (storedTheme()) return;
      this.theme = e.matches ? 'dark' : 'light';
      this.applyTheme(this.theme);
      RetroEvents.emit('themechange', { theme: this.theme, source: 'system' });
    };
    // Safari below 14 has no addEventListener on MediaQueryList.
    if (query.addEventListener) query.addEventListener('change', onChange);
    else if (query.addListener) query.addListener(onChange);
  },

  /**
   * Apply theme to document.
   *
   * Light writes `data-theme="light"` rather than removing the attribute. The
   * stylesheet applies the dark palette under `prefers-color-scheme: dark` to
   * `:root:not([data-theme="light"])`, so on a dark OS the attribute is the
   * only thing that can hold a deliberate light choice in place -- removing it
   * would hand the visitor straight back to the system preference.
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  },

  /**
   * Interactive rating stars, on the ARIA radiogroup pattern.
   *
   * These were five <span>s wired to mouseenter/mouseleave/click: an input a
   * keyboard user could not reach, let alone set, with no role and no state to
   * announce. The markup is unchanged -- the roles, tabindex and key handling
   * are added here, so existing pages get the fix without editing their HTML.
   */
  initRatingStars() {
    document.querySelectorAll('.retro-rating').forEach((rating) => {
      // RetroCSS.init() is documented as a manual entry point, so this can be
      // called more than once. Rebinding would stack duplicate handlers.
      if (rating.dataset.retroRatingBound === 'true') return;
      rating.dataset.retroRatingBound = 'true';

      const stars = Array.from(rating.querySelectorAll('.retro-rating-star'));
      if (!stars.length) return;

      const max = stars.length;
      const readValue = () => parseInt(rating.getAttribute('data-rating'), 10) || 0;

      rating.setAttribute('role', 'radiogroup');
      if (!rating.hasAttribute('aria-label') && !rating.hasAttribute('aria-labelledby')) {
        rating.setAttribute('aria-label', `Rating out of ${max}`);
      }

      /**
       * Paint the stars and move the tab stop. Only one member of a radiogroup
       * is tabbable: Tab enters the group and leaves it, arrows move within.
       * With nothing selected the first star holds the stop so the group can
       * still be reached.
       */
      const render = (value, previewOnly) => {
        stars.forEach((star, i) => {
          star.classList.toggle('active', previewOnly !== undefined && i <= previewOnly);
          if (previewOnly === undefined) star.classList.remove('active');
          star.classList.toggle('selected', i < value);
          star.setAttribute('aria-checked', String(i === value - 1));
          star.tabIndex = i === (value > 0 ? value - 1 : 0) ? 0 : -1;
        });
      };

      const select = (index, focus) => {
        const value = index + 1;
        rating.setAttribute('data-rating', String(value));
        render(value);
        if (focus) stars[index].focus();
        rating.dispatchEvent(
          new CustomEvent('retro:rating', { detail: { rating: value, max }, bubbles: true }),
        );
      };

      stars.forEach((star, idx) => {
        star.setAttribute('role', 'radio');
        star.setAttribute('aria-label', `${idx + 1} of ${max}`);

        star.addEventListener('mouseenter', () => render(readValue(), idx));
        star.addEventListener('mouseleave', () => render(readValue()));
        star.addEventListener('click', () => select(idx));

        star.addEventListener('keydown', (e) => {
          // -1 when nothing is selected yet, so the first arrow press lands on 0.
          const current = readValue() - 1;
          const clamp = (n) => Math.max(0, Math.min(max - 1, n));
          let next;
          switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
              next = clamp(current + 1);
              break;
            case 'ArrowLeft':
            case 'ArrowUp':
              next = current < 0 ? 0 : clamp(current - 1);
              break;
            case 'Home':
              next = 0;
              break;
            case 'End':
              next = max - 1;
              break;
            case ' ':
            case 'Enter':
              next = idx;
              break;
            default:
              return;
          }
          // These keys would otherwise scroll the page or activate a parent.
          e.preventDefault();
          select(next, true);
        });
      });

      render(readValue());
    });
  }
};

// Expose RetroCSS to the global scope.
//
// The bundle is built WITHOUT esbuild's --global-name: that option emits an
// outer `var RetroCSS = <module namespace>`, which is itself a global and so
// overwrote the assignment below with `{ default: ... }`. Every documented
// call — RetroCSS.toast.show, RetroCSS.modal.show — was a TypeError as a
// result. The globals are declared here instead, explicitly.
// Guarded: this module is now published as ESM and CJS as well as an IIFE, and
// a bare `window.X = Y` at module scope throws ReferenceError the moment a
// server-rendered app (Next, Remix, Astro) imports the package. Everything
// below is browser-only setup and is skipped outside a browser.
if (typeof window !== 'undefined') {
  window.RetroCSS = RetroCSS;

  // Component singletons, for markup that calls them inline and for the API
  // the documentation describes.
  window.RetroModal = RetroModal;
  window.RetroToast = RetroToast;
  window.RetroForm = RetroForm;
  window.RetroTable = RetroTable;
  window.RetroDropdown = RetroDropdown;
  window.RetroFileUpload = RetroFileUpload;
  window.RetroEvents = RetroEvents;

  // Auto-initialize when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RetroCSS.init());
  } else {
    RetroCSS.init();
  }
}

export default RetroCSS;
