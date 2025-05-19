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
      
      // Add dots based on slides count
      for (let i = 0; i < this.slides.length; i++) {
        const dot = document.createElement('div');
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
    
    // Add event listeners to dots
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.goTo(i);
      });
    });
    
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
    
    console.log("Carousel initialized:", this.slides.length, "slides");
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