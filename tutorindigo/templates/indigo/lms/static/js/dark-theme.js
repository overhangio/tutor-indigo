$(document).ready(function() {
    'use strict';

    const themeVariant = 'selected-paragon-theme-variant';

    function applyThemeOnPage(){
      const theme = window.localStorage.getItem(themeVariant);
      {% if INDIGO_ENABLE_DARK_TOGGLE %}
      $('body').toggleClass("indigo-dark-theme", theme === 'dark');       // append or remove dark-class based on localStorage value
      {% endif %}
      updateAccessibility();
    }

    function setThemeToggleBtnState(){
      const theme = window.localStorage.getItem(themeVariant);
      $("#toggle-switch-input").prop("checked", theme === 'dark');
      updateAccessibility();
    }

    function updateAccessibility() {
      const theme = window.localStorage.getItem(themeVariant);
      const textWrapper = $('#theme-label');
      if (theme === 'dark') {
        textWrapper.text('Switch to Light Mode');
        textWrapper.attr('aria-checked', 'true');
      } else {
        textWrapper.text('Switch to Dark Mode');
        textWrapper.attr('aria-checked', 'false');
      }
    }
    
    function toggleTheme(){
      const themeValue = window.localStorage.getItem(themeVariant) === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(themeVariant, themeValue);
      applyThemeOnPage();
    }

    // Listener for updating the theme inside an iframe
    window.addEventListener("message", function(e){
      if (e.data && e.data["indigo-toggle-dark"]){
        applyThemeOnPage();
      }
    });

    applyThemeOnPage();  // loading theme on page load
    setThemeToggleBtnState(); // check/uncheck toggle btn based on theme

    $('#toggle-switch').on('change', toggleTheme);
    $('#toggle-switch-input').on('keydown', function (event) {
      if (event.key === "Enter") {
          toggleTheme();
      }
    });
});
