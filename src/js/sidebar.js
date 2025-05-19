// RetroCSS Sidebar Module
const RetroSidebar = {
  // Configuration
  config: {
    sidebarSelector: '.retro-sidebar',
    toggleSelector: '.retro-sidebar-toggle',
    overlaySelector: '.retro-sidebar-overlay',
    activeClass: 'active',
    mobileBreakpoint: 768,
    transitionDuration: 300, // ms
    bodyOpenClass: 'sidebar-open'
  },
  
  // State
  isOpen: false,
  
  // Initialize the sidebar
  init() {
    const sidebar = document.querySelector(this.config.sidebarSelector);
    if (!sidebar) return;

    // Add ARIA role for accessibility
    sidebar.setAttribute('role', 'navigation');
    sidebar.setAttribute('aria-label', 'Sidebar Navigation');
    
    // Setup sidebar links
    this.setupLinks(sidebar);
    
    // Setup mobile functionality
    this.setupMobile();
    
    // Setup scroll position tracking
    this.setupScrollTracking();
    
    // Setup window resize handling
    this.setupResizeHandler();
    
    // Set initial active state based on URL
    this.setActiveLink();
  },
  
  // Setup sidebar links
  setupLinks(sidebar) {
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
      // Make sure links have hover and focus states
      link.addEventListener('focus', () => {
        link.style.outline = '1px dotted var(--retro-primary)';
      });
      
      link.addEventListener('blur', () => {
        link.style.outline = '';
      });
      
      // Smooth scrolling for same-page links
      if (link.getAttribute('href')?.startsWith('#')) {
        link.addEventListener('click', (e) => {
          const targetId = link.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
            
            // Update URL without page jump
            history.pushState(null, '', targetId);
            
            // Update active state
            this.setActiveLink(link);
            
            // Close sidebar on mobile after clicking
            if (window.innerWidth < this.config.mobileBreakpoint) {
              this.closeSidebar();
            }
          }
        });
      }
    });
  },
  
  // Setup mobile functionality
  setupMobile() {
    // Create toggle button if it doesn't exist
    let toggleBtn = document.querySelector(this.config.toggleSelector);
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'retro-sidebar-toggle';
      toggleBtn.innerHTML = '<div class="retro-sidebar-toggle-icon"><span></span></div>';
      toggleBtn.setAttribute('aria-label', 'Toggle Sidebar');
      
      const sidebar = document.querySelector(this.config.sidebarSelector);
      if (sidebar && sidebar.parentNode) {
        sidebar.parentNode.insertBefore(toggleBtn, sidebar);
      }
    }
    
    // Create overlay if it doesn't exist
    let overlay = document.querySelector(this.config.overlaySelector);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'retro-sidebar-overlay';
      document.body.appendChild(overlay);
    }
    
    // Add event listeners
    toggleBtn.addEventListener('click', () => this.toggleSidebar());
    overlay.addEventListener('click', () => this.closeSidebar());
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeSidebar();
      }
    });
  },
  
  // Toggle the sidebar open/closed
  toggleSidebar() {
    const sidebar = document.querySelector(this.config.sidebarSelector);
    const overlay = document.querySelector(this.config.overlaySelector);
    
    if (!sidebar || !overlay) return;
    
    if (this.isOpen) {
      this.closeSidebar();
    } else {
      sidebar.classList.add(this.config.activeClass);
      overlay.classList.add(this.config.activeClass);
      document.body.classList.add(this.config.bodyOpenClass);
      this.isOpen = true;
    }
  },
  
  // Close the sidebar
  closeSidebar() {
    const sidebar = document.querySelector(this.config.sidebarSelector);
    const overlay = document.querySelector(this.config.overlaySelector);
    
    if (!sidebar || !overlay) return;
    
    sidebar.classList.remove(this.config.activeClass);
    overlay.classList.remove(this.config.activeClass);
    document.body.classList.remove(this.config.bodyOpenClass);
    this.isOpen = false;
  },
  
  // Setup scroll position tracking
  setupScrollTracking() {
    // Skip if no sidebar
    const sidebar = document.querySelector(this.config.sidebarSelector);
    if (!sidebar) return;
    
    // Track scroll position and update active link
    window.addEventListener('scroll', () => {
      this.updateActiveOnScroll();
    });
  },
  
  // Update active link based on scroll position
  updateActiveOnScroll() {
    const sections = document.querySelectorAll('section[id], div[id]');
    if (sections.length === 0) return;
    
    // Find the section that's most in view
    let currentSection = null;
    let maxVisiblePercentage = 0;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isVisible) {
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const visiblePercentage = visibleHeight / rect.height;
        
        if (visiblePercentage > maxVisiblePercentage) {
          maxVisiblePercentage = visiblePercentage;
          currentSection = section;
        }
      }
    });
    
    if (currentSection) {
      const id = currentSection.getAttribute('id');
      const link = document.querySelector(`.retro-sidebar a[href="#${id}"]`);
      if (link) {
        this.setActiveLink(link);
      }
    }
  },
  
  // Set active link
  setActiveLink(activeLink = null) {
    const sidebar = document.querySelector(this.config.sidebarSelector);
    if (!sidebar) return;
    
    // If no link provided, determine from URL hash
    if (!activeLink) {
      const hash = window.location.hash;
      if (hash) {
        activeLink = sidebar.querySelector(`a[href="${hash}"]`);
      } else {
        // If no hash, assume first link or link to current page
        const currentPath = window.location.pathname;
        activeLink = sidebar.querySelector(`a[href="${currentPath}"]`) || sidebar.querySelector('a');
      }
    }
    
    // Remove active class from all links
    sidebar.querySelectorAll('a').forEach(link => {
      link.classList.remove(this.config.activeClass);
    });
    
    // Add active class to the active link
    if (activeLink) {
      activeLink.classList.add(this.config.activeClass);
    }
  },
  
  // Setup resize handler
  setupResizeHandler() {
    window.addEventListener('resize', () => {
      // Close sidebar when resizing to desktop
      if (window.innerWidth >= this.config.mobileBreakpoint && this.isOpen) {
        this.closeSidebar();
      }
    });
  }
};

// Export for RetroCSS
window.RetroSidebar = RetroSidebar; 