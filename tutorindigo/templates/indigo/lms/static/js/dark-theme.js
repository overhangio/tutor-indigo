$(document).ready(function() {
    'use strict';

    function checkIndigoTheme(){
        if($.cookie('indigo-theme-type') === 'dark'){
          $.cookie('indigo-theme-type', 'light', { domain: 'local.edly.io', expires: 7, path: '/' });
          $('body').removeClass("indigo-dark-theme");
        }else{
          $.cookie('indigo-theme-type', 'dark', { domain: 'local.edly.io', expires: 7, path: '/' });
          $('body').addClass("indigo-dark-theme");
        }
    }

    $('#toggle-theme').click(checkIndigoTheme);
});