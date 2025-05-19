/**
 * RetroCSS Tabs Implementation
 */
class RetroTabs {
  constructor(selector, options = {}) {
    this.tabContainer = document.querySelector(selector);
    if (!this.tabContainer) return;
    
    this.options = {
      contentSelector: options.contentSelector || '.retro-tab-content',
      activeClass: options.activeClass || 'active',
      defaultTab: options.defaultTab || 0,
      ...options
    };
    
    this.tabs = Array.from(this.tabContainer.querySelectorAll('.retro-nav-item'));
    this.contentElements = this.options.contentContainer ? 
      Array.from(document.querySelector(this.options.contentContainer).children) :
      Array.from(this.tabContainer.nextElementSibling.querySelectorAll(this.options.contentSelector));
    
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
        
        // Left/Right arrow keys to navigate between tabs
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          
          const direction = e.key === 'ArrowLeft' ? -1 : 1;
          let newIndex = index + direction;
          
          // Loop around if we're at the ends
          if (newIndex < 0) newIndex = this.tabs.length - 1;
          if (newIndex >= this.tabs.length) newIndex = 0;
          
          // Focus the new tab
          this.tabs[newIndex].focus();
        }
      });
    });
    
    // Activate default tab
    this.activateTab(this.options.defaultTab);
  }
  
  activateTab(index) {
    // Update tab active states
    this.tabs.forEach(tab => {
      tab.classList.remove(this.options.activeClass);
      tab.setAttribute('aria-selected', 'false');
    });
    this.tabs[index].classList.add(this.options.activeClass);
    this.tabs[index].setAttribute('aria-selected', 'true');
    
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
              content.textContent = `Content for ${tab.textContent}`;
              content.style.padding = '20px';
              content.style.border = '2px solid #000';
              content.style.borderTop = '0';
              content.style.background = '#fff';
            }
            wrapper.appendChild(content);
          });
          
          contentContainer = wrapper;
        }
      }
      
      new RetroTabs(nav, {
        contentContainer: '.retro-tab-pane',
        defaultTab: Array.from(nav.querySelectorAll('.retro-nav-item')).findIndex(tab => tab.classList.contains('active'))
      });
    });
    
    // Initialize underlined navigation
    const underlinedNavs = document.querySelectorAll('.retro-nav-underlined');
    underlinedNavs.forEach(nav => {
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
              content.textContent = `Content for ${tab.textContent}`;
              content.style.padding = '20px';
              content.style.marginTop = '10px';
              content.style.background = '#f5f5f5';
            }
            wrapper.appendChild(content);
          });
          
          contentContainer = wrapper;
        }
      }
      
      new RetroTabs(nav, {
        contentContainer: '.retro-tab-pane-underlined',
        defaultTab: Array.from(nav.querySelectorAll('.retro-nav-item')).findIndex(tab => tab.classList.contains('active'))
      });
    });
    
    // Initialize button group navigation
    const buttonNavs = document.querySelectorAll('.retro-nav-buttons');
    buttonNavs.forEach(nav => {
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
              content.textContent = `Content for ${tab.textContent}`;
              content.style.padding = '20px';
              content.style.marginTop = '10px';
              content.style.background = '#f5f5f5';
            }
            wrapper.appendChild(content);
          });
          
          contentContainer = wrapper;
        }
        
        new RetroTabs(nav, {
          contentContainer: '.retro-tab-pane-buttons',
          defaultTab: Array.from(nav.querySelectorAll('.retro-nav-item')).findIndex(tab => tab.classList.contains('active'))
        });
      }
    });
  }
};

/**
 * RetroCSS Accordion Implementation
 */
class RetroAccordion {
  constructor(selector) {
    const accordions = document.querySelectorAll(selector);
    
    accordions.forEach(accordion => {
      const toggles = accordion.querySelectorAll('.retro-accordion-toggle');
      
      toggles.forEach(toggle => {
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

    console.log("Accordion component initialized");
  }

  static init(selector = '.retro-accordion') {
    new RetroAccordion(selector);
    
    // Also add mutation observer to handle dynamically added accordions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && (
                node.matches(selector) || 
                node.querySelector(selector)
            )) {
              new RetroAccordion(selector);
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Expose to global window object for RetroCSS.init()
window.RetroTabs = RetroTabsInit; // The object with the .init() method that sets up tab instances
window.RetroAccordion = RetroAccordion; // The class itself, its static .init() will be called

// document.addEventListener('DOMContentLoaded', () => {
//   RetroTabsInit.init();
//   new RetroAccordion('.retro-accordion');
// }); 