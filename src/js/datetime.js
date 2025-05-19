// RetroCSS Date/Time Picker Demo
(function() {
  document.querySelectorAll('input[type="date"], input[type="time"]').forEach(function(input) {
    input.addEventListener('change', function() {
      if (window.RetroCSS && RetroCSS.toast) {
        RetroCSS.toast.show('Selected: ' + input.value, { type: 'info' });
      }
    });
  });
})(); 