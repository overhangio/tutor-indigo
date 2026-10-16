$(document).ready(function() {
    'use strict';

    const themeCookie = 'selected-paragon-theme-variant';

    function applyThemeOnPage(){
      let theme = $.cookie(themeCookie);

      // A missing cookie comes back as undefined, and writing that value
      // stores the string "undefined", which used to follow the OS dark setting.
      if (!theme || theme === 'undefined') {
        theme = 'light';
      }
      {% if INDIGO_ENABLE_DARK_TOGGLE %}
      $('body').toggleClass("indigo-dark-theme", theme === 'dark');
      $.cookie(themeCookie, theme, { domain: window.location.hostname, expires: 90, path: '/' });
      window.localStorage.setItem(themeCookie, theme);
      {% endif %}
      updateAccessibility();
    }

    function setThemeToggleBtnState(){
      const theme = $.cookie(themeCookie);
      $("#toggle-switch-input").prop("checked", theme === 'dark');
      updateAccessibility();
    }

    function updateAccessibility() {
      const theme = $.cookie(themeCookie);
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
      const themeValue = $.cookie(themeCookie) === 'dark' ? 'light' : 'dark';
      $.cookie(themeCookie, themeValue, { domain: window.location.hostname, expires: 90, path: '/' });
      window.localStorage.setItem(themeCookie, themeValue);
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
