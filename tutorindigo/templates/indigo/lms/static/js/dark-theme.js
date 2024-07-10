$(document).ready(function() {
    'use strict';

    const enableDarkTheme = {% if INDIGO_ENABLE_DARK_THEME %}true{% else %}false{% endif %};
    if (enableDarkTheme){
        $('body').addClass("indigo-dark-theme");
    }
});