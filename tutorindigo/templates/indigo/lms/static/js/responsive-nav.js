/**
 * Temporary fix for a legacy issue specific to the Tutor Indigo theme.
 * This can be removed once the upstream fix is included in Open edX.
 */

$(document).ready(function () {
  $(".course-tabs, .instructor-nav").each(function () {
    var $navList = $(this);

    // Skip if already initialized
    if ($navList.hasClass("responsive-nav-initialized")) {
      return;
    }
    $navList.addClass("responsive-nav responsive-nav-initialized");

    var moreButtonClass = $navList.hasClass("instructor-nav") ? "btn-link" : "";
    var moreListItemClass = $navList.hasClass("instructor-nav") ? "nav-item" : "tab";
    var menuType = $navList.hasClass("instructor-nav") ? "instructor-nav" : "course-tabs";

    // Create More dropdown
    var $more = $(
      '<li class="more '+ moreListItemClass +'" id="more">' +
        '<button class="more-button ' + moreButtonClass + '" type="button" aria-haspopup="true" aria-expanded="false" id="learn.course.' + menuType + '.navigation.overflow.menu">' +
        'More... <i class="fa fa-angle-down" aria-hidden="true"></i></button>' +
        '<ul class="more-menu more-responsive-menu" role="menu" aria-labelledby="learn.course.' + menuType + '.navigation.overflow.menu"></ul>' +
      '</li>'
    );
    $navList.append($more);
    var $moreBtn = $more.find(".more-button");
    var $moreMenu = $more.find(".more-menu");

    // Toggle dropdown
    $moreBtn.on("click", function () {
      var isOpen = $more.hasClass("open");
      $more.toggleClass("open");
      $moreBtn.attr("aria-expanded", !isOpen);
    });

    // Keyboard support
    $moreBtn.on("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        $moreBtn.click();
      } else if (e.key === "Escape") {
        $more.removeClass("open");
        $moreBtn.attr("aria-expanded", "false").focus();
      }
    });

    $moreMenu.on("keydown", function (e) {
      var $items = $moreMenu.find("[role='menuitem']");
      var index = $items.index(document.activeElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (index < $items.length - 1) $items.eq(index + 1).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (index > 0) $items.eq(index - 1).focus();
      } else if (e.key === "Escape") {
        $more.removeClass("open");
        $moreBtn.attr("aria-expanded", "false").focus();
      }
    });

    // Close on outside click
    $(document).on("click", function (e) {
      if (!$more.is(e.target) && $more.has(e.target).length === 0) {
        $more.removeClass("open");
        $moreBtn.attr("aria-expanded", "false");
      }
    });

    function updateNav() {
      $moreMenu.children("li").each(function () {
        $(this).insertBefore($more);
      });

      var navWidth = $navList.width();
      var usedWidth = $more.outerWidth(true);
      var $items = $navList.children("li").not($more);

      var hideItems = [];
      $items.each(function () {
        usedWidth += $(this).outerWidth(true);
        if (usedWidth > navWidth) {
          hideItems.push(this);
        }
      });

      if (hideItems.length > 0) {
        $(hideItems).each(function () {
          $(this).attr("role", "menuitem").attr("tabindex", "-1");
        }).appendTo($moreMenu);
        $more.show();
      } else {
        $more.hide().removeClass("open");
      }

      $moreBtn.attr("aria-expanded", "false");
    }

    // Store for reuse
    $navList.data("updateNav", updateNav);

    // Initial call
    updateNav();
  });

  // On resize, update all responsive navs
  $(window).on("resize", function () {
    $(".responsive-nav-initialized").each(function () {
      var update = $(this).data("updateNav");
      if (typeof update === "function") {
        update();
      }
    });
  });
});
