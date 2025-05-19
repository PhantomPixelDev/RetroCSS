/**
 * RetroCSS Toast Component
 * Provides toast notification functionality
 */

// Toast Notifications
const RetroToast = {
  show(message, options = {}) {
    let container = document.getElementById("retro-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "retro-toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "retro-toast";
    if (options.type) {
      toast.classList.add(`retro-toast-${options.type}`);
    }
    if (options.html) {
      toast.classList.add('retro-toast-html');
      toast.innerHTML = message;
    } else {
      toast.textContent = message;
    }
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, options.duration || 3000);
  },
};

export default RetroToast; 