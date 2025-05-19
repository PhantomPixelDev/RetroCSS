/**
 * RetroCSS Modal Component
 * Provides modal dialog functionality with open/close actions
 */

// Modal System
const RetroModal = {
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
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.retro-modal.show');
        if (openModal) this.hide(openModal.id);
      }
    });
    console.log('Modal component initialized');
  },
  
  show(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
      console.log(`Modal ${modalId} opened`);
    } else {
      console.warn(`Modal with ID ${modalId} not found`);
    }
  },
  
  hide(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "";
      console.log(`Modal ${modalId} closed`);
    }
  },
};

export default RetroModal; 