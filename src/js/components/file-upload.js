/**
 * RetroCSS File Upload Component
 * Provides file upload functionality with UI feedback
 */

// File Upload
const RetroFileUpload = {
  init(root = document) {
    root.querySelectorAll(".retro-file-upload").forEach((upload) => {
      const input = upload.querySelector(".retro-file-input");
      const display = upload.querySelector(".retro-file-filename, .retro-file-display");
      const label = upload.querySelector(".retro-file-label");
      const drop = upload.querySelector(".retro-file-drop");
      if (!input || !display) return;
      // Show file name on change
      input.addEventListener("change", function() {
        if (this.files && this.files.length) {
          const fileNames = Array.from(this.files).map(f => f.name).join(", ");
          display.textContent = fileNames;
          upload.classList.add("has-files");
        } else {
          display.textContent = display.dataset.placeholder || "No file chosen";
          upload.classList.remove("has-files");
        }
      });
      // Clicking label or drop area triggers file input
      if (label) {
        label.addEventListener("click", e => {
          e.preventDefault();
          input.click();
        });
      }
      if (drop) {
        drop.addEventListener("click", e => {
          e.preventDefault();
          input.click();
        });
        // Drag and drop
        drop.addEventListener("dragover", e => {
          e.preventDefault();
          drop.classList.add("dragover");
        });
        drop.addEventListener("dragleave", () => {
          drop.classList.remove("dragover");
        });
        drop.addEventListener("drop", e => {
          e.preventDefault();
          drop.classList.remove("dragover");
          if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            const event = new Event("change", { bubbles: true });
            input.dispatchEvent(event);
          }
        });
      }
    });
    console.log('File uploads initialized:', root.querySelectorAll('.retro-file-upload').length);
  },
};

export default RetroFileUpload; 