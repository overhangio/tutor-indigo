$(document).ready(function() {
    'use strict';

    {% if INDIGO_THEME_COOKIE_NAME %}
    function applyThemeOnPage(){
      const theme = $.cookie("{{ INDIGO_THEME_COOKIE_NAME }}");
      $('body').toggleClass("indigo-dark-theme", theme === 'dark');
    }

    function setThemeToggleBtnState(){
      const theme = $.cookie("{{ INDIGO_THEME_COOKIE_NAME }}");
      $("#toggle-switch-input").prop("checked", theme === 'dark');
    }
    
    function toggleTheme(){
      const themeValue = $.cookie("{{ INDIGO_THEME_COOKIE_NAME }}") === 'dark' ? 'light' : 'dark';
      $.cookie("{{ INDIGO_THEME_COOKIE_NAME }}", themeValue, { domain: window.location.hostname, expires: 7, path: '/' });
        
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
    {% endif %}
});