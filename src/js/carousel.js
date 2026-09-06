/**
 * RetroCSS Carousel/Slider Component
 * A simple carousel/slider implementation with retro styling
 */
(function() {
  function RetroCarousel(root) {
    this.root = root;
    this.track = root.querySelector('.retro-carousel-track');
    this.slides = Array.from(root.querySelectorAll('.retro-carousel-slide'));
    this.dots = Array.from(root.querySelectorAll('.retro-carousel-dot'));
    this.leftArrow = root.querySelector('.retro-carousel-arrow.left');
    this.rightArrow = root.querySelector('.retro-carousel-arrow.right');
    this.current = 0;
    this.slideWidth = 100; // percentage
    
    // If no slides, do nothing
    if (this.slides.length === 0) return;
    
    // Add dots if not present
    if (this.dots.length === 0 && this.slides.length > 1) {
      this.createDots();
    }
    
    this.init();
  }
  
  RetroCarousel.prototype.createDots = function() {
    const dotsContainer = this.root.querySelector('.retro-carousel-dots');
    
    // Create dots container if it doesn't exist
    if (!dotsContainer) {
      const newDotsContainer = document.createElement('div');
      newDotsContainer.className = 'retro-carousel-dots';
      this.root.appendChild(newDotsContainer);
      
      // Buttons, not divs. As <div> these were unreachable by keyboard and had
      // no accessible name -- three unlabelled dots a screen reader skipped.
      for (let i = 0; i < this.slides.length; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'retro-carousel-dot';
        dot.setAttribute('data-index', i);
        newDotsContainer.appendChild(dot);
      }
      
      // Update dots reference
      this.dots = Array.from(this.root.querySelectorAll('.retro-carousel-dot'));
    }

  };
  
  RetroCarousel.prototype.init = function() {
    // Add event listeners to arrows
    if (this.leftArrow) {
      this.leftArrow.addEventListener('click', () => {
        this.goTo(this.current - 1);
      });
    }
    
    if (this.rightArrow) {
      this.rightArrow.addEventListener('click', () => {
        this.goTo(this.current + 1);
      });
    }
    
    // Add event listeners to dots, and make them operable. createDots() only
    // runs when a page ships no dots of its own, so anything done there misses
    // every hand-authored carousel -- which is all of them on the demo pages.
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.goTo(i);
      });

      // A dot is a bare bullet with no text, so the name has to be supplied.
      if (!dot.hasAttribute('aria-label')) {
        dot.setAttribute('aria-label', `Go to slide ${i + 1} of ${this.slides.length}`);
      }
      // An authored <div> cannot become a <button> without replacing the node,
      // so give it the role and a tab stop instead.
      if (dot.tagName !== 'BUTTON') {
        if (!dot.hasAttribute('role')) dot.setAttribute('role', 'button');
        if (!dot.hasAttribute('tabindex')) dot.tabIndex = 0;
        dot.addEventListener('keydown', (e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            dot.click();
          }
        });
      }
    });
    
    // Arrow keys drive the carousel once focus is anywhere inside it.
    this.root.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // Leave real text inputs alone -- arrows move the caret there.
      if (e.target.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      this.goTo(this.current + (e.key === 'ArrowLeft' ? -1 : 1));
    });

    if (this.track && !this.track.hasAttribute('aria-live')) {
      // polite, not assertive: a slide change should not interrupt.
      this.track.setAttribute('aria-live', 'polite');
      this.track.setAttribute('aria-atomic', 'false');
    }
    if (!this.root.hasAttribute('role')) {
      this.root.setAttribute('role', 'group');
      if (!this.root.hasAttribute('aria-label')) {
        this.root.setAttribute('aria-label', 'Carousel');
      }
    }

    // Set initial state
    this.goTo(0);
    
    // Add swipe support for touch devices
    let startX, moveX;
    this.root.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    
    this.root.addEventListener('touchmove', (e) => {
      moveX = e.touches[0].clientX;
    }, { passive: true });
    
    this.root.addEventListener('touchend', () => {
      if (startX && moveX) {
        const diff = startX - moveX;
        if (Math.abs(diff) > 50) { // Minimum swipe distance
          if (diff > 0) {
            // Swipe left, go to next slide
            this.goTo(this.current + 1);
          } else {
            // Swipe right, go to previous slide
            this.goTo(this.current - 1);
          }
        }
      }
      startX = null;
      moveX = null;
    });
  };
  
  RetroCarousel.prototype.goTo = function(idx) {
    // Handle wrapping
    if (idx < 0) idx = this.slides.length - 1;
    if (idx >= this.slides.length) idx = 0;
    
    this.current = idx;
    
    // Update track position with smooth transition
    if (this.track) {
      const position = -this.slideWidth * idx;
      this.track.style.transform = `translateX(${position}%)`;
    }
    
    // Update active dot
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
      // aria-current is what conveys "this is the slide you are on"; the class
      // only conveys it visually.
      if (i === idx) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  // Static init method for RetroCSS.init()
  RetroCarousel.init = function() {
    document.querySelectorAll('.retro-carousel').forEach(function(root) {
      new RetroCarousel(root);
    });
  };

  // Expose to window
  window.RetroCarousel = RetroCarousel;
})(); 