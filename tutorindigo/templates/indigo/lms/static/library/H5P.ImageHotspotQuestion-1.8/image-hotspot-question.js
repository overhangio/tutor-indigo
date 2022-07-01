/*global H5P*/
H5P.ImageHotspotQuestion = (function ($, Question) {

  /**
   * Initialize module.
   *
   * @class H5P.ImageHotspotQuestion
   * @extends H5P.Question
   * @param {Object} params Behavior settings
   * @param {number} id Content identification
   * @param {Object} contentData Task specific content data
   */
  function ImageHotspotQuestion(params, id, contentData) {
    var self = this;

    var defaults = {
      imageHotspotQuestion: {
        backgroundImageSettings: {
          backgroundImage: {
            path: ''
          }
        },
        hotspotSettings: {
          hotspot: [],
          showFeedbackAsPopup: true,
          l10n: {
            retryText: 'Retry',
            closeText: 'Close'
          }
        }
      },
      behaviour: {
        enableRetry: true
      },
      scoreBarLabel: 'You got :num out of :total points',
      a11yRetry: 'Retry the task. Reset all responses and start the task over again.',
    };

    // Inheritance
    Question.call(self, 'image-hotspot-question');

    /**
     * Keeps track of content id.
     * @type {number}
     */
    this.contentId = id;

    /**
     * Keeps track of current score.
     * @type {number}
     */
    this.score = 0;

    /**
     * Keeps track of max score.
     * @type {number}
     */
    this.maxScore = 1;

    /**
     * Keeps track of parameters
     */
    this.params = $.extend(true, {}, defaults, params);

    /**
     * Easier access to image settings.
     * H5P semantics doesn't treat Arrays with one element as arrays with one element
     */
    this.imageSettings = this.params.imageHotspotQuestion.backgroundImageSettings;

    /**
     * Easier access to hotspot settings.
     */
    this.hotspotSettings = this.params.imageHotspotQuestion.hotspotSettings;

    /**
     * Hotspot feedback object. Contains hotspot feedback specific parameters.
     * @type {Object}
     */
    this.hotspotFeedback = {
      hotspotChosen: false
    };

    /**
     * Keeps track of all hotspots in an array.
     * @type {Array}
     */
    this.$hotspots = [];

    /**
     * Keeps track of the content data. Specifically the previous state.
     * @type {Object}
     */
    this.contentData = contentData;
    if (contentData !== undefined && contentData.previousState !== undefined) {
      this.previousState = contentData.previousState;
    }

    // Register resize listener with h5p
    this.on('resize', this.resize);
  }

  // Inheritance
  ImageHotspotQuestion.prototype = Object.create(Question.prototype);
  ImageHotspotQuestion.prototype.constructor = ImageHotspotQuestion;

  /**
   * Registers this question types DOM elements before they are attached.
   * Called from H5P.Question.
   */
  ImageHotspotQuestion.prototype.registerDomElements = function () {
    // Register task introduction text
    if (this.hotspotSettings.taskDescription) {
      this.setIntroduction(this.hotspotSettings.taskDescription);
    }

    // Register task content area
    this.setContent(this.createContent());

    // Register retry button
    this.createRetryButton();
  };

  /**
   * Create wrapper and main content for question.
   * @returns {H5P.jQuery} Wrapper
   */
  ImageHotspotQuestion.prototype.createContent = function () {
    var self = this;

    this.$wrapper = $('<div>', {
      'class': 'image-hotspot-question'
    });
    this.$wrapper.ready(function () {
      var imageHeight = self.$wrapper.width() * (self.imageSettings.height / self.imageSettings.width);
      self.$wrapper.css('height', imageHeight + 'px');
    });

    if (this.imageSettings && this.imageSettings.path) {
      this.$imageWrapper = $('<div>', {
        'class': 'image-wrapper'
      }).appendTo(this.$wrapper);

      // Image loader screen
      var $loader = $('<div>', {
        'class': 'image-loader'
      }).appendTo(this.$imageWrapper)
        .addClass('loading');

      this.$img = $('<img>', {
        'class': 'hotspot-image',
        'src': H5P.getPath(this.imageSettings.path, this.contentId)
      });

      // Resize image once loaded
      this.$img.on('load', function () {
        $loader.replaceWith(self.$img);
        self.trigger('resize');
      });

      this.attachHotspots();
      this.initImageClickListener();

    }
    else {
      const $message = $('<div>')
        .text('No background image was added!')
        .appendTo(this.$wrapper);
    }

    return this.$wrapper;
  };

  /**
   * Initiate image click listener to capture clicks outside of defined hotspots.
   */
  ImageHotspotQuestion.prototype.initImageClickListener = function () {
    var self = this;

    this.$imageWrapper.click(function (mouseEvent) {
      // Create new hotspot feedback
      self.createHotspotFeedback($(this), mouseEvent);
    });
  };

  /**
   * Attaches all hotspots.
   */
  ImageHotspotQuestion.prototype.attachHotspots = function () {
    var self = this;
    this.hotspotSettings.hotspot.forEach(function (hotspot) {
      self.attachHotspot(hotspot);
    });

  };

  /**
   * Attach single hotspot.
   * @param {Object} hotspot Hotspot parameters
   */
  ImageHotspotQuestion.prototype.attachHotspot = function (hotspot) {
    var self = this;
    var $hotspot = $('<div>', {
      'class': 'image-hotspot ' + hotspot.computedSettings.figure
    }).css({
      left: hotspot.computedSettings.x + '%',
      top: hotspot.computedSettings.y + '%',
      width: hotspot.computedSettings.width + '%',
      height: hotspot.computedSettings.height + '%'
    }).click(function (mouseEvent) {

      // Create new hotspot feedback
      self.createHotspotFeedback($(this), mouseEvent, hotspot);

      // Do not propagate
      return false;


    }).appendTo(this.$imageWrapper);

    this.$hotspots.push($hotspot);
  };

  /**
   * Create a feedback element for a click.
   * @param {H5P.jQuery} $clickedElement The element that was clicked, a hotspot or the image wrapper.
   * @param {Object} mouseEvent Mouse event containing mouse offsets within clicked element.
   * @param {Object} hotspot Hotspot parameters.
   */
  ImageHotspotQuestion.prototype.createHotspotFeedback = function ($clickedElement, mouseEvent, hotspot) {
    // Do not create new hotspot if one exists
    if (this.hotspotFeedback.hotspotChosen) {
      return;
    }

    this.hotspotFeedback.$element = $('<div>', {
      'class': 'hotspot-feedback'
    }).appendTo(this.$imageWrapper);

    this.hotspotFeedback.hotspotChosen = true;

    // Center hotspot feedback on mouse click with fallback for firefox
    var feedbackPosX = (mouseEvent.offsetX || mouseEvent.pageX - $(mouseEvent.target).offset().left);
    var feedbackPosY = (mouseEvent.offsetY || mouseEvent.pageY - $(mouseEvent.target).offset().top);

    // Apply clicked element offset if click was not in wrapper
    if (!$clickedElement.hasClass('image-wrapper')) {
      feedbackPosX += $clickedElement.position().left;
      feedbackPosY += $clickedElement.position().top;
    }

    // Keep position and pixel offsets for resizing
    this.hotspotFeedback.percentagePosX = feedbackPosX / (this.$imageWrapper.width() / 100);
    this.hotspotFeedback.percentagePosY = feedbackPosY / (this.$imageWrapper.height() / 100);
    this.hotspotFeedback.pixelOffsetX = (this.hotspotFeedback.$element.width() / 2);
    this.hotspotFeedback.pixelOffsetY = (this.hotspotFeedback.$element.height() / 2);

    // Position feedback
    this.resizeHotspotFeedback();

    // Style correct answers
    if (hotspot && hotspot.userSettings.correct) {
      this.hotspotFeedback.$element.addClass('correct');
      this.finishQuestion();
    } else {
      // Wrong answer, show retry button
      if (this.params.behaviour.enableRetry) {
        this.showButton('retry-button');
      }
    }

    var feedbackText = (hotspot && hotspot.userSettings.feedbackText ? hotspot.userSettings.feedbackText : this.params.imageHotspotQuestion.hotspotSettings.noneSelectedFeedback);
    if (!feedbackText) {
      feedbackText = '&nbsp;';
    }

    // Send these settings into setFeedback to turn feedback into a popup.
    var popupSettings = {
      showAsPopup: this.params.imageHotspotQuestion.hotspotSettings.showFeedbackAsPopup,
      closeText: this.params.imageHotspotQuestion.hotspotSettings.l10n.closeText,
      click: this.hotspotFeedback
    };

    this.setFeedback(feedbackText, this.score, this.maxScore, this.params.scoreBarLabel, undefined, popupSettings);

    // Finally add fade in animation to hotspot feedback
    this.hotspotFeedback.$element.addClass('fade-in');

    // Trigger xAPI completed event
    this.triggerXAPIScored(this.getScore(), this.getMaxScore(), 'answered');
  };

  /**
   * Create retry button and add it to button bar.
   */
  ImageHotspotQuestion.prototype.createRetryButton = function () {
    var self = this;

    this.addButton('retry-button', this.params.imageHotspotQuestion.hotspotSettings.l10n.retryText, function () {
      self.resetTask();
    }, false, {
      'aria-label': this.params.a11yRetry,
    });
  };

  /**
   * Finish question and remove retry button.
   */
  ImageHotspotQuestion.prototype.finishQuestion = function () {
    this.score = 1;
    // Remove button
    this.hideButton('retry-button');
  };

  /**
   * Checks if an answer for this question has been given.
   * Used in contracts.
   * @returns {boolean}
   */
  ImageHotspotQuestion.prototype.getAnswerGiven = function () {
    return this.hotspotFeedback.hotspotChosen;
  };

  /**
   * Gets the current user score for this question.
   * Used in contracts
   * @returns {number}
   */
  ImageHotspotQuestion.prototype.getScore = function () {
    return this.score;
  };

  /**
   * Gets the max score for this question.
   * Used in contracts.
   * @returns {number}
   */
  ImageHotspotQuestion.prototype.getMaxScore = function () {
    return this.maxScore;
  };

  /**
   * Display the first found solution for this question.
   * Used in contracts
   */
  ImageHotspotQuestion.prototype.showSolutions = function () {
    var self = this;
    var foundSolution = false;

    this.hotspotSettings.hotspot.forEach(function (hotspot, index) {
      if (hotspot.userSettings.correct && !foundSolution) {
        var $correctHotspot = self.$hotspots[index];
        self.createHotspotFeedback($correctHotspot, {offsetX: ($correctHotspot.width() / 2), offsetY: ($correctHotspot.height() / 2)}, hotspot);
        foundSolution = true;
      }
    });
  };

  /**
   * Resets the question.
   * Used in contracts.
   */
  ImageHotspotQuestion.prototype.resetTask = function () {
    // Remove hotspot feedback
    if (this.hotspotFeedback.$element) {
      this.hotspotFeedback.$element.remove();
    }
    this.hotspotFeedback.hotspotChosen = false;

    // Hide retry button
    this.hideButton('retry-button');

    // Clear feedback
    this.removeFeedback();
  };

  /**
   * Resize image and wrapper
   */
  ImageHotspotQuestion.prototype.resize = function () {
    this.resizeImage();
    this.resizeHotspotFeedback();
  };

  /**
   * Resize image to fit parent width.
   */
  ImageHotspotQuestion.prototype.resizeImage = function () {
    var self = this;

    // Check that question has been attached
    if (!(this.$wrapper && this.$img)) {
      return;
    }

    // Resize image to fit new container width.
    var parentWidth = this.$wrapper.width();
    this.$img.width(parentWidth);

    // Find required height for new width.
    var naturalWidth = this.$img.get(0).naturalWidth;
    var naturalHeight = this.$img.get(0).naturalHeight;
    var imageRatio = naturalHeight / naturalWidth;
    var neededHeight = -1;
    if (parentWidth < naturalWidth) {
      // Scale image down
      neededHeight = parentWidth * imageRatio;
    } else {
      // Scale image to natural size
      this.$img.width(naturalWidth);
      neededHeight = naturalHeight;
    }

    if (neededHeight !== -1) {
      this.$img.height(neededHeight);

      // Resize wrapper to match image.
      self.$wrapper.height(neededHeight);
    }
  };

  /**
   * Re-position hotspot feedback.
   */
  ImageHotspotQuestion.prototype.resizeHotspotFeedback = function () {
    // Check that hotspot is chosen
    if (!this.hotspotFeedback.hotspotChosen) {
      return;
    }

    // Calculate positions
    var posX = (this.hotspotFeedback.percentagePosX * (this.$imageWrapper.width() / 100)) - this.hotspotFeedback.pixelOffsetX;
    var posY = (this.hotspotFeedback.percentagePosY * (this.$imageWrapper.height() / 100)) - this.hotspotFeedback.pixelOffsetY;

    // Apply new positions
    this.hotspotFeedback.$element.css({
      left: posX,
      top: posY
    });
  };

  return ImageHotspotQuestion;
}(H5P.jQuery, H5P.Question));
