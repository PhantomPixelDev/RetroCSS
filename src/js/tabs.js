import { bindOnce } from './util/bind.js';

/**
 * RetroCSS Tabs Implementation
 */
class RetroTabs {
  constructor(target, options = {}) {
    // Accept an element or a selector. Every call site in this file passes an
    // element, which querySelector cannot take -- it stringifies to
    // "[object HTMLElement]" and throws.
    this.tabContainer = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.tabContainer) return;

    this.options = {
      contentSelector: options.contentSelector || '.retro-tab-content',
      activeClass: options.activeClass || 'active',
      ...options,
      // findIndex returns -1 when no tab carries .active, and `-1 || 0` is -1
      // because -1 is truthy -- which then indexes this.tabs[-1].
      defaultTab: Math.max(0, options.defaultTab ?? 0),
    };

    this.tabs = Array.from(this.tabContainer.querySelectorAll('.retro-nav-item'));

    // Resolve panes against this nav, not the document. Passing a class here
    // meant every tablist on the page bound to the first matching pane.
    let paneRoot = this.options.contentContainer;
    if (typeof paneRoot === 'string') paneRoot = document.querySelector(paneRoot);
    if (!paneRoot) paneRoot = this.tabContainer.nextElementSibling;
    if (!paneRoot) return;

    this.contentElements = Array.from(
      paneRoot.querySelectorAll(this.options.contentSelector),
    );
    if (!this.contentElements.length) {
      this.contentElements = Array.from(paneRoot.children);
    }
    if (!this.tabs.length || !this.contentElements.length) return;
    
    this.init();
  }
  
  init() {
    // Hide all content initially
    this.contentElements.forEach(content => {
      content.style.display = 'none';
    });
    
    // Set up click and keyboard handlers for tabs
    this.tabs.forEach((tab, index) => {
      // Click handler
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.activateTab(index);
      });
      
      // Keyboard handler for accessibility
      tab.addEventListener('keydown', (e) => {
        // Activate on Enter or Space
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.activateTab(index);
        }
        
        // Left/Right arrow keys to navigate between tabs, Home/End to jump.
        let newIndex = null;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const direction = e.key === 'ArrowLeft' ? -1 : 1;
          newIndex = index + direction;
          
          // Loop around if we're at the ends
          if (newIndex < 0) newIndex = this.tabs.length - 1;
          if (newIndex >= this.tabs.length) newIndex = 0;
        } else if (e.key === 'Home') {
          newIndex = 0;
        } else if (e.key === 'End') {
          newIndex = this.tabs.length - 1;
        }

        if (newIndex !== null) {
          e.preventDefault();
          // Move the tab stop with the focus, or Tab would land back on the
          // previously selected tab instead of leaving the tablist.
          this.setTabStop(newIndex);
          this.tabs[newIndex].focus();
        }
      });
    });
    
    // Activate default tab
    this.activateTab(this.options.defaultTab);
  }
  
  /**
   * Roving tabindex: exactly one tab is in the page tab order at a time.
   * Every tab used to be tabindex=0, so Tab walked through all of them one by
   * one instead of stepping over the tablist and into the panel -- twelve
   * stops on the demo page before the content.
   */
  setTabStop(index) {
    this.tabs.forEach((tab, i) => {
      tab.tabIndex = i === index ? 0 : -1;
    });
  }

  activateTab(index) {
    // Update tab active states
    this.tabs.forEach(tab => {
      tab.classList.remove(this.options.activeClass);
      tab.setAttribute('aria-selected', 'false');
    });
    this.tabs[index].classList.add(this.options.activeClass);
    this.tabs[index].setAttribute('aria-selected', 'true');
    this.setTabStop(index);
    
    // Fade out currently visible tab content first
    var visibleContent = null;
    for (var i = 0; i < this.contentElements.length; i++) {
      if (this.contentElements[i].style.display === 'block') {
        visibleContent = this.contentElements[i];
        break;
      }
    }
    
    // Hide all content elements
    this.contentElements.forEach((content) => {
      if (content !== this.contentElements[index]) {
        content.style.display = 'none';
      }
    });
    
    // Show selected content with a fade effect
    var selectedContent = this.contentElements[index];
    selectedContent.style.opacity = '0';
    selectedContent.style.display = 'block';
    
    // Force a reflow before changing opacity for the transition to work
    selectedContent.offsetHeight;
    
    // Fade in the selected content
    setTimeout(function() {
      selectedContent.style.opacity = '1';
    }, 10);
  }

  static init() {
    // No-op: present to satisfy RetroCSS.init() logging
  }
}

// Factory method for initializing tabs throughout the page
const RetroTabsInit = {
  init: function() {
    // Initialize tabbed navigation
    const tabbedNavs = document.querySelectorAll('.retro-nav-tabbed');
    tabbedNavs.forEach(nav => {
      if (!bindOnce(nav, 'tabsTabbed')) return;
      // Create content container if it doesn't exist
      let contentContainer = nav.nextElementSibling;
      if (!contentContainer || !contentContainer.classList.contains('retro-tab-pane')) {
        // Wrap existing content div in a tab-pane structure
        const existingContent = nav.nextElementSibling;
        if (existingContent) {
          const wrapper = document.createElement('div');
          wrapper.className = 'retro-tab-pane';
          nav.parentNode.insertBefore(wrapper, existingContent);
          
          // Create content for each tab
          const tabs = Array.from(nav.querySelectorAll('.retro-nav-item'));
          tabs.forEach((tab, i) => {
            const content = document.createElement('div');
            content.className = 'retro-tab-content';
            // For first tab, move existing content inside
            if (i === 0 && tabs[0].classList.contains('active')) {
              content.appendChild(existingContent);
            } else {
              // Left empty on purpose: the framework does not invent copy.
            }
            wrapper.appendChild(content);
          });
          
          contentContainer = wrapper;
        }
      }
      
      new RetroTabs(nav, {
        contentContainer,
        defaultTab: Array.from(nav.querySelectorAll('.retro-nav-item')).findIndex(tab => tab.classList.contains('active'))
      });
    });
    
    // Initialize underlined navigation
    const underlinedNavs = document.querySelectorAll('.retro-nav-underlined');
    underlinedNavs.forEach(nav => {
      if (!bindOnce(nav, 'tabsUnderlined')) return;
      // Create content container if it doesn't exist
      let contentContainer = nav.nextElementSibling;
      if (!contentContainer || !contentContainer.classList.contains('retro-tab-pane')) {
        // Wrap existing content div in a tab-pane structure
        const existingContent = nav.nextElementSibling;
        if (existingContent) {
          const wrapper = document.createElement('div');
          wrapper.className = 'retro-tab-pane retro-tab-pane-underlined';
          nav.parentNode.insertBefore(wrapper, existingContent);
          
          // Create content for each tab
          const tabs = Array.from(nav.querySelectorAll('.retro-nav-item'));
          tabs.forEach((tab, i) => {
            const content = document.createElement('div');
            content.className = 'retro-tab-content';
            // For first tab, move existing content inside
            if (i === 0 && tabs[0].classList.contains('active')) {
              content.appendChild(existingContent);
            } else {
              // Left empty on purpose: the framework does not invent copy.
              content.style.marginTop = '10px';
              content.style.background = '#f5f5f5';
            }
            wrapper.appendChild(content);
          });
          
          contentContainer = wrapper;
        }
      }
      
      new RetroTabs(nav, {
        contentContainer,
        defaultTab: Array.from(nav.querySelectorAll('.retro-nav-item')).findIndex(tab => tab.classList.contains('active'))
      });
    });
    
    // Initialize button group navigation
    const buttonNavs = document.querySelectorAll('.retro-nav-buttons');
    buttonNavs.forEach(nav => {
      if (!bindOnce(nav, 'tabsButtons')) return;
      // Only process if there's content after it (some are just examples without content)
      const nextEl = nav.nextElementSibling;
      if (nextEl && !nextEl.tagName.match(/^(H[1-6]|NAV)$/i)) {
        let contentContainer = nextEl;
        if (!contentContainer.classList.contains('retro-tab-pane')) {
          // Create tab pane structure
          const wrapper = document.createElement('div');
          wrapper.className = 'retro-tab-pane retro-tab-pane-buttons';
          nav.parentNode.insertBefore(wrapper, nextEl);
          
          // Create content for each tab
          const tabs = Array.from(nav.querySelectorAll('.retro-nav-item'));
          tabs.forEach((tab, i) => {
            const content = document.createElement('div');
            content.className = 'retro-tab-content';
            // For active tab, move existing content inside
            if ((i === 0 && tabs[0].classList.contains('active')) || 
                (tab.classList.contains('active'))) {
              content.appendChild(nextEl);
            } else {
              // Left empty on purpose: the framework does not invent copy.
              content.style.marginTop = '10px';
              content.style.background = '#f5f5f5';
            }
            wrapper.appendChild(content);
          });
          
          contentContainer = wrapper;
        }
        
        new RetroTabs(nav, {
          contentContainer,
          defaultTab: Array.from(nav.querySelectorAll('.retro-nav-item')).findIndex(tab => tab.classList.contains('active'))
        });
      }
    });
  }
};

/**
 * RetroCSS Accordion Implementation
 *
 * An object with init(), like every other module in the framework. It was a
 * class whose static init() was the only entry point anything actually used,
 * so `new RetroAccordion(sel)` was a second way to do the same thing in a
 * different shape.
 */
/**
 * Wire every accordion under `root`.
 *
 * @param {string} selector  accordion root selector
 * @param {ParentNode} [root=document]  subtree to search
 *
 * Binding is idempotent per toggle. It was not: the MutationObserver in init()
 * re-ran this against the whole document on every addition, so each new
 * accordion added another click listener to every toggle already on the page.
 * One addition made a click open *and* close an existing item; two made the
 * handlers flap odd/even. Same dataset guard as infinite-scroll.js.
 */
function bindAccordions(selector, root = document) {
  const accordions = root.querySelectorAll(selector);
    
    accordions.forEach(accordion => {
      const toggles = accordion.querySelectorAll('.retro-accordion-toggle');
      
      toggles.forEach(toggle => {
        if (toggle.dataset.retroAccordionBound === 'true') return;
        toggle.dataset.retroAccordionBound = 'true';

        toggle.addEventListener('click', () => {
          // Toggle active class
          const item = toggle.parentElement;
          const isActive = item.classList.contains('active');
          
          // Get content element
          const content = toggle.nextElementSibling;
          if (!content) return;
          
          // Update icon
          const icon = toggle.querySelector('.retro-accordion-icon');
          
          if (isActive) {
            // Close this item
            item.classList.remove('active');
            content.style.maxHeight = '0';
            if (icon) icon.textContent = '+';
          } else {
            // Close all other items in this accordion (optional)
            const siblings = accordion.querySelectorAll('.retro-accordion-item.active');
            siblings.forEach(sibling => {
              sibling.classList.remove('active');
              const siblingContent = sibling.querySelector('.retro-accordion-content');
              if (siblingContent) siblingContent.style.maxHeight = '0';
              const siblingIcon = sibling.querySelector('.retro-accordion-icon');
              if (siblingIcon) siblingIcon.textContent = '+';
            });
            
            // Open this item
            item.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
            if (icon) icon.textContent = '-';
          }
        });
      });
    });
  }

const RetroAccordion = {
  init(selector = '.retro-accordion') {
    bindAccordions(selector);
    
    // Also add mutation observer to handle dynamically added accordions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            // Scope to the node that was actually added. Passing `document`
            // here is what made every addition re-walk the whole page.
            if (node.matches(selector)) bindAccordions(selector, node.parentNode);
            else if (node.querySelector(selector)) bindAccordions(selector, node);
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
};

// Expose to global window object for RetroCSS.init()
if (typeof window !== 'undefined') {
  window.RetroTabs = RetroTabsInit; // The object with the .init() method that sets up tab instances
  window.RetroAccordion = RetroAccordion;
}

// document.addEventListener('DOMContentLoaded', () => {
//   RetroTabsInit.init();
//   new RetroAccordion('.retro-accordion');
// }); 