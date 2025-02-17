(function() {
  if (window.INDIGO_DARK_THEME_INITIALIZED) {
    console.log("dark-theme.js: script already initialized, skipping second run.");
    return;
  }
  window.INDIGO_DARK_THEME_INITIALIZED = true;
  // ========== END GUARD CHECK ===============

$(document).ready(function() {
    'use strict';

    const themeCookie = 'indigo-toggle-dark';

    function applyThemeOnPage(){
      const theme = $.cookie(themeCookie);
      {% if INDIGO_ENABLE_DARK_TOGGLE %}
      $('body').toggleClass("indigo-dark-theme", theme === 'dark');       // append or remove dark-class based on cookie-value
      // update expiry
      $.cookie(themeCookie, theme, { domain: window.location.hostname, expires: 90, path: '/' });
      {% endif %}
    }

    function setThemeToggleBtnState(){
      const theme = $.cookie(themeCookie);
      $("#toggle-switch-input").prop("checked", theme === 'dark');
    }
    
    function toggleTheme(){
      const themeValue = $.cookie(themeCookie) === 'dark' ? 'light' : 'dark';
      $.cookie(themeCookie, themeValue, { domain: window.location.hostname, expires: 90, path: '/' });
        
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
});
})();
