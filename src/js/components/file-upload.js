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
      // No handler on the label: `<label for>` already opens the picker
      // natively. The old preventDefault()-then-input.click() pairing merely
      // re-implemented that, and is the classic way to get a double-open.
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
  },
};

export default RetroFileUpload; 