/**
 * RetroCSS Form Component
 * Provides form validation functionality
 */

// Form Validation
import { bindOnce } from '../util/bind.js';

const RetroForm = {
  init(root = document) {
    root.querySelectorAll(".retro-form").forEach((form) => {
      // A repeat init() used to add another submit handler here and
      // another blur handler to all 34 fields on the demo page.
      if (!bindOnce(form, "formValidate")) return;
      form.addEventListener("submit", (e) => {
        if (!this.validate(form)) {
          e.preventDefault();
        }
      });
      form.querySelectorAll("input, textarea, select").forEach((field) => {
        field.addEventListener("blur", () => this.validateField(field));
      });
    });
  },
  validate(form) {
    let valid = true;
    form.querySelectorAll("input, textarea, select").forEach((field) => {
      if (!this.validateField(field)) valid = false;
    });
    return valid;
  },
  validateField(field) {
    const errorClass = "retro-form-error";
    let error = field.parentNode.querySelector("." + errorClass);
    if (error) error.remove();
    let valid = true;
    if (field.hasAttribute("required") && !field.value.trim()) {
      valid = false;
      this.showError(field, "This field is required");
    }
    if (
      field.type === "email" &&
      field.value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)
    ) {
      valid = false;
      this.showError(field, "Please enter a valid email");
    }
    field.classList.toggle("invalid", !valid);
    field.classList.toggle("valid", valid);
    return valid;
  },
  showError(field, message) {
    const error = document.createElement("div");
    error.className = "retro-form-error";
    error.textContent = message;
    field.parentNode.appendChild(error);
  },
};

export default RetroForm; 