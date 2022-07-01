var H5P = H5P || {};

H5P.TwitterUserFeed = (function ($) {

  /**
   * Constructor function.
   */
  function C(options, id) {
    H5P.EventDispatcher.call(this);

    // Extend defaults with provided options
    this.options = $.extend(true, {}, {
      userName: 'H5PTechnology',
      showReplies: false,
      numTweets: 5
    }, options);
    // Keep provided id.
    this.id = id;
  }

  // Inheritance
  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    var self = this;
    this.setUpTwitter();

    // notify that twitter feed has been loaded
    twttr.ready(function (twttr) {
        twttr.events.bind('loaded', function () {
          self.trigger('loaded');
          // trigger resize event once twitter feed has been loaded
          self.trigger('resize');
        });
      }
    );

    // Set class on container to identify twitter user feed
    $container.addClass("h5p-twitter-user-feed");

    $container.append(
      '<a class="twitter-timeline" href="https://twitter.com/twitterapi"' +
      'data-widget-id="558756407995273216" data-screen-name="' + this.options.userName +
      '" data-show-replies="' + this.options.showReplies +
      '" data-tweet-limit="' + this.options.numTweets + '">Tweets by @' +
      this.options.userName + '</a>');

    if (window.twttr !== undefined && window.twttr.widgets !== undefined) {
      window.twttr.widgets.load($container.get(0));
    }
  };

  C.prototype.setUpTwitter = function() {
    if (window.twttr) {
      return; // Already set up
    }

    // Load widgets api if not already done
    var id = 'twitter-wjs';
    if (!document.getElementById(id)) {
      // Create script tag
      var js = document.createElement('script');
      js.id = id;
      js.src = "https://platform.twitter.com/widgets.js";

      // Insert before first head JS
      var firstJS = document.getElementsByTagName('script')[0];
      firstJS.parentNode.insertBefore(js, firstJS);
    }

    // Create twttr object used by script
    window.twttr = {
      _e: [],
      ready: function (callback) {
        window.twttr._e.push(callback);
      }
    };
  };

  return C;
})(H5P.jQuery);
