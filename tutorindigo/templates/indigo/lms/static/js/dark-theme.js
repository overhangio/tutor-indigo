$(document).ready(function() {
    'use strict';

    {% if INDIGO_THEME_COOKIE_NAME %}
    function loadTheme(){
      if($.cookie("{{ INDIGO_THEME_COOKIE_NAME }}") === 'dark'){
        $('body').addClass("indigo-dark-theme");
      }
    }
    
    function toggleTheme(){
      if($.cookie("{{ INDIGO_THEME_COOKIE_NAME }}") === 'dark'){
        $.cookie("{{ INDIGO_THEME_COOKIE_NAME }}", 'light', { domain: window.location.hostname, expires: 7, path: '/' });
        $('body').removeClass("indigo-dark-theme");
      } else {
        $.cookie("{{ INDIGO_THEME_COOKIE_NAME }}", 'dark', { domain: window.location.hostname, expires: 7, path: '/' });
        $('body').addClass("indigo-dark-theme");
      }
    }

    loadTheme();
    $('#toggle-theme').click(toggleTheme);
    {% endif %}
});