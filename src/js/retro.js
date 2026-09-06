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

function readStoredTheme() {
  try {
    return localStorage.getItem('retro-theme') || 'light';
  } catch (e) {
    return 'light';
  }
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
  
  // Add references to standalone modules from the window object
  carousel: window.RetroCarousel,
  accordion: window.RetroAccordion,
  tabs: window.RetroTabs,
  infiniteScroll: window.RetroInfiniteScroll,
  
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
      
      // Show/hide tooltip on hover
      trigger.addEventListener('mouseenter', () => {
        tooltip.classList.add('show');
      });
      
      trigger.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });
    });
  },
  
  // Initialize toast trigger elements
  initToastTriggers() {
    const toastTriggers = document.querySelectorAll('[data-retro-toast]');
    
    toastTriggers.forEach(trigger => {
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
    // ten search bars accumulated ten of them, none removable.
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
        
        // Create remove button
        const removeBtn = document.createElement('span');
        removeBtn.className = 'retro-tag-remove';
        removeBtn.textContent = '×';
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
      toggle.addEventListener('click', () => {
        // Toggle theme
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        
        // Apply theme
        this.applyTheme(this.theme);
        
        // Save preference
        localStorage.setItem('retro-theme', this.theme);
        
        // Show toast notification
        RetroToast.show(`Theme switched to ${this.theme} mode!`, {
          type: this.theme === 'dark' ? 'primary' : 'light'
            });
          });
    });
  },
  
  // Apply theme to document
  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  },

  // Interactive rating stars
  initRatingStars() {
    const ratings = document.querySelectorAll('.retro-rating');
    ratings.forEach(rating => {
      const stars = rating.querySelectorAll('.retro-rating-star');
      let selected = -1;
      // Restore previous rating if needed (optional: data-rating)
      if (rating.hasAttribute('data-rating')) {
        selected = parseInt(rating.getAttribute('data-rating')) - 1;
        stars.forEach((star, i) => {
          if (i <= selected) star.classList.add('selected');
        });
      }
      stars.forEach((star, idx) => {
        // Hover effect
        star.addEventListener('mouseenter', () => {
          stars.forEach((s, i) => {
            s.classList.toggle('active', i <= idx);
          });
        });
        star.addEventListener('mouseleave', () => {
          stars.forEach(s => s.classList.remove('active'));
        });
        // Click to select
        star.addEventListener('click', () => {
          selected = idx;
          stars.forEach((s, i) => {
            s.classList.toggle('selected', i <= idx);
          });
          // Store rating in data-rating
          rating.setAttribute('data-rating', idx + 1);
          // Optional: emit event
          rating.dispatchEvent(new CustomEvent('retro:rating', { detail: { rating: idx + 1 } }));
        });
      });
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
window.RetroCSS = RetroCSS;

// Component singletons, for markup that calls them inline and for the API the
// documentation describes.
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

export default RetroCSS;
