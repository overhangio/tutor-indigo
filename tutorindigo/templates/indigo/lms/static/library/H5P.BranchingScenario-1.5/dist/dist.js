/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
__webpack_require__(2);
__webpack_require__(3);
__webpack_require__(6);
module.exports = __webpack_require__(7);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

H5P = H5P || {};

H5P.BranchingScenario = function (params, contentId) {
  var self = this;

  H5P.EventDispatcher.call(self);
  self.contentId = contentId;
  self.startScreen = {};
  self.libraryScreen = {};
  self.endScreens = {};
  self.navigating;
  self.currentHeight;
  self.currentId = -1;
  self.xAPIDataCollector = [];
  self.userPath = [];
  self.backwardsAllowedFlags = [];
  self.proceedButtonInProgress = false;
  self.isReverseTransition = false;

  /**
   * Extend an array just like JQuery's extend.
   * @param {...Object} arguments - Objects to be merged.
   * @return {Object} Merged objects.
   */
  var extend = function extend() {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          if (_typeof(arguments[0][key]) === 'object' && _typeof(arguments[i][key]) === 'object') {
            extend(arguments[0][key], arguments[i][key]);
          } else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  };

  params = extend({
    content: [],
    startScreen: {
      startScreenTitle: "",
      startScreenSubtitle: ""
    },
    endScreens: [{
      endScreenTitle: "",
      endScreenSubtitle: "",
      contentId: -1
    }],
    scoringOptionGroup: {
      scoringOption: 'no-score'
    },
    l10n: {},
    behaviour: 'individual'
  }, params.branchingScenario); // Account for the wrapper!

  // Set default localization
  params.l10n = extend({
    startScreenButtonText: "Start the course",
    endScreenButtonText: "Restart the course",
    proceedButtonText: "Proceed",
    scoreText: "Your score:",
    backButtonText: "Back",
    fullscreenAria: "Fullscreen",
    replayButtonText: "Replay the video",
    disableProceedButtonText: "Require to complete the current module"
  }, params.l10n);

  // Sanitize the (next)ContentIds that the editor didn't set
  params.content.forEach(function (item, index) {
    item.contentId = index;
    if (item.nextContentId === undefined) {
      item.nextContentId = -1;
    }
  });

  // Compute pattern for enabling/disabling back button
  self.backwardsAllowedFlags = params.content.map(function (content) {
    if (content.contentBehaviour === 'useBehavioural') {
      return params.behaviour.enableBackwardsNavigation;
    }
    return content.contentBehaviour === 'enabled' ? true : false;
  });

  self.params = params;
  self.scoring = new H5P.BranchingScenario.Scoring(params);

  /**
   * Create a start screen object
   *
   * @param  {Object} startscreendata Object containing data needed to build a start screen
   * @param  {string} startscreendata.startScreenTitle Title
   * @param  {string} startscreendata.startScreenSubtitle Subtitle
   * @param  {Object} startscreendata.startScreenImage Object containing image metadata
   * @param  {String} startscreendata.startScreenAltText Alt text for image
   * @param  {boolean} isCurrentScreen When Branching Scenario is first initialized
   * @return {H5P.BranchingScenario.GenericScreen} Generic Screen object
   */
  var createStartScreen = function createStartScreen(_ref, isCurrentScreen) {
    var startScreenTitle = _ref.startScreenTitle,
        startScreenSubtitle = _ref.startScreenSubtitle,
        startScreenImage = _ref.startScreenImage,
        startScreenAltText = _ref.startScreenAltText;

    var startScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: true,
      titleText: startScreenTitle,
      subtitleText: startScreenSubtitle,
      image: startScreenImage,
      altText: startScreenAltText,
      fullscreenAria: params.l10n.fullscreenAria,
      buttonText: params.l10n.startScreenButtonText,
      isCurrentScreen: isCurrentScreen
    });

    startScreen.on('toggleFullScreen', function () {
      self.toggleFullScreen();
    });

    return startScreen;
  };

  /**
   * Create an end screen object
   *
   * @param  {Object} endScreenData Object containing data needed to build an end screen
   * @param  {string} endScreenData.endScreenTitle Title
   * @param  {string} endScreenData.endScreenSubtitle Subtitle
   * @param  {Object} endScreenData.endScreenImage Object containing image metadata
   * @param  {Object} endScreenData.endScreenScore Score
   * @param  {Object} endScreenData.showScore Determines if score is shown
   * @return {H5P.BranchingScenario.GenericScreen} Generic Screen object
   */
  var createEndScreen = function createEndScreen(endScreenData) {
    var endScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: false,
      titleText: endScreenData.endScreenTitle,
      subtitleText: endScreenData.endScreenSubtitle,
      image: endScreenData.endScreenImage,
      buttonText: params.l10n.endScreenButtonText,
      fullscreenAria: params.l10n.fullscreenAria,
      isCurrentScreen: false,
      scoreText: params.l10n.scoreText,
      score: self.scoring.getScore(endScreenData.endScreenScore),
      maxScore: self.scoring.getMaxScore(),
      showScore: self.scoring.shouldShowScore()
    });

    endScreen.on('toggleFullScreen', function () {
      self.toggleFullScreen();
    });

    return endScreen;
  };

  /**
   * Get library data by id from branching scenario parameters
   *
   * @param  {number} id Id of the content type
   * @return {Object | boolean} Data required to create a library
   */
  self.getLibrary = function (id) {
    return params.content[id] !== undefined ? params.content[id] : false;
  };

  /**
   * Handle exitfullscreen event and resize the BS screen
   */
  self.on('exitFullScreen', function () {
    setTimeout(function () {
      self.trigger('resize');
    }, 100);
  });

  /**
   * Handle the start of the branching scenario
   */
  self.on('started', function () {
    var startNode = this.params.content[0];

    // Disable back button if not allowed
    if (self.canEnableBackButton(0) === false) {
      self.disableBackButton();
    } else {
      self.enableBackButton();
    }

    if (startNode && startNode.type && startNode.type.library && startNode.type.library.split(' ')[0] === 'H5P.BranchingQuestion') {
      // First node is Branching Question, no sliding, just trigger BQ overlay
      self.trigger('navigated', {
        nextContentId: 0
      });
    } else {
      // First node is info content
      self.startScreen.hide();
      self.libraryScreen.show();
      self.triggerXAPI('progressed');
      self.userPath.push(0);
    }
    self.currentId = 0;
  });

  /**
   * Handle progression
   */
  self.on('navigated', function (e) {
    // Trace back user steps
    if (e.data.reverse) {
      // Reset library screen wrapper if it was set to fit large BQ
      if (self.libraryScreen && self.libraryScreen.wrapper) {
        self.libraryScreen.wrapper.style.height = '';
      }

      self.userPath.pop();
      e.data.nextContentId = self.userPath.pop() || 0;
    }

    var id = parseInt(e.data.nextContentId);

    // Keep track of user steps
    self.userPath.push(id);

    // Remove Back button from BQ overlay
    if (self.currentId > -1 && H5P.BranchingScenario.LibraryScreen.isBranching(self.getLibrary(self.currentId)) && self.$container.find('.h5p-back-button[isBQ="true"]').length) {
      self.$container.find('.h5p-back-button[isBQ="true"]').remove();
    }

    var nextLibrary = self.getLibrary(id);
    var resizeScreen = true;

    if (!self.libraryScreen) {
      self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.startScreen.startScreenTitle, nextLibrary);

      self.libraryScreen.on('toggleFullScreen', function () {
        self.toggleFullScreen();
      });

      self.$container.append(self.libraryScreen.getElement());
      self.currentId = id;
    } else {
      // Try to stop any playback
      self.libraryScreen.stopPlayback(self.currentId);

      // Try to collect xAPIData for last screen
      if (!this.params.preventXAPI) {
        var xAPIData = self.libraryScreen.getXAPIData(self.currentId);
        // We do not include branching questions that hasn't been answered in the report (going back from a BQ)
        var isBranching = H5P.BranchingScenario.LibraryScreen.isBranching(self.getLibrary(self.currentId));
        var isBranchingQuestionAndAnswered = isBranching && xAPIData.statement && xAPIData.statement.result && xAPIData.statement.result.response !== undefined;

        if (xAPIData && (!isBranching || isBranchingQuestionAndAnswered)) {
          self.xAPIDataCollector.push(xAPIData);
        }
      }
    }

    // Re-display library screen if it has been hidden by an ending screen
    if (self.currentEndScreen && self.currentEndScreen.isShowing) {
      if (nextLibrary) {
        if (!H5P.BranchingScenario.LibraryScreen.isBranching(nextLibrary)) {
          self.currentEndScreen.hide();
          self.currentEndScreen = null;
          self.libraryScreen.show();
        }
      } else {
        // Showing two end screens after each other
        self.libraryScreen.hideFeedbackDialogs();
        self.currentEndScreen.hide();
        self.currentEndScreen = null;
      }
    } else if (self.startScreen && self.startScreen.isShowing && nextLibrary) {
      if (!H5P.BranchingScenario.LibraryScreen.isBranching(nextLibrary)) {
        self.startScreen.hide();
        self.libraryScreen.show();
        resizeScreen = false;
      }
    } else {
      // Remove any feedback dialogs
      self.libraryScreen.hideFeedbackDialogs();
    }

    if (resizeScreen) {
      self.trigger('resize');
    }
    if (self.currentId !== -1) {
      self.triggerXAPI('progressed');

      var contentScores = {};

      if (self.libraryScreen.currentLibraryInstance && self.libraryScreen.currentLibraryInstance.getScore) {
        contentScores = {
          "score": self.libraryScreen.currentLibraryInstance.getScore(),
          "maxScore": self.libraryScreen.currentLibraryInstance.getMaxScore()
        };
      }

      self.scoring.addLibraryScore(this.currentId, this.libraryScreen.currentLibraryId, e.data.chosenAlternative, contentScores);
    }

    if (nextLibrary === false) {
      //  Show the relevant end screen if there is no next library
      self.currentEndScreen = self.endScreens[id];
      // Custom end screen
      if (e.data.feedback) {
        var endScreen = createEndScreen({
          endScreenTitle: e.data.feedback.title || '',
          endScreenSubtitle: e.data.feedback.subtitle || '',
          endScreenImage: e.data.feedback.image,
          endScreenScore: e.data.feedback.endScreenScore
        });
        self.$container.append(endScreen.getElement());
        self.currentEndScreen = endScreen;
      } else if (self.scoring.isDynamicScoring()) {
        self.currentEndScreen.setScore(self.getScore());
        self.currentEndScreen.setMaxScore(self.getMaxScore());
      }

      self.startScreen.hide();
      self.libraryScreen.hide(true);
      self.currentEndScreen.show();
      self.triggerXAPICompleted(self.scoring.getScore(self.currentEndScreen.getScore()), self.scoring.getMaxScore());
    } else {
      self.libraryScreen.showNextLibrary(nextLibrary, e.data.reverse);

      // Disable back button if not allowed in new library screen
      if (self.canEnableBackButton(id) === false) {
        self.disableBackButton();
      } else {
        self.enableBackButton();
      }
      self.currentId = id;
    }

    // First node was BQ, so sliding from start screen to library screen is needed now
    if (e.data.nextContentId !== 0 && document.querySelector('.h5p-start-screen').classList.contains('h5p-current-screen')) {
      // Remove translation of info content which would tamper with timing of sliding
      var wrapper = self.libraryScreen.wrapper.querySelector('.h5p-slide-in');
      if (wrapper) {
        wrapper.classList.remove('h5p-next');
        self.startScreen.hide();
        self.libraryScreen.show();
      }
    }
  });

  /**
   * Handle restarting
   */
  self.on('restarted', function () {
    if (self.currentEndScreen) {
      self.currentEndScreen.hide();
      self.currentEndScreen = null;
    }
    self.scoring.restart();
    self.xAPIDataCollector = [];
    self.startScreen.screenWrapper.style.height = "";
    self.startScreen.screenWrapper.classList.remove('h5p-slide-out');

    self.startScreen.show(self.isReverseTransition);
    self.isReverseTransition = false;
    self.currentId = -1;
    self.userPath = [];

    // Reset the library screen
    if (self.libraryScreen) {
      self.libraryScreen.remove();
    }
    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.startScreen.startScreenTitle, self.getLibrary(0));

    self.libraryScreen.on('toggleFullScreen', function () {
      self.toggleFullScreen();
    });

    self.$container.append(self.libraryScreen.getElement());
  });

  /**
   * Handle resizing, resizes child library
   */
  self.on('resize', function (event) {
    if (self.bubblingUpwards) {
      return; // Prevent sending the event back down
    }
    self.changeLayoutToFitWidth();
    if (self.libraryScreen && _typeof(self.libraryScreen) === 'object' && Object.keys(self.libraryScreen).length !== 0) {
      self.libraryScreen.resize(event);
    }

    // Add classname for phone size adjustments
    var rect = self.$container[0].getBoundingClientRect();
    if (rect.width <= 480) {
      self.$container.addClass('h5p-phone-size');
    } else {
      self.$container.removeClass('h5p-phone-size');
    }
    if (rect.width < 768) {
      self.$container.addClass('h5p-medium-tablet-size');
    } else {
      self.$container.removeClass('h5p-medium-tablet-size');
    }
  });

  /**
   * Toggle full screen
   */
  self.toggleFullScreen = function () {
    if (self.isFullScreen()) {
      // Exit fullscreen
      if (H5P.exitFullScreen) {
        H5P.exitFullScreen();
      }
    } else {
      H5P.fullScreen(self.$container, this);
    }
  };

  /**
   * Returns true if we're in full screen or semi full screen.
   *
   * @returns {boolean}
   */
  self.isFullScreen = function () {
    return H5P.isFullscreen || self.$container && self.$container[0].classList.contains('h5p-fullscreen') || self.$container && self.$container[0].classList.contains('h5p-semi-fullscreen');
  };

  /**
   * Disable proceed button.
   */
  self.disableNavButton = function () {
    if (!self.libraryScreen.navButton) {
      return;
    }
    self.libraryScreen.navButton.classList.add('h5p-disabled');
    self.libraryScreen.navButton.setAttribute('disabled', true);
    self.libraryScreen.navButton.setAttribute('title', params.l10n.disableProceedButtonText);
  };

  /**
   * Enable proceed button.
   */
  self.enableNavButton = function () {
    var animated = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (!self.libraryScreen.navButton) {
      return;
    }
    self.libraryScreen.navButton.classList.remove('h5p-disabled');
    self.libraryScreen.navButton.removeAttribute('disabled');
    self.libraryScreen.navButton.removeAttribute('title');

    //Animate button if require
    if (animated) {
      self.animateNavButton();
    }
  };

  /**
   * Hide proceed button.
   */
  self.hideNavButton = function () {
    if (!self.libraryScreen.navButton) {
      return;
    }
    self.libraryScreen.navButton.classList.add('h5p-hidden');
  };

  /**
   * Show proceed button.
   * @param {boolean} [animated=false] If true, will be animated.
   */
  self.showNavButton = function () {
    var animated = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (!self.libraryScreen.navButton) {
      return;
    }

    self.libraryScreen.navButton.classList.remove('h5p-hidden');
    document.activeElement.blur();

    var focusTime = 100;

    if (animated) {
      self.animateNavButton();
    }

    setTimeout(function () {
      self.libraryScreen.navButton.focus();
    }, focusTime);
  };

  /**
   * Animate proceed button.
   */
  self.animateNavButton = function () {
    // Prevent multiple animation calls
    if (!self.libraryScreen.navButton.classList.contains('h5p-animate')) {
      self.libraryScreen.navButton.classList.add('h5p-animate');
    }
  };

  /**
   * Stop animation of proceed button.
   */
  self.unanimateNavButton = function () {
    self.libraryScreen.navButton.classList.remove('h5p-animate');
  };

  /**
   * Get accumulative score for all attempted scenarios
   *
   * @returns {number} Current score for Branching Scenario
   */
  self.getScore = function () {
    return self.scoring.getScore();
  };

  /**
   * Get max score
   *
   * @returns {number} Max score for branching scenario
   */
  self.getMaxScore = function () {
    return self.scoring.getMaxScore();
  };

  /**
   * Change the width of the branching question depending on the container changeLayoutToFitWidth
   * @return {undefined} undefined
   */
  self.changeLayoutToFitWidth = function () {
    var fontSize = parseInt(window.getComputedStyle(document.getElementsByTagName('body')[0]).fontSize, 10);
    // Wide screen
    if (this.$container.width() / fontSize > 43) {
      self.$container[0].classList.add('h5p-wide-screen');
    } else {
      self.$container[0].classList.add('h5p-mobile-screen');
    }
  };

  /**
   * Disable back button.
   */
  self.disableBackButton = function () {
    if (!self.libraryScreen || !self.libraryScreen.backButton) {
      return;
    }
    self.libraryScreen.backButton.classList.add('h5p-disabled');
    self.libraryScreen.backButton.setAttribute('disabled', true);
  };

  /**
   * Enable back button.
   */
  self.enableBackButton = function () {
    if (!self.libraryScreen || !self.libraryScreen.backButton) {
      return;
    }
    self.libraryScreen.backButton.classList.remove('h5p-disabled');
    self.libraryScreen.backButton.removeAttribute('disabled');
  };

  /**
   * Get user path.
   * @return {object[]} User path.
   */
  self.getUserPath = function () {
    return self.userPath;
  };

  /**
   * Check if a node is allowed to have the back button enabled.
   * @param {number} id Id of node to check.
   * @return {boolean} True if node is allowed to have the back button enabled, else false.
   */
  self.canEnableBackButton = function (id) {
    if (typeof id !== 'number') {
      return false;
    }

    if (id < 0 || id > self.backwardsAllowedFlags.length - 1) {
      return false;
    }

    return self.backwardsAllowedFlags[id];
  };

  /**
   * Attach Branching Scenario to the H5P container
   *
   * @param  {HTMLElement} $container Container for the content type
   * @return {undefined} undefined
   */
  self.attach = function ($container) {
    if (this.isRoot !== undefined && this.isRoot()) {
      this.setActivityStarted();
    }

    self.$container = $container;
    $container.addClass('h5p-branching-scenario').html('');

    if (!params.content || params.content.length === 0) {
      var contentMessage = document.createElement('div');
      contentMessage.innerHTML = 'No content';
      self.$container.append(contentMessage);
      return;
    }

    self.startScreen = createStartScreen(params.startScreen, true);
    self.$container.append(self.startScreen.getElement());
    self.currentId = -1;

    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.startScreen.startScreenTitle, self.getLibrary(0));
    self.libraryScreen.on('toggleFullScreen', function () {
      self.toggleFullScreen();
    });
    self.$container.append(self.libraryScreen.getElement());

    params.endScreens.forEach(function (endScreen) {
      self.endScreens[endScreen.contentId] = createEndScreen(endScreen);
      self.$container.append(self.endScreens[endScreen.contentId].getElement());
    });
  };

  /**
   * Get xAPI data.
   * Contract used by report rendering engine.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  self.getXAPIData = function () {
    if (!self.currentEndScreen) {
      console.error('Called getXAPIData before finished.');
      return;
    }

    var xAPIEvent = self.createXAPIEventTemplate('answered');

    // Extend definition
    var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    H5P.jQuery.extend(definition, {
      interactionType: 'compound',
      type: 'http://adlnet.gov/expapi/activities/cmi.interaction'
    });
    definition.extensions = {
      'https://h5p.org/x-api/no-question-score': 1
    };

    var score = self.scoring.getScore(self.currentEndScreen.getScore());
    var maxScore = self.scoring.getMaxScore();
    xAPIEvent.setScoredResult(score, maxScore, this, true, score === maxScore);

    return {
      statement: xAPIEvent.data.statement,
      children: self.xAPIDataCollector
    };
  };
};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


H5P.BranchingScenario.GenericScreen = function () {

  /**
   * GenericScreen constructor
   *
   * @param {BranchingScenario} parent BranchingScenario Object
   * @param {Object} screenData Object containing data required to construct the screen
   * @param {boolean} screenData.isStartScreen Determines if it is a starting screen
   * @param {string}  screenData.titleText Title
   * @param {string}  screenData.subtitleText Subtitle
   * @param {string}  screenData.scoreText Score text
   * @param {Object}  screenData.image Image object
   * @param {String}  screenData.altText Alternative text for image
   * @param {string}  screenData.buttonText Text for the button
   * @param {boolean} screenData.isCurrentScreen Determines if the screen is shown immediately
   * @param {number} screenData.score Score that should be displayed
   * @param {number} screenData.maxScore Max achievable score
   * @param {number} screenData.showScore Determines if score should be displayed
   *
   * @return {GenericScreen} A screen object
   */
  function GenericScreen(parent, screenData) {
    var _this = this;

    H5P.EventDispatcher.call(this);

    var self = this;
    self.parent = parent;
    self.isShowing = screenData.isStartScreen;
    self.isFeedbackAvailable = false;
    self.screenWrapper = document.createElement('div');
    self.screenWrapper.classList.add(screenData.isStartScreen ? 'h5p-start-screen' : 'h5p-end-screen');
    self.screenWrapper.classList.add(screenData.isCurrentScreen ? 'h5p-current-screen' : 'h5p-next-screen');
    if (!screenData.isCurrentScreen) {
      this.screenWrapper.classList.add('h5p-branching-hidden');
    } else {
      self.parent.currentHeight = '45em';
    }

    var contentDiv = document.createElement('div');
    contentDiv.classList.add('h5p-branching-scenario-screen-content');

    var feedbackText = document.createElement('div');
    feedbackText.classList.add('h5p-feedback-content-content');
    contentDiv.appendChild(feedbackText);
    self.feedbackText = feedbackText;

    var title = document.createElement('h1');
    title.className = 'h5p-branching-scenario-title-text';
    title.innerHTML = screenData.titleText;

    var subtitle = document.createElement('div');
    subtitle.className = 'h5p-branching-scenario-subtitle-text';
    subtitle.innerHTML = screenData.subtitleText;

    var navButton = document.createElement('button');
    navButton.classList.add(screenData.isStartScreen ? 'h5p-start-button' : 'h5p-end-button');
    navButton.classList.add('transition');

    navButton.onclick = function () {
      screenData.isStartScreen ? self.parent.trigger('started') : self.parent.trigger('restarted');
      var startScreen = document.getElementsByClassName('h5p-start-screen')[0];
      // Resize start screen when user restart the course
      if (!screenData.isStartScreen) {
        startScreen.style.height = '';
      }
      self.parent.navigating = true;
    };

    self.navButton = navButton;

    var buttonTextNode = document.createTextNode(screenData.buttonText);
    navButton.appendChild(buttonTextNode);

    feedbackText.appendChild(title);
    feedbackText.appendChild(subtitle);
    contentDiv.appendChild(navButton);

    if (screenData.showScore && screenData.score !== undefined) {
      self.scoreWrapper = this.createResultContainer(screenData.scoreText, screenData.score, screenData.maxScore);
      contentDiv.insertBefore(self.scoreWrapper, contentDiv.firstChild);
    }

    if (H5P.canHasFullScreen) {
      var fullScreenButton = document.createElement('button');
      fullScreenButton.className = 'h5p-branching-full-screen';
      fullScreenButton.setAttribute('aria-label', this.parent.params.l10n.fullscreenAria);
      fullScreenButton.addEventListener('click', function () {
        _this.trigger('toggleFullScreen');
      });
      self.screenWrapper.appendChild(fullScreenButton);
    }

    self.screenWrapper.appendChild(self.createScreenBackground(screenData.isStartScreen, screenData.image, screenData.altText));
    self.screenWrapper.appendChild(contentDiv);

    // Validate any of the contents are present, make screen reader to read
    if (screenData.showScore && screenData.score !== undefined || screenData.titleText !== "" || screenData.subtitleText !== "") {
      feedbackText.tabIndex = -1;
      self.isFeedbackAvailable = true;
    }

    /**
     * Get score for screen
     *
     * @return score
     */
    self.getScore = function () {
      return screenData.score;
    };

    self.getMaxScore = function () {
      return screenData.maxScore;
    };

    /**
     * Used to check if on the final screen to prepare the course to restart
     */
    self.checkIntroReset = function () {
      var startScreen = document.getElementsByClassName('h5p-start-screen')[0];
      var finalScreenReachedClasses = ['h5p-end-screen', 'h5p-current-screen'];
      if (finalScreenReachedClasses.every(function (i) {
        return self.screenWrapper.classList.contains(i);
      })) {
        startScreen.classList.add('h5p-reset-start');
      } else if (startScreen.classList.contains('h5p-reset-start')) {
        startScreen.classList.remove('h5p-reset-start');
      }
    };
  }

  /**
   * Returns the wrapping div
   *
   * @return {HTMLElement} Wrapper
   */
  GenericScreen.prototype.getElement = function () {
    return this.screenWrapper;
  };

  /**
   * Set score for screen
   *
   * @param score
   */
  GenericScreen.prototype.setScore = function (score) {
    if (this.scoreValue && score !== undefined) {
      this.scoreValue.textContent = score.toString();
    }
  };

  /**
   * Set max score for screen
   *
   * @param maxScore
   */
  GenericScreen.prototype.setMaxScore = function (maxScore) {
    if (maxScore !== undefined) {
      this.maxScoreValue.textContent = maxScore.toString();
    }
  };

  /**
   * Creates a wrapper containing the score. Not in use!
   *
   * @param  {string} scoreLabel Score label
   * @param  {number} score Score to be shown
   * @param  {number} [maxScore] Max achievable score
   * @return {HTMLElement} Result container
   */
  GenericScreen.prototype.createResultContainer = function (scoreLabel, score, maxScore) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-result-wrapper');

    var resultContainer = document.createElement('div');
    resultContainer.classList.add('h5p-result-container');

    var scoreText = document.createElement('div');
    scoreText.classList.add('h5p-score-text');
    scoreText.appendChild(document.createTextNode(scoreLabel));

    var scoreCircle = document.createElement('div');
    scoreCircle.classList.add('h5p-score-circle');

    var achievedScore = document.createElement('span');
    achievedScore.className = 'h5p-score-value';
    this.scoreValue = document.createTextNode(score.toString());
    achievedScore.appendChild(this.scoreValue);

    scoreCircle.appendChild(achievedScore);

    var scoreDelimiter = document.createElement('span');
    scoreDelimiter.className = 'h5p-score-delimiter';
    scoreDelimiter.textContent = '/';
    scoreCircle.appendChild(scoreDelimiter);

    var maxAchievableScore = document.createElement('span');
    maxAchievableScore.className = 'h5p-max-score';

    this.maxScoreValue = document.createTextNode(maxScore.toString());
    maxAchievableScore.appendChild(this.maxScoreValue);
    scoreCircle.appendChild(maxAchievableScore);

    resultContainer.appendChild(scoreText);
    resultContainer.appendChild(scoreCircle);
    wrapper.appendChild(resultContainer);
    return wrapper;
  };

  /**
   * Creates the background for the screen
   *
   * @param  {boolean} isStartScreen Determines if the screen is a starting screen
   * @param  {Object} image Image object
   * @param  {String} altText Alternative text for image
   * @return {HTMLElement} Wrapping div for the background
   */
  GenericScreen.prototype.createScreenBackground = function (isStartScreen, image, altText) {
    var _this2 = this;

    var backgroundWrapper = document.createElement('div');
    backgroundWrapper.classList.add('h5p-screen-background');

    var backgroundBanner = document.createElement('div');
    backgroundBanner.classList.add('h5p-screen-banner');

    var backgroundImage = document.createElement('img');
    backgroundImage.classList.add('h5p-background-image');

    if (image && image.path) {
      backgroundImage.tabIndex = 0;
      backgroundImage.src = H5P.getPath(image.path, this.parent.contentId);
    } else {
      backgroundImage.src = isStartScreen ? this.parent.getLibraryFilePath('assets/start-screen-default.jpg') : this.parent.getLibraryFilePath('assets/end-screen-default.jpg');
    }

    if (altText && altText.length) {
      backgroundImage.setAttribute('aria-label', altText);
    }

    backgroundImage.addEventListener('load', function () {
      _this2.parent.trigger('resize');
    });

    backgroundWrapper.appendChild(backgroundBanner);
    backgroundWrapper.appendChild(backgroundImage);

    return backgroundWrapper;
  };

  /**
   * Slides the screen in and styles it as the current screen
   *
   * @param {boolean} slideBack True if sliding back to screen
   * @return {undefined}
   */
  GenericScreen.prototype.show = function () {
    var slideBack = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var self = this;
    self.isShowing = true;
    if (slideBack) {
      self.screenWrapper.classList.add('h5p-previous');
    }
    self.screenWrapper.classList.add('h5p-slide-in');
    self.screenWrapper.classList.remove('h5p-branching-hidden');

    // Style as the current screen
    self.screenWrapper.addEventListener('animationend', function (event) {
      if (event.animationName === 'slide-in') {
        if (slideBack) {
          self.screenWrapper.classList.remove('h5p-previous');
        }
        self.screenWrapper.classList.remove('h5p-next-screen');
        self.screenWrapper.classList.remove('h5p-slide-in');
        self.screenWrapper.classList.add('h5p-current-screen');
        self.parent.trigger('resize');

        if (!self.isFeedbackAvailable) {
          self.navButton.focus();
        } else {
          self.feedbackText.focus();
        }
        self.checkIntroReset();
      }
    });
  };

  /**
   * Slides the screen out and styles it to be hidden
   * @return {undefined}
   */
  GenericScreen.prototype.hide = function () {
    var self = this;
    self.isShowing = false;
    self.screenWrapper.classList.add('h5p-slide-out');

    // Style as hidden
    self.screenWrapper.addEventListener('animationend', function (event) {
      if (event.animationName === 'slide-out') {
        self.screenWrapper.classList.add('h5p-branching-hidden');
        self.screenWrapper.classList.remove('h5p-current-screen');
        self.screenWrapper.classList.add('h5p-next-screen');
        self.screenWrapper.classList.remove('h5p-slide-out');
      }
    });
  };

  return GenericScreen;
}();

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _detectResize = __webpack_require__(4);

H5P.BranchingScenario.LibraryScreen = function () {

  /**
   * LibraryScreen
   *
   * @param  {BranchingScenario} parent BranchingScenario object
   * @param  {string} courseTitle Title
   * @param  {Object} library H5P Library Data
   * @return {LibraryScreen} A screen oject
   */
  function LibraryScreen(parent, courseTitle, library) {
    var _this = this;

    var self = this;
    H5P.EventDispatcher.call(this);

    this.parent = parent;
    this.currentLibraryElement;
    this.currentLibraryInstance;
    this.currentLibraryId = 0;
    this.nextLibraryId = library.nextContentId;
    this.libraryFeedback = library.feedback;
    this.nextLibraries = {};
    this.libraryInstances = {};
    this.libraryFinishingRequirements = [];
    this.libraryTitle;
    this.branchingQuestions = [];
    this.navButton;
    this.header;
    this.shouldAutoplay = [];
    this.isShowing = false;
    this.contentOverlays = [];

    var contentTitle = library.type && library.type.metadata && library.type.metadata.title ? library.type.metadata.title : '';
    this.wrapper = this.createWrapper(courseTitle, contentTitle ? contentTitle : 'Untitled Content', library.showContentTitle && contentTitle);
    this.wrapper.classList.add('h5p-next-screen');
    this.wrapper.classList.add('h5p-branching-hidden');

    var libraryWrapper = this.createLibraryElement(library, false);
    this.currentLibraryWrapper = libraryWrapper;
    this.currentLibraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
    this.currentLibraryInstance = this.libraryInstances[0]; // TODO: Decide whether the start screen id should be hardcoded as 0

    this.createNextLibraries(library);

    this.wrapper.appendChild(libraryWrapper);

    /**
     * Disable or enable tab indexes hidden behind overlay.
     * Currently only targets the endscreen as the IV deals with the other elements.
     * TODO: Since endscreen isn't always shown it should also target all the elements.
     */
    self.toggleIVTabIndexes = function (index) {
      var self = this.currentLibraryInstance;
      var selector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]';

      var $tabbables = self.$container[0].querySelectorAll(selector);

      if (!$tabbables) {
        return;
      }

      for (var i = 0; i < $tabbables.length; i++) {
        if (index === "-1") {
          var elementTabIndex = $tabbables[i].getAttribute('tabindex');
          $tabbables[i].dataset.tabindex = elementTabIndex;
          $tabbables[i].setAttribute('tabindex', index);
        } else {
          var tabindex = $tabbables[i].dataset.tabindex;
          if ($tabbables[i].classList.contains("ui-slider-handle")) {
            $tabbables[i].setAttribute('tabindex', 0);
            $tabbables[i].dataset.tabindex = '';
          } else if (tabindex !== undefined) {
            $tabbables[i].setAttribute('tabindex', index);
            $tabbables[i].dataset.tabindex = '';
          } else {
            $tabbables[i].setAttribute('tabindex', index);
          }
        }
      }
    };

    self.triggerAutoplay = function (e) {
      var id = e.data !== undefined && e.data.nextContentId !== undefined ? e.data.nextContentId : 0;
      if (id < 0 || id !== self.currentLibraryId) {
        return; // All of the stars did not align, skip autoplay
      }

      var library = parent.getLibrary(id);
      if (library.type.library.split(' ')[0] === 'H5P.BranchingQuestion') {
        return;
      }

      if (self.shouldAutoplay[self.currentLibraryId]) {
        if (self.currentLibraryInstance.play !== undefined) {
          self.currentLibraryInstance.play();
        } else if (self.currentLibraryInstance.elementInstances) {
          for (var i = 0; i < self.currentLibraryInstance.elementInstances[0].length; i++) {
            var elementInstance = self.currentLibraryInstance.elementInstances[0][i];
            if (elementInstance.play !== undefined) {
              elementInstance.play();
            }
          }
        }
      }
    };

    /**
     * Handle enterfullscreen event and resize the library instance
     */
    parent.on('enterFullScreen', function () {
      setTimeout(function () {
        if (_this.currentLibraryInstance) {
          _this.currentLibraryInstance.trigger('resize');
        }
      }, 500);
    });

    parent.on('started', self.triggerAutoplay);
    parent.on('navigated', self.triggerAutoplay);
  }

  /**
   * Resize wrapper to fit library
   */
  LibraryScreen.prototype.handleLibraryResize = function () {
    // Fullscreen always use the full height available to it
    if (this.parent.isFullScreen()) {
      this.currentLibraryWrapper.style.height = '';
      this.wrapper.style.minHeight = '';
      return;
    }

    this.currentLibraryWrapper.style.height = this.currentLibraryElement.clientHeight + 40 + 'px';
    // NOTE: This is a brittle hardcoding of the header height
    this.wrapper.style.minHeight = this.currentLibraryElement.clientHeight + 40 + 70.17 + 'px';
  };

  /**
   * Creates a wrapping div for the library screen
   *
   * @param  {string} courseTitle Main title
   * @param  {string} libraryTitle Library specific title
   * @return {HTMLElement} Wrapping div
   */
  LibraryScreen.prototype.createWrapper = function (courseTitle, libraryTitle, showLibraryTitle) {
    var _this2 = this;

    var self = this;
    var parent = this.parent;
    var wrapper = document.createElement('div');

    var titleDiv = document.createElement('div');
    titleDiv.classList.add('h5p-title-wrapper');

    if (H5P.canHasFullScreen) {
      var fullScreenButton = document.createElement('button');
      fullScreenButton.className = 'h5p-branching-full-screen';
      fullScreenButton.setAttribute('aria-label', this.parent.params.l10n.fullscreenAria);
      fullScreenButton.addEventListener('click', function () {
        _this2.trigger('toggleFullScreen');
      });
      titleDiv.appendChild(fullScreenButton);
    }

    var headers = document.createElement('div');
    headers.className = 'h5p-branching-header';

    var headerTitle = document.createElement('h1');
    headerTitle.innerHTML = courseTitle;
    headers.appendChild(headerTitle);

    var headerSubtitle = document.createElement('h2');
    headerSubtitle.classList.add('library-subtitle');
    headerSubtitle.innerHTML = showLibraryTitle ? libraryTitle : '&nbsp;';
    headerSubtitle.setAttribute('tabindex', '-1');
    headerSubtitle.setAttribute('aria-label', libraryTitle);
    headers.appendChild(headerSubtitle);

    titleDiv.appendChild(headers);

    this.libraryTitle = headerSubtitle;

    var buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('h5p-nav-button-wrapper');

    // Append back button if at least one node has it enabled
    if (parent.backwardsAllowedFlags.indexOf(true) !== -1) {
      this.backButton = this.createBackButton(parent.params.l10n.backButtonText);
      buttonWrapper.appendChild(this.backButton);
    }

    // Proceed button
    var navButton = document.createElement('button');
    navButton.classList.add('transition');

    navButton.onclick = function () {
      // Stop impatient users from breaking the view
      if (parent.navigating === false) {
        var hasFeedbackTitle = self.libraryFeedback.title && self.libraryFeedback.title.trim();
        var hasFeedbackSubtitle = self.libraryFeedback.subtitle && self.libraryFeedback.subtitle.trim();

        var hasFeedback = !!(hasFeedbackTitle || hasFeedbackSubtitle || self.libraryFeedback.image);

        if (hasFeedback && self.nextLibraryId !== -1) {
          // Add an overlay if it doesn't exist yet
          if (self.overlay === undefined) {
            self.overlay = document.createElement('div');
            self.overlay.className = 'h5p-branching-scenario-overlay';
            self.wrapper.appendChild(self.overlay);
            self.hideBackgroundFromReadspeaker();
          }

          var branchingQuestion = document.createElement('div');
          branchingQuestion.classList.add('h5p-branching-question-wrapper');
          branchingQuestion.classList.add('h5p-branching-scenario-feedback-dialog');

          var questionContainer = document.createElement('div');
          questionContainer.classList.add('h5p-branching-question-container');

          branchingQuestion.appendChild(questionContainer);

          var feedbackScreen = self.createFeedbackScreen(self.libraryFeedback, self.nextLibraryId);
          questionContainer.appendChild(feedbackScreen);

          questionContainer.classList.add('h5p-start-outside');
          questionContainer.classList.add('h5p-fly-in');
          self.currentLibraryWrapper.style.zIndex = 0;
          self.wrapper.appendChild(branchingQuestion);
          feedbackScreen.focus();
        } else {
          var nextScreen = {
            nextContentId: self.nextLibraryId
          };

          if (!!(hasFeedback || self.libraryFeedback.endScreenScore !== undefined)) {
            nextScreen.feedback = self.libraryFeedback;
          }
          parent.trigger('navigated', nextScreen);
        }

        parent.navigating = true;
      }
    };
    navButton.classList.add('h5p-nav-button');
    this.navButton = document.createElement('button');
    this.navButton.classList.add('transition');
    this.navButton.addEventListener('animationend', function () {
      _this2.parent.unanimateNavButton();
    });

    this.navButton.addEventListener('click', function (event) {
      if (_this2.parent.proceedButtonInProgress) {
        return;
      }

      _this2.parent.proceedButtonInProgress = true;
      var that = _this2;
      var promise = new Promise(function (resolve) {
        var response = that.handleProceed();

        // Wait until receive positive response
        if (response) {
          resolve(true);
        }
      });
      promise.then(function (bool) {
        that.parent.proceedButtonInProgress = false;
      });
    });

    this.navButton.classList.add('h5p-nav-button');

    this.navButton.appendChild(document.createTextNode(parent.params.l10n.proceedButtonText));
    buttonWrapper.appendChild(this.navButton);

    var header = document.createElement('div');
    header.classList.add('h5p-screen-header');

    this.header = header;

    header.appendChild(titleDiv);
    header.appendChild(buttonWrapper);
    wrapper.appendChild(header);

    var handleWrapperResize = function handleWrapperResize() {
      if (_this2.wrapper.clientHeight > 500) {
        _this2.wrapper.style.minHeight = _this2.wrapper.clientHeight + 'px';
      }
    };

    (0, _detectResize.addResizeListener)(wrapper, handleWrapperResize);

    // Resize container on animation end
    wrapper.addEventListener("animationend", function (event) {
      if (event.animationName === 'slide-in' && self.currentLibraryElement) {
        parent.trigger('resize');
        setTimeout(function () {
          // Make the library resize then make the wrapper resize to the new library height
          (0, _detectResize.addResizeListener)(self.currentLibraryElement, function () {
            self.handleLibraryResize();
            parent.trigger('resize');
          });
        }, 100);
      }
    });

    return wrapper;
  };

  /**
   * Append back button.
   * @param {string} label Button label.
   * @return {HTMLElement} Back button.
   */
  LibraryScreen.prototype.createBackButton = function (label) {
    var _this3 = this;

    var self = this;

    var backButton = document.createElement('button');
    backButton.classList.add('transition');
    backButton.classList.add('h5p-back-button');

    // Navigation
    backButton.addEventListener('click', function (event) {
      // Hide overlay popup when user is at Branching Question
      if (event.currentTarget.hasAttribute("isBQ")) {
        if (_this3.overlay) {
          // TODO: When does this code every run?!
          if (_this3.overlay.parentNode !== null) {
            _this3.overlay.parentNode.removeChild(_this3.overlay);
          }
          _this3.overlay = undefined;
          _this3.branchingQuestions.forEach(function (bq) {
            if (bq.parentNode !== null) {
              bq.parentNode.removeChild(bq);
            }
          });
          _this3.showBackgroundToReadspeaker();
        }
        // If the BQ is at first position, we need to restart the screen when user want to go back from the 2nd screen (next screen after BQ)
        if (self.parent.params.content[0].type.library.split(' ')[0] === 'H5P.BranchingQuestion' && self.parent.currentId === 0) {
          self.parent.trigger('restarted');
          return backButton;
        }
        self.parent.trigger('navigated', {
          reverse: true
        });
        return;
      }

      // Stop impatient users from breaking the view
      if (self.parent.navigating === true) {
        return;
      }

      if (self.currentLibraryId === 0 && self.parent.params.content[self.parent.currentId].type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
        self.parent.isReverseTransition = true;
        self.parent.trigger('restarted');
        return backButton;
      }

      self.parent.trigger('navigated', {
        reverse: true
      });
      self.parent.navigating = true;
    });

    backButton.appendChild(document.createTextNode(label));

    return backButton;
  };

  //  Hande proceed to next slide.
  LibraryScreen.prototype.handleProceed = function () {
    var _this4 = this;

    var returnValue = true;
    // Stop impatient users from breaking the view
    if (this.parent.navigating === false) {
      var hasFeedbackTitle = this.libraryFeedback.title && this.libraryFeedback.title.trim();
      var hasFeedbackSubtitle = this.libraryFeedback.subtitle && this.libraryFeedback.subtitle.trim();

      var hasFeedback = !!(hasFeedbackTitle || hasFeedbackSubtitle || this.libraryFeedback.image);

      if (hasFeedback && this.nextLibraryId !== -1) {
        // Add an overlay if it doesn't exist yet
        if (this.overlay === undefined) {
          this.overlay = document.createElement('div');
          this.overlay.className = 'h5p-branching-scenario-overlay';
          this.wrapper.appendChild(this.overlay);
          this.hideBackgroundFromReadspeaker();
        }

        var branchingQuestion = document.createElement('div');
        branchingQuestion.classList.add('h5p-branching-question-wrapper');
        branchingQuestion.classList.add('h5p-branching-scenario-feedback-dialog');

        var questionContainer = document.createElement('div');
        questionContainer.classList.add('h5p-branching-question-container');

        branchingQuestion.appendChild(questionContainer);

        var feedbackScreen = this.createFeedbackScreen(this.libraryFeedback, this.nextLibraryId);
        questionContainer.appendChild(feedbackScreen);

        questionContainer.classList.add('h5p-start-outside');
        questionContainer.classList.add('h5p-fly-in');
        this.currentLibraryWrapper.style.zIndex = 0;
        setTimeout(function () {
          // Small wait for safari browsers
          _this4.wrapper.appendChild(branchingQuestion);

          // After adding feedback, check whether the resize is needed or not
          if (parseInt(_this4.currentLibraryWrapper.style.height) < questionContainer.offsetHeight) {
            _this4.currentLibraryElement.style.height = questionContainer.offsetHeight + 'px';
            _this4.wrapper.style.height = questionContainer.offsetHeight + 'px';
          }
        }, 100);
        feedbackScreen.focus();
        this.parent.navigating = true;
      } else {
        var nextScreen = {
          nextContentId: this.nextLibraryId
        };

        if (!!(hasFeedback || this.libraryFeedback.endScreenScore !== undefined)) {
          nextScreen.feedback = this.libraryFeedback;
        }

        // Allow user to naviate to next slide/library if the execution completes
        var self = this;
        returnValue = false;
        var promise = new Promise(function (resolve) {
          resolve(self.parent.trigger('navigated', nextScreen));
        });
        promise.then(function (bool) {
          _this4.parent.proceedButtonInProgress = false;
          _this4.parent.navigating = true;
          return true;
        });
      }
    }

    // Return to Proceed button listener with response
    if (returnValue) {
      return returnValue;
    }
  };

  LibraryScreen.prototype.createFeedbackScreen = function (feedback, nextContentId) {
    var self = this;
    var labelId = 'h5p-branching-feedback-title-' + LibraryScreen.idCounter++;
    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-branching-question');
    wrapper.classList.add(feedback.image !== undefined ? 'h5p-feedback-has-image' : 'h5p-feedback-default');
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('tabindex', '-1');
    wrapper.setAttribute('aria-labelledby', labelId);

    if (feedback.image !== undefined && feedback.image.path !== undefined) {
      var imageContainer = document.createElement('div');
      imageContainer.classList.add('h5p-branching-question');
      imageContainer.classList.add('h5p-feedback-image');
      var image = document.createElement('img');
      image.src = H5P.getPath(feedback.image.path, self.parent.contentId);
      imageContainer.appendChild(image);
      wrapper.appendChild(imageContainer);
    }

    var feedbackContent = document.createElement('div');
    feedbackContent.classList.add('h5p-branching-question');
    feedbackContent.classList.add('h5p-feedback-content');

    var feedbackText = document.createElement('div');
    feedbackText.classList.add('h5p-feedback-content-content');
    feedbackContent.appendChild(feedbackText);

    var title = document.createElement('h1');
    title.id = labelId;
    title.innerHTML = feedback.title || '';
    feedbackText.appendChild(title);

    if (feedback.subtitle) {
      var subtitle = document.createElement('div');
      subtitle.innerHTML = feedback.subtitle || '';
      feedbackText.appendChild(subtitle);
    }

    var navButton = document.createElement('button');
    navButton.onclick = function () {
      self.parent.trigger('navigated', {
        nextContentId: nextContentId
      });
    };

    var text = document.createTextNode(this.parent.params.l10n.proceedButtonText);
    navButton.appendChild(text);

    feedbackContent.appendChild(navButton);

    var KEYCODE_TAB = 9;
    feedbackContent.addEventListener('keydown', function (e) {
      var isTabPressed = e.key === 'Tab' || e.keyCode === KEYCODE_TAB;
      if (isTabPressed) {
        e.preventDefault();
        return;
      }
    });

    wrapper.appendChild(feedbackContent);

    return wrapper;
  };

  /**
   * Creates the library element and hides it if necessary
   *
   * @param  {Object} library Library object
   * @param  {boolean} isNextLibrary Determines if the lirbary should be hidden for now
   * @return {HTMLElement} Wrapping div for the library element
   */
  LibraryScreen.prototype.createLibraryElement = function (library, isNextLibrary) {
    var _this5 = this;

    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-library-wrapper');

    var libraryElement = document.createElement('div');
    libraryElement.classList.add('h5p-branching-scenario-content');
    this.appendRunnable(libraryElement, library.type, library.contentId);

    var libraryMachineName = library.type && library.type.library.split(' ')[0];

    // Content overlay required for some instances
    this.contentOverlays[library.contentId] = new H5P.BranchingScenario.LibraryScreenOverlay(this);
    wrapper.appendChild(this.contentOverlays[library.contentId].getDOM());
    if (libraryMachineName === 'H5P.InteractiveVideo' || libraryMachineName === 'H5P.Video') {
      this.contentOverlays[library.contentId].addButton('replay', this.parent.params.l10n.replayButtonText, function () {
        _this5.handleReplayVideo(libraryMachineName, library);
      });
      this.contentOverlays[library.contentId].addButton('proceed', this.parent.params.l10n.proceedButtonText, function () {
        _this5.handleProceedAfterVideo();
      });
    }

    wrapper.appendChild(libraryElement);

    if (isNextLibrary) {
      wrapper.classList.add('h5p-next');
      libraryElement.classList.add('h5p-branching-hidden');
    }

    // Special case when first node is BQ and library screen tries to display it
    if (libraryMachineName === 'H5P.BranchingQuestion') {
      libraryElement.classList.add('h5p-branching-hidden');
    }

    return wrapper;
  };

  LibraryScreen.prototype.handleReplayVideo = function (libraryMachineName, library) {
    this.contentOverlays[this.currentLibraryId].hide();

    // Hide procced button
    if (this.libraryFinishingRequirements[library.contentId] === true && this.hasValidVideo(library)) {
      this.parent.disableNavButton();
    }

    // sets buffering state for video
    this.currentLibraryInstance.currentState = 3;

    this.currentLibraryInstance.seek(0);
    this.currentLibraryInstance.play();

    if (libraryMachineName === 'H5P.InteractiveVideo') {
      this.resetIVProgress();
    }
  };

  /**
   *  Used to reset an IV after you replay it.
   */
  LibraryScreen.prototype.resetIVProgress = function () {
    var interactions = this.currentLibraryInstance.interactions;
    interactions.forEach(function (interaction) {
      interaction.resetTask();
    });

    var interactiveVideo = this.currentLibraryInstance;
    interactiveVideo.addSliderInteractions();

    if (!interactiveVideo.endscreen) {
      return;
    }

    interactiveVideo.endscreen.update();
    interactiveVideo.endscreen.$closeButton[0].click();

    var ivSubmitScreenStar = this.wrapper.getElementsByClassName('h5p-star-foreground')[0];
    ivSubmitScreenStar.classList.remove('h5p-star-active');
  };

  LibraryScreen.prototype.handleProceedAfterVideo = function () {
    this.contentOverlays[this.currentLibraryId].hide();
    this.handleProceed();
  };

  /**
   * Creates a new content instance from the given content parameters and
   * then attaches it the wrapper. Sets up event listeners.
   *
   * @param {Object} container Container the library should be appended to
   * @param {Object} content Data for the library
   * @param {number} id Id of the library
   * @return {undefined}
   */
  LibraryScreen.prototype.appendRunnable = function (container, content, id) {
    var self = this;
    var parent = this.parent;

    var library = content.library.split(' ')[0];
    if (library === 'H5P.Video') {
      // Prevent video from growing endlessly since height is unlimited.
      content.params.visuals.fit = false;
    }
    if (library === 'H5P.BranchingQuestion') {
      content.params.proceedButtonText = parent.params.l10n.proceedButtonText;
    }

    var contentClone = H5P.jQuery.extend(true, {}, content);
    if (hasAutoplay(contentClone.params)) {
      this.shouldAutoplay[id] = true;
    }
    this.currentMachineName = contentClone.library.split(' ', 2)[0];

    // Create content instance
    // Deep clone paramters to prevent modification (since they're reused each time the course is reset)
    var instance = H5P.newRunnable(contentClone, this.parent.contentId, H5P.jQuery(container), true, {
      parent: this.parent
    });

    if (this.parent.params.content[id].forceContentFinished === 'enabled' || this.parent.params.content[id].forceContentFinished === 'useBehavioural' && this.parent.params.behaviour.forceContentFinished === true) {
      this.libraryFinishingRequirements[id] = this.forceContentFinished(instance, content.library.split(' ')[0]);
      this.addFinishedListeners(instance, content.library.split(' ')[0]);
    }

    instance.setActivityStarted();

    // Proceed to Branching Question automatically after video has ended
    if (content.library.indexOf('H5P.Video ') === 0 && this.nextIsBranching(id)) {
      instance.on('stateChange', function (event) {
        if (event.data === H5P.Video.ENDED && self.navButton) {
          self.handleProceed();
        }
      });
    }

    // Ensure that iframe is resized when image is loaded.
    if (content.library.indexOf('H5P.Image') === 0) {
      instance.on('loaded', function () {
        self.handleLibraryResize();
        self.parent.trigger('resize');
      });
    }

    if (content.library.indexOf('H5P.Video') === 0 || content.library.indexOf('H5P.InteractiveVideo') === 0) {
      var videoInstance = content.library.indexOf('H5P.Video') === 0 ? instance : instance.video;

      videoInstance.on('loaded', function () {
        self.handleLibraryResize();
      });

      videoInstance.on('error', function () {
        self.parent.enableNavButton();
      });
    }

    instance.on('navigated', function (e) {
      parent.trigger('navigated', e.data);
    });

    this.libraryInstances[id] = instance;

    // Bubble resize events
    this.bubbleUp(instance, 'resize', parent);

    // Remove any fullscreen buttons
    this.disableFullscreen(instance);
  };

  /**
   * Try to stop any playback on the instance.
   *
   * @param {number} id Id of the instance node
   */
  LibraryScreen.prototype.stopPlayback = function (id) {
    var instance = this.libraryInstances[id];
    if (instance) {
      try {
        if (instance.pause !== undefined && (instance.pause instanceof Function || typeof instance.pause === 'function')) {
          instance.pause();
        } else if (instance.video !== undefined && instance.video.pause !== undefined && (instance.video.pause instanceof Function || typeof instance.video.pause === 'function')) {
          instance.video.pause();
        } else if (instance.stop !== undefined && (instance.stop instanceof Function || typeof instance.stop === 'function')) {
          instance.stop();
        } else if (instance.pauseMedia !== undefined && (instance.pauseMedia instanceof Function || typeof instance.pauseMedia === 'function') && instance.elementInstances[instance.currentSlideIndex]) {
          for (var i = 0; i < instance.elementInstances[instance.currentSlideIndex].length; i++) {
            instance.pauseMedia(instance.elementInstances[instance.currentSlideIndex][i]);
          }
        }
      } catch (err) {
        // Prevent crashing, but tell developers there's something wrong.
        H5P.error(err);
      }
    }
  };

  /* Check whether instance needs to be finished by user.
  * @param {object} instance Instance of the content type.
  * @param {string} library Library that's active on screen (H5P.Foo).
  */
  LibraryScreen.prototype.forceContentFinished = function (instance, library) {
    var forceContentFinished = false;

    if (instance) {
      forceContentFinished = forceContentFinished || instance.getScore && typeof instance.getScore === 'function';
    }

    /*
     * Some libraries need to tuned explicitly because there's no way to
     * detect whether they are a "finishable" content type
     */
    if (library) {
      forceContentFinished = forceContentFinished || library === 'H5P.Audio' || library === 'H5P.Video';
    }

    // Exceptions
    if (library === 'H5P.CoursePresentation' && instance && instance.children.length + (instance.isTask ? 1 : 0) === 1 || instance.activeSurface === true) {
      forceContentFinished = false;
    }

    return forceContentFinished;
  };

  /**
   * Add listeners for screen finished.
   * Will require to handle some content types explicitly.
   * @param {object} instance Instance of the content type.
   * @param {string} library Library that's active on screen (H5P.Foo).
   */
  LibraryScreen.prototype.addFinishedListeners = function (instance, library) {
    var _this6 = this;

    var that = this;

    if (typeof library !== 'string' || !instance) {
      return;
    }
    switch (library) {
      case 'H5P.CoursePresentation':
        // Permit progression when final slide has been reached
        instance.on('xAPI', function (event) {
          if (event.data.statement.verb.display['en-US'] === 'progressed') {
            var slideProgressedTo = parseInt(event.data.statement.object.definition.extensions['http://id.tincanapi.com/extension/ending-point']);
            if (slideProgressedTo === instance.children.length + (instance.isTask ? 1 : 0)) {
              if (_this6.navButton.classList.contains('h5p-disabled')) {
                that.parent.enableNavButton(true);
              }
            }
          }
        });
        break;

      case 'H5P.InteractiveVideo':
        // Permit progression when results have been submitted or video ended if no tasks
        instance.on('xAPI', function (event) {
          if (event.data.statement.verb.display['en-US'] === 'completed') {
            that.handleVideoOver();
          }
        });
        instance.video.on('stateChange', function (event) {
          if (event.data === H5P.Video.ENDED || event.data === H5P.Video.PLAYING && that.contentOverlays[that.currentLibraryId].hidden === false) {
            var answered = instance.interactions.filter(function (interaction) {
              return interaction.getProgress() !== undefined;
            });

            // Giving opportunity to submit the answers 
            if (instance.hasStar && answered.length > 0) {
              that.parent.enableNavButton();
            } else {
              that.handleVideoOver();
            }
            this.pause();
          }
        });
        break;

      // Permit progression when video ended
      case 'H5P.Video':
        instance.on('stateChange', function (event) {
          if (event.data === H5P.Video.ENDED) {
            if (!that.nextIsBranching(that.currentLibraryId)) {
              that.handleVideoOver();
            }
            // else already handled by general video listener
          }
        });
        break;

      // Permit progression when audio ended
      case 'H5P.Audio':
        instance.audio.on('ended', function () {
          that.parent.enableNavButton();
        });
        break;

      // Permit progression when xAPI sends "answered" or "completed"
      default:
        if (typeof instance.getAnswerGiven === 'function') {
          instance.on('xAPI', function (event) {
            if (event.data.statement.verb.display['en-US'] === 'answered' || event.data.statement.verb.display['en-US'] === 'completed') {
              that.parent.enableNavButton();
            }
          });
        }
    }
  };

  /**
   * Handle video completed.
   * Will proceed right away if next node is BQ, otherwise show intermediary overlay.
   */
  LibraryScreen.prototype.handleVideoOver = function () {
    if (this.nextIsBranching(this.currentLibraryId)) {
      this.handleProceed();
    } else {
      this.showContentOverlay();
    }
    this.parent.enableNavButton();
  };

  /**
   * Show content overlay.
   */
  LibraryScreen.prototype.showContentOverlay = function () {
    this.contentOverlays[this.currentLibraryId].show();
  };

  /**
   * Hide content overlay.
   */
  LibraryScreen.prototype.hideContentOverlay = function () {
    this.contentOverlays[this.currentLibraryId].hide();
  };

  /**
   * Used to get XAPI data for "previous" library.
   *
   * @param {number} id Id of the instance node
   * @return {Object} XAPI Data
   */
  LibraryScreen.prototype.getXAPIData = function (id) {
    if (this.libraryInstances[id] && this.libraryInstances[id].getXAPIData) {
      return this.libraryInstances[id].getXAPIData();
    }
  };

  /**
   * Check if next node is a Branching Question.
   *
   * @param {number} id Id of node to check for.
   * @return {boolean} True, if next node is BQ, else false.
   */
  LibraryScreen.prototype.nextIsBranching = function (id) {
    var nextContentId = id !== undefined ? this.parent.params.content[id].nextContentId : undefined;

    return nextContentId !== undefined && nextContentId > 0 ? LibraryScreen.isBranching(this.parent.params.content[nextContentId]) : false;
  };

  /**
   * Check if params has autoplay enabled
   *
   * @param {Object} params
   * @return {boolean}
   */
  var hasAutoplay = function hasAutoplay(params) {
    if (params.autoplay) {
      params.autoplay = false;
      return true;
    } else if (params.playback && params.playback.autoplay) {
      params.playback.autoplay = false;
      return true;
    } else if (params.media && params.media.params && params.media.params.playback && params.media.params.playback.autoplay) {
      params.media.params.playback.autoplay = false;
      return true;
    } else if (params.media && params.media.params && params.media.params.autoplay) {
      params.media.params.autoplay = false;
      return true;
    } else if (params.override && params.override.autoplay) {
      // Handle auto-play for Interactive Video :-)
      params.override.autoplay = false;
      return true;
    } else if (params.presentation && params.presentation.slides[0].elements) {
      for (var i = 0; i < params.presentation.slides[0].elements.length; i++) {
        var instanceParams = params.presentation.slides[0].elements[i];
        if (!instanceParams.displayAsButton && instanceParams.action && instanceParams.action.params && hasAutoplay(instanceParams.action.params)) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Pre-render the next libraries for smooth transitions for a specific library
   * @param  {Object} library Library Data
   * @return {undefined}
   */
  LibraryScreen.prototype.createNextLibraries = function (library) {
    this.removeNextLibraries();
    this.nextLibraries = {};
    this.loadLibrary(library);
  };

  /**
   * Create next library
   * @param {Object} library
   */
  LibraryScreen.prototype.createNextLibrary = function (library) {
    this.removeNextLibraries();
    this.nextLibraries = {};
    this.loadLibrary(library, library.contentId);
  };

  /**
   * Load library
   *
   * @param {Object} library
   * @param {number} [contentId] Id of loaded library
   */
  LibraryScreen.prototype.loadLibrary = function (library) {
    var _this7 = this;

    var contentId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var loadedContentId = contentId !== null ? contentId : library.nextContentId;

    // If not a branching question, just load the next library
    if (library.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
      var nextLibrary = this.parent.getLibrary(loadedContentId);

      // Do nothing if the next screen is an end screen
      if (nextLibrary === false) {
        return;
      }

      // Pre-render the next library if it is not a branching question
      if (nextLibrary.type && nextLibrary.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
        this.nextLibraries[loadedContentId] = this.createLibraryElement(nextLibrary, true);
        this.wrapper.appendChild(this.nextLibraries[loadedContentId]);
      }
    }

    // If it is a branching question, load all the possible libraries
    else {
        var alternatives = library.type.params.branchingQuestion.alternatives || [];
        var ids = alternatives.map(function (alternative) {
          return alternative.nextContentId;
        });
        ids.forEach(function (nextContentId) {
          var nextLibrary = _this7.parent.getLibrary(nextContentId);

          // Do nothing if the next screen is an end screen
          if (nextLibrary === false) {
            return;
          }

          // Pre-render all the next libraries as long as they are not branching questions
          if (nextLibrary.type && nextLibrary.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
            _this7.nextLibraries[nextContentId] = _this7.createLibraryElement(nextLibrary, true);
            _this7.wrapper.appendChild(_this7.nextLibraries[nextContentId]);
          }
        });
      }
  };

  /**
   * Remove next libraries
   */
  LibraryScreen.prototype.removeNextLibraries = function () {
    // Remove outdated 'next' libraries
    var nextLibraryElements = this.wrapper.getElementsByClassName('h5p-next');
    for (var i = 0; i < nextLibraryElements.length; i++) {
      nextLibraryElements[i].parentNode.removeChild(nextLibraryElements[i]);
    }
  };

  /**
   * Remove custom fullscreen buttons from sub content.
   * (A bit of a hack, there should have been some sort of override…)
   *
   * @param {Object} instance Library instance
   * @return {undefined}
   */
  LibraryScreen.prototype.disableFullscreen = function (instance) {
    switch (instance.libraryInfo.machineName) {
      case 'H5P.CoursePresentation':
        if (instance.$fullScreenButton) {
          instance.$fullScreenButton.remove();
        }
        break;

      case 'H5P.InteractiveVideo':
        instance.on('controls', function () {
          if (instance.controls.$fullscreen) {
            instance.controls.$fullscreen.remove();
          }
        });
        break;
    }
  };

  /**
   * Makes it easy to bubble events from child to parent
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Object} target Target to trigger event on
   * @return {undefined}
   */
  LibraryScreen.prototype.bubbleUp = function (origin, eventName, target) {
    origin.on(eventName, function (event) {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  };

  /**
   * Checks to see if the library has a valid video (source file or external link).
   * video/unknown check is to verify that external Youtube links work correctly.
   */
  LibraryScreen.prototype.hasValidVideo = function (currentLibraryParams) {
    var type = currentLibraryParams.type;
    var videoLibrary = type.metadata.contentType;
    var videoSource = videoLibrary === "Interactive Video" ? type.params.interactiveVideo.video.files : type.params.sources;
    if (type && (videoLibrary === "Interactive Video" || videoLibrary === 'Video') && videoSource && videoSource[0].mime && videoSource[0].mime !== "video/unknown" && (videoSource[0].mime !== "video/webm" && videoSource[0].mime !== "video/mp4" || H5P.VideoHtml5.canPlay(videoSource))) {
      return true;
    }
    return false;
  };

  /**
   * Slides the screen in and styles it as the current screen
   * @return {undefined}
   */
  LibraryScreen.prototype.show = function () {
    var self = this;
    var library = self.parent.params.content[self.currentLibraryId];

    if (self.libraryFinishingRequirements[self.currentLibraryId] === true && (self.hasValidVideo(library) || library.type.library.split(' ')[0] === 'H5P.CoursePresentation')) {
      self.contentOverlays[self.currentLibraryId].hide();
      self.parent.disableNavButton();
    }

    self.isShowing = true;
    self.wrapper.classList.add('h5p-slide-in');
    self.wrapper.classList.remove('h5p-branching-hidden');

    // Style as the current screen
    self.wrapper.addEventListener('animationend', function (e) {
      if (e.target.className === 'h5p-next-screen h5p-slide-in') {
        self.wrapper.classList.remove('h5p-next-screen');
        self.wrapper.classList.remove('h5p-slide-in');
        self.wrapper.classList.add('h5p-current-screen');
        self.parent.navigating = false;
        self.wrapper.style.minHeight = self.parent.currentHeight;
        self.libraryTitle.focus();
      }
    });
  };

  /**
   * Slides the screen out and styles it to be hidden
   * @param {boolean} skipAnimationListener Skips waiting for animation before removing
   *  elements. Useful when animation would not have time to run anyway.
   * @return {undefined}
   */
  LibraryScreen.prototype.hide = function (skipAnimationListener) {
    var self = this;
    self.isShowing = false;

    // Remove possible alternative libaries
    for (var i = 0; i < this.nextLibraries.length; i++) {
      // Ensures it is hidden if remove() doesn't execute quickly enough
      this.nextLibraries[i].style.display = 'none';
      if (this.nextLibraries[i].parentNode !== null) {
        this.nextLibraries[i].parentNode.removeChild(this.nextLibraries[i]);
      }
    }

    // Hide overlay and branching questions
    if (this.overlay) {
      if (this.overlay.parentNode !== null) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      // TODO: Does not appear to ever run...
      this.overlay = undefined;
      this.branchingQuestions.forEach(function (bq) {
        if (bq.parentNode !== null) {
          bq.parentNode.removeChild(bq);
        }
      });
    }

    self.wrapper.classList.add('h5p-slide-out');

    function removeElements() {
      self.wrapper.classList.remove('h5p-current-screen');
      self.wrapper.classList.add('h5p-next-screen');
      self.wrapper.classList.remove('h5p-slide-out');
      self.wrapper.classList.remove('h5p-slide-out-reverse');
      self.wrapper.classList.remove('h5p-slide-pseudo');
      setTimeout(function () {
        if (self.wrapper.parentNode !== null) {
          self.wrapper.parentNode.removeChild(self.wrapper);
          self.remove();
          self.parent.libraryScreen = null;
          self.parent.trigger('resize');
        }
      }, 100);
    }

    if (skipAnimationListener) {
      setTimeout(function () {
        removeElements();
      }, 800);
    } else {
      self.wrapper.addEventListener('animationend', removeElements);
    }
  };

  /**
   * Hides branching question if the next library 'branched to'
   * is the one beneath the overlay. Basically the same as the
   * 'showNextLibrary' function but without transitions
   *
   * @param  {Object} library library data of the library beneath the overlay
   * @return {undefined}
   */
  LibraryScreen.prototype.hideBranchingQuestion = function (library) {
    // TODO: When does this code every run?!
    this.nextLibraryId = library.nextContentId;
    this.libraryFeedback = library.feedback;

    // Hide branching question
    if (this.overlay.parentNode !== null) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = undefined;
    this.branchingQuestions.forEach(function (bq) {
      if (bq.parentNode !== null) {
        bq.parentNode.removeChild(bq);
      }
    });

    // Prepare next libraries
    this.createNextLibraries(library);
    this.parent.navigating = false;
    this.navButton.focus();
    this.showBackgroundToReadspeaker();
  };

  LibraryScreen.prototype.hideFeedbackDialogs = function () {
    if (this.overlay) {
      if (this.overlay.parentNode !== null) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = undefined;
      this.showBackgroundToReadspeaker();
    }

    var wrapper = document.querySelector('.h5p-current-screen');
    if (!wrapper) {
      return;
    }
    var questionWrapper = wrapper.querySelector('.h5p-branching-question-wrapper');
    if (questionWrapper) {
      questionWrapper.parentNode.removeChild(questionWrapper);
    }
  };

  /**
   * Ensure that start screen can contain branching questions
   * @param {boolean} isStartScreen True if resizing the start screen
   */
  LibraryScreen.prototype.resizeScreen = function () {
    var isStartScreen = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    // Ensure start screen expands to encompass large branching questions
    if (!this.questionContainer) {
      return;
    }
    var screenWrapper = isStartScreen ? this.parent.startScreen.screenWrapper : this.wrapper;

    var paddingTop = parseInt(window.getComputedStyle(this.questionContainer, null).getPropertyValue('padding-top'), 10);
    screenWrapper.style.height = this.questionContainer.offsetHeight + paddingTop + 'px';
  };

  /**
   * Slides in the next library which may be either a 'normal content type' or a
   * branching question
   *
   * @param  {Object} library Library data
   * @return {undefined}
   */
  LibraryScreen.prototype.showNextLibrary = function (library) {
    var reverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    this.nextLibraryId = library.nextContentId;
    this.libraryFeedback = library.feedback;

    // Show normal h5p library
    if (!LibraryScreen.isBranching(library)) {
      var showProceedButtonflag = true;
      // First priority - Hide navigation button first to prevent user to make unecessary clicks
      if (this.libraryFinishingRequirements[library.contentId] === true && (this.hasValidVideo(library) || library.type.library.split(' ')[0] === 'H5P.CoursePresentation')) {
        this.contentOverlays[this.currentLibraryId].hide();
        this.parent.disableNavButton();
        showProceedButtonflag = false;
      }

      // Update the title
      var contentTitle = library.type && library.type.metadata && library.type.metadata.title ? library.type.metadata.title : '';
      this.libraryTitle.setAttribute('aria-label', contentTitle ? contentTitle : 'Untitled Content');
      this.libraryTitle.innerHTML = library.showContentTitle && contentTitle ? contentTitle : '&nbsp;';

      if (this.currentLibraryId === library.contentId) {
        // Target slide is already being displayed
        this.currentLibraryWrapper.classList.add('h5p-slide-pseudo');
      } else if (reverse) {
        // Slide out the current library in reverse direction
        this.currentLibraryWrapper.classList.add('h5p-slide-out-reverse');
      } else {
        // Slide out the current library
        this.currentLibraryWrapper.classList.add('h5p-slide-out');
      }

      // Remove the branching questions if they exist
      if (this.overlay) {
        // TODO: When does this code every run?!
        if (this.overlay.parentNode !== null) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = undefined;
        this.branchingQuestions.forEach(function (bq) {
          if (bq.parentNode !== null) {
            bq.parentNode.removeChild(bq);
          }
        });
        this.showBackgroundToReadspeaker();
      }

      // Initialize library if necessary
      if (!this.nextLibraries[library.contentId]) {
        this.createNextLibrary(library);
      }

      // Slide in selected library
      var libraryWrapper = this.nextLibraries[library.contentId];
      if (!libraryWrapper.offsetParent) {
        this.wrapper.appendChild(libraryWrapper);
      }

      // Move next library left of current library if sliding backwards
      if (reverse) {
        libraryWrapper.classList.remove('h5p-next');
        libraryWrapper.classList.add('h5p-previous');
      }

      libraryWrapper.classList.add('h5p-slide-in');
      var libraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
      libraryElement.classList.remove('h5p-branching-hidden');

      this.currentLibraryId = library.contentId;
      this.currentLibraryInstance = this.libraryInstances[library.contentId];

      if (this.currentLibraryInstance.resize) {
        this.currentLibraryInstance.resize();
      }

      var self = this;
      this.currentLibraryWrapper.addEventListener('animationend', function () {
        if (self.currentLibraryWrapper.parentNode !== null) {
          self.currentLibraryWrapper.parentNode.removeChild(self.currentLibraryWrapper);
        }
        self.currentLibraryWrapper = libraryWrapper;
        self.currentLibraryWrapper.classList.remove('h5p-previous');
        self.currentLibraryWrapper.classList.remove('h5p-next');
        self.currentLibraryWrapper.classList.remove('h5p-slide-in');
        self.currentLibraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0]; // TODO: Why no use 'libraryElement' ?
        self.createNextLibraries(library);
        self.parent.navigating = false;
        self.libraryTitle.focus();

        // New position to show Proceed button because sometimes user can play with the button while animation is in progress
        if (showProceedButtonflag) {
          self.parent.enableNavButton();
        }

        // Require to call resize the frame after animation completes
        self.resize(new H5P.Event('resize', {
          element: libraryElement
        }));
      });
    } else {
      // Show a branching question
      if (this.parent.params.behaviour === true) {
        this.parent.disableNavButton();
      }

      // Remove existing branching questions
      this.branchingQuestions.forEach(function (bq) {
        if (bq.parentNode !== null) {
          bq.parentNode.removeChild(bq);
        }
      });

      // BS could be showing start screen or library screen
      var wrapper = document.querySelector('.h5p-current-screen');

      // Add an overlay if it doesn't exist yet
      if (this.overlay === undefined) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'h5p-branching-scenario-overlay';
        wrapper.appendChild(this.overlay);
        this.hideBackgroundFromReadspeaker();
      }

      var buttonWrapper = document.createElement('div');
      buttonWrapper.classList.add('h5p-nav-button-wrapper');

      // Append back button if at least one node has it enabled
      if (this.parent.backwardsAllowedFlags.indexOf(true) !== -1) {
        this.bqBackButton = this.createBackButton(this.parent.params.l10n.backButtonText);
        this.bqBackButton.setAttribute('isBQ', true);

        // Check the back button is enable or not
        if (this.parent.canEnableBackButton(library.contentId) === false) {
          this.bqBackButton.classList.add('h5p-disabled');
          this.bqBackButton.setAttribute('disabled', true);
        }
        buttonWrapper.appendChild(this.bqBackButton);
      }

      var branchingQuestion = document.createElement('div');
      branchingQuestion.className = 'h5p-branching-question-wrapper';

      this.appendRunnable(branchingQuestion, library.type, library.contentId);
      wrapper.appendChild(branchingQuestion);
      this.branchingQuestions.push(branchingQuestion);

      var labelId = 'h5p-branching-question-title-' + LibraryScreen.idCounter++;
      var questionContainer = branchingQuestion.querySelector('.h5p-branching-question-container');
      this.questionContainer = questionContainer;
      questionContainer.setAttribute('role', 'dialog');
      questionContainer.setAttribute('tabindex', '-1');
      questionContainer.setAttribute('aria-labelledby', labelId);
      questionContainer.classList.add('h5p-start-outside');
      questionContainer.classList.add('h5p-fly-in');
      branchingQuestion.querySelector('.h5p-branching-question-title').id = labelId;

      document.querySelector('.h5p-branching-question').appendChild(buttonWrapper);
      this.currentLibraryWrapper.style.zIndex = 0;

      /**
       * Resizes the wrapper to the height of the container. If the current BQ is at the very start of the content type then resize parent wrapper
       * Make exception for starting screen, so it does not cut from the top, as well as fullscreen.
       */
      var isFullscreen = this.parent.isFullScreen();
      var isSmallerDevice = this.parent.$container[0].classList.contains('h5p-mobile-screen');

      if (this.currentLibraryWrapper.style.height === "" && !this.parent.startScreen.isShowing && !isFullscreen && !isSmallerDevice) {
        this.resizeScreen();
      } else if (this.parent.startScreen.isShowing && !isFullscreen) {
        // Ensure start screen expands to encompass large branching questions
        this.resizeScreen(true);
      } else if (parseInt(this.currentLibraryWrapper.style.height) < questionContainer.offsetHeight) {
        this.currentLibraryWrapper.style.height = questionContainer.offsetHeight + 'px';
      }

      this.createNextLibraries(library);
      this.parent.navigating = false;

      branchingQuestion.addEventListener('animationend', function () {
        var firstAlternative = branchingQuestion.querySelectorAll('.h5p-branching-question-alternative')[0];
        if (typeof firstAlternative !== 'undefined') {
          questionContainer.focus();
        }
      });
    }
  };

  LibraryScreen.prototype.hideBackgroundFromReadspeaker = function () {
    this.header.setAttribute('aria-hidden', 'true');
    this.currentLibraryWrapper.setAttribute('aria-hidden', 'true');
  };

  LibraryScreen.prototype.showBackgroundToReadspeaker = function () {
    this.header.setAttribute('aria-hidden', 'false');
    this.currentLibraryWrapper.setAttribute('aria-hidden', 'false');
  };

  LibraryScreen.prototype.getElement = function () {
    return this.wrapper;
  };

  LibraryScreen.prototype.remove = function () {
    this.parent.off('started', this.triggerAutoplay);
    this.parent.off('navigated', this.triggerAutoplay);
    if (this.wrapper.parentNode !== null) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  };

  LibraryScreen.prototype.resize = function (e) {
    var instance = this.currentLibraryInstance;
    var element = e && e.data && e.data.element ? e.data.element : this.currentLibraryElement;

    var isImage = instance && instance.libraryInfo.machineName === 'H5P.Image';
    var isCP = instance && instance.libraryInfo.machineName === 'H5P.CoursePresentation';
    var isHotspots = instance && instance.libraryInfo.machineName === 'H5P.ImageHotspots';
    var isVideo = instance && instance.libraryInfo.machineName === 'H5P.Video';
    var isIV = instance && instance.libraryInfo.machineName === 'H5P.InteractiveVideo';
    var hasSize = instance && instance.width && instance.height;
    var isYoutube = element.classList.contains('h5p-youtube');

    var canScaleImage = hasSize && (isImage || isCP) || isHotspots || isVideo;
    if (canScaleImage) {
      // Always reset scaling
      element.style.width = '';
      element.style.height = '';

      if (isHotspots) {
        element.style.maxWidth = '';
      }
    }

    // Toggle full screen class for content (required for IV to resize properly)
    if (this.parent.isFullScreen()) {
      element.classList.add('h5p-fullscreen');

      if (isIV && instance.$videoWrapper[0].firstChild.style) {
        instance.videoHeight = instance.$videoWrapper[0].firstChild.style.height;
      }

      // Preserve aspect ratio for Image in fullscreen (since height is limited) instead of scrolling or streching
      if (canScaleImage) {
        var videoRect = isVideo && this.parent.params.content[this.currentLibraryId].type.params.sources !== undefined ? element.getBoundingClientRect() : null;

        // Video with no source should appear on top
        if (isVideo && this.parent.params.content[this.currentLibraryId].type.params.sources === undefined) {
          element.classList.add('h5p-video-no-source');
        } else {
          element.classList.remove('h5p-video-no-source');
        }

        if (videoRect || isHotspots || isCP || isImage) {
          var height = isHotspots ? instance.options.image.height : isVideo ? videoRect.height : instance.height;
          var width = isHotspots ? instance.options.image.width : isCP ? instance.ratio * height : isVideo ? videoRect.width : instance.width;
          var aspectRatio = height / width;
          var targetElement = isIV ? element.lastChild : element;
          var availableSpace = targetElement.getBoundingClientRect();

          var availableAspectRatio = availableSpace.height / availableSpace.width;

          if (aspectRatio > availableAspectRatio) {
            if (isHotspots) {
              targetElement.style.maxWidth = availableSpace.height * (width / height) + 'px';
            } else {
              targetElement.style.width = availableSpace.height * (width / height) + 'px';
            }
          } else {
            targetElement.style.height = availableSpace.width * aspectRatio + 'px';
            if (isYoutube && element.querySelector('iframe') !== null) {
              element.querySelector('iframe').style.height = availableSpace.width * aspectRatio + 'px';
            }
          }
        }
      }
    } else {
      // Fullscreen with branching question must set wrapper size
      if (this.parent.startScreen.isShowing) {
        this.resizeScreen(true);
      } else if (this.overlay) {
        this.resizeScreen();
      } else {
        // reset wrapper height
        this.wrapper.style.height = '';
      }

      var videoWrapperInstance = element.getElementsByClassName('h5p-video-wrapper');
      if (isIV && videoWrapperInstance.length > 0) {
        var videoWrapper = videoWrapperInstance[0].firstChild;
        if (videoWrapper.style) {
          videoWrapper.style.height = instance.videoHeight;
        }
      } else if (isYoutube && element.querySelector('iframe') !== null) {
        element.querySelector('iframe').style.height = '';
      }
      element.classList.remove('h5p-fullscreen');
    }

    if (instance) {
      instance.trigger('resize', e);
      // Must resize library screen after resizing content
      this.handleLibraryResize();
    }
  };

  /**
   * Check if library is a Branching Question
   *
   * @param {Object} library
   * @returns {boolean} True if library is a Branching Question
   */
  LibraryScreen.isBranching = function (library) {
    if (library && library.type && library.type.library) {
      return library.type.library.indexOf('H5P.BranchingQuestion ') === 0;
    }
    return false;
  };

  LibraryScreen.idCounter = 0;

  return LibraryScreen;
}();

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/**
* Detect Element Resize.
* Forked in order to guard against unsafe 'window' and 'document' references by react-virtualized project.
* ES6ified and npmified by @noderaider.
*
* https://github.com/sdecima/javascript-detect-element-resize
* Sebastian Decima
*
* version: 0.5.3
**/

// Check `document` and `window` in case of server-side rendering
var IS_BROWSER = function IS_BROWSER() {
  return (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object';
};
var _window = IS_BROWSER() ? window : global;

var attachEvent = IS_BROWSER() ? document.attachEvent : false;
var stylesCreated = false;
var animationName = null;
var animationKeyframes = null;
var animationStyle = null;
var animationstartevent = null;

var resetTriggers = function resetTriggers(element) {
  var triggers = element.__resizeTriggers__;
  var expand = triggers.firstElementChild;
  var contract = triggers.lastElementChild;
  var expandChild = expand.firstElementChild;
  contract.scrollLeft = contract.scrollWidth;
  contract.scrollTop = contract.scrollHeight;
  expandChild.style.width = expand.offsetWidth + 1 + 'px';
  expandChild.style.height = expand.offsetHeight + 1 + 'px';
  expand.scrollLeft = expand.scrollWidth;
  expand.scrollTop = expand.scrollHeight;
};

var requestFrame = function () {
  var raf = _window.requestAnimationFrame || _window.mozRequestAnimationFrame || _window.webkitRequestAnimationFrame || function (fn) {
    return setTimeout(fn, 20);
  };
  return function (fn) {
    return raf(fn);
  };
}();

var cancelFrame = function () {
  var cancel = _window.cancelAnimationFrame || _window.mozCancelAnimationFrame || _window.webkitCancelAnimationFrame || _window.clearTimeout;
  return function (id) {
    return cancel(id);
  };
}();

var checkTriggers = function checkTriggers(element) {
  return element.offsetWidth != element.__resizeLast__.width || element.offsetHeight != element.__resizeLast__.height;
};
var scrollListener = function scrollListener(e) {
  var element = this;
  resetTriggers(this);
  if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
  this.__resizeRAF__ = requestFrame(function () {
    if (checkTriggers(element)) {
      element.__resizeLast__.width = element.offsetWidth;
      element.__resizeLast__.height = element.offsetHeight;
      element.__resizeListeners__.forEach(function (fn) {
        fn.call(element, e);
      });
    }
  });
};

if (IS_BROWSER() && !attachEvent) {

  /* Detect CSS Animations support to detect element display/re-attach */
  var animation = false;
  var animationstring = 'animation';
  var keyframeprefix = '';
  animationstartevent = 'animationstart';
  var domPrefixes = 'Webkit Moz O ms'.split(' ');
  var startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' ');
  var pfx = '';
  var elm = document.createElement('fakeelement');
  if (typeof elm.style.animationName !== 'undefined') animation = true;

  if (animation === false) {
    for (var i = 0; i < domPrefixes.length; i++) {
      if (typeof elm.style[domPrefixes[i] + 'AnimationName'] !== 'undefined') {
        pfx = domPrefixes[i];
        animationstring = pfx + 'Animation';
        keyframeprefix = '-' + pfx.toLowerCase() + '-';
        animationstartevent = startEvents[i];
        animation = true;
        break;
      }
    }
  }

  animationName = 'resizeanim';
  animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
  animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
}

var createStyles = function createStyles() {
  if (!stylesCreated) {
    //opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
    var css = (animationKeyframes ? animationKeyframes : '') + '.resize-triggers { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } .resize-triggers, .resize-triggers > div, .contract-trigger:before { content: " "; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }';
    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');

    style.type = 'text/css';
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
    stylesCreated = true;
  }
};

var addResizeListener = function addResizeListener(element, fn) {
  if (attachEvent) element.attachEvent('onresize', fn);else if (IS_BROWSER()) {
    if (!element.__resizeTriggers__) {
      if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
      createStyles();
      element.__resizeLast__ = {};
      element.__resizeListeners__ = [];
      (element.__resizeTriggers__ = document.createElement('div')).className = 'resize-triggers';
      element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' + '<div class="contract-trigger"></div>';
      element.appendChild(element.__resizeTriggers__);
      resetTriggers(element);
      element.addEventListener('scroll', scrollListener, true);

      /* Listen for a css animation to detect element display/re-attach */
      animationstartevent && element.__resizeTriggers__.addEventListener(animationstartevent, function (e) {
        if (e.animationName == animationName) resetTriggers(element);
      });
    }
    element.__resizeListeners__.push(fn);
  }
};

var removeResizeListener = function removeResizeListener(element, fn) {
  if (attachEvent) element.detachEvent('onresize', fn);else if (IS_BROWSER()) {
    element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
    if (!element.__resizeListeners__.length) {
      element.removeEventListener('scroll', scrollListener, true);
      element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
    }
  }
};

exports.addResizeListener = addResizeListener;
exports.removeResizeListener = removeResizeListener;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ }),
/* 5 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


H5P.BranchingScenario.LibraryScreenOverlay = function () {

  /**
   * LibraryScreenOverlay
   * @constructor
   */
  function LibraryScreenOverlay(parent) {
    this.hidden = true;
    this.parent = parent;
    this.overlay = document.createElement('div');
    this.overlay.classList.add('h5p-content-overlay');
    this.overlay.classList.add('h5p-hidden');

    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.classList.add('h5p-content-overlay-buttons-container');
    this.overlay.appendChild(this.buttonsContainer);
    this.buttons = {};
  }

  /**
   * Get DOM element of overlay.
   * @return {HTMLElement} DOM element of overlay.
   */
  LibraryScreenOverlay.prototype.getDOM = function () {
    return this.overlay;
  };

  /**
   * Show overlay.
   */
  LibraryScreenOverlay.prototype.show = function () {
    var _this = this;

    this.overlay.classList.remove('h5p-hidden');
    window.requestAnimationFrame(function () {
      _this.buttonsContainer.classList.remove('h5p-hidden');
      _this.hidden = false;

      _this.setLibraryTabIndex("-1");

      // Focus last button (assuming proceed)
      Object.values(_this.buttons)[Object.keys(_this.buttons).length - 1].focus();
    });
  };

  /**
   * Sets the tab index of the library behind the overlay, so that these elements can not
   * visited when the overlay is present and visited when the overlay goes away.
   */
  LibraryScreenOverlay.prototype.setLibraryTabIndex = function (index) {
    var $currentLibraryWrapper = this.parent.currentLibraryWrapper;
    // Used in Video and IVs.
    if ($currentLibraryWrapper && $currentLibraryWrapper.querySelector('iframe')) {
      $currentLibraryWrapper.querySelector('iframe').setAttribute("tabindex", index);
      //  Used in just IVs
      if (this.parent.currentLibraryInstance.libraryInfo.machineName === 'H5P.InteractiveVideo') {
        this.parent.toggleIVTabIndexes(index);
      }
    }
  };

  /**
   * Hide overlay.
   */
  LibraryScreenOverlay.prototype.hide = function () {
    this.hidden = true;
    this.overlay.classList.add('h5p-hidden');
    this.buttonsContainer.classList.add('h5p-hidden');
    this.setLibraryTabIndex('0');
  };

  /**
   * Determine whether overlay is visible.
   * @return {boolean} True, if overlay is visible, else false;
   */
  LibraryScreenOverlay.prototype.isVisible = function () {
    return !this.hidden;
  };

  /**
   * Add button to overlay.
   * @param {string|number} id Id of button.
   * @param {string} label Label for button.
   * @param {function} callback Callback for button click.
   * @return {HTMLElement} Button.
   */
  LibraryScreenOverlay.prototype.addButton = function (id, label, callback) {
    if (!id && id !== 0 || !label || typeof callback !== 'function' || this.buttons[id]) {
      return null;
    }

    var button = document.createElement('button');
    button.classList.add('transition');
    button.classList.add('h5p-nav-button');
    button.classList.add('h5p-nav-button-' + id);
    button.innerText = label;

    button.addEventListener('click', function (event) {
      callback(id);
    });

    this.buttons[id] = button;
    this.buttonsContainer.appendChild(button);

    return button;
  };

  /**
   * Remove button.
   * @param {string|number} id Id of button.
   */
  LibraryScreenOverlay.prototype.removeButton = function (id) {
    if (!id && id !== 0 || !this.buttons[id]) {
      return;
    }

    this.buttonsContainer.removeChild(this.buttons[id]);
    delete this.buttons[id];
  };

  return LibraryScreenOverlay;
}();

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


H5P.BranchingScenario.Scoring = function () {

  var SCORE_TYPES = {
    STATIC_SCORE: 'static-end-score',
    DYNAMIC_SCORE: 'dynamic-score',
    NO_SCORE: 'no-score'
  };

  /**
   * Handles scoring
   *
   * @param params
   * @constructor
   */
  function Scoring(params) {
    var self = this;
    var scores = [];
    var visitedIndex = 0;

    /**
     * Check if library has end score
     *
     * @param {object} library
     * @returns {boolean} True if library has end score
     */
    var hasEndScreenScore = function hasEndScreenScore(library) {
      return library && library.feedback && library.feedback.endScreenScore !== undefined;
    };

    /**
     * Find all branching paths with an ending from the given content
     *
     * @param content Content to find branching paths from
     * @param visitedNodes Currently visited nodes, loops are ignored
     * @returns {Array} List of possible paths leading to an ending
     */
    var findBranchingPaths = function findBranchingPaths(content, visitedNodes) {
      if (!self.isBranchingQuestion(content)) {
        return findBranchingEndings(content, visitedNodes);
      }

      // Check all alternatives for branching question
      var foundPaths = [];
      var alternatives = content.type.params.branchingQuestion.alternatives;
      alternatives.forEach(function (alt, index) {
        var accumulatedNodes = visitedNodes.concat({
          type: 'alternative',
          index: index,
          alternativeParent: visitedNodes[visitedNodes.length - 1].index
        });

        var paths = findBranchingEndings(alt, accumulatedNodes);
        foundPaths = foundPaths.concat(paths);
      });
      return foundPaths;
    };

    /**
     * Find paths with endings from a content or alternative
     *
     * @param {object} content Content or alternative
     * @param {Array} visitedNodes List of visited nodes
     * @returns {Array} List of found paths with an end from the given content
     */
    var findBranchingEndings = function findBranchingEndings(content, visitedNodes) {
      // Ending screen
      if (content.nextContentId === -1) {
        return [visitedNodes];
      }

      var isLoop = visitedNodes.some(function (node) {
        // Only check 'content' type, not alternatives, as we can't loop
        // to alternatives
        return node.type === 'content' && node.index === content.nextContentId;
      });

      // Skip loops as they are already explored
      if (!isLoop) {
        var nextContent = params.content[content.nextContentId];
        var accumulatedNodes = visitedNodes.concat({
          type: 'content',
          index: content.nextContentId,
          alternativeParent: null
        });
        return findBranchingPaths(nextContent, accumulatedNodes);
      }

      return [];
    };

    /**
     * Calculates max score
     *
     * @returns {number} Max score
     */
    var calculateMaxScore = function calculateMaxScore() {
      if (params.scoringOptionGroup.scoringOption === SCORE_TYPES.STATIC_SCORE) {
        return calculateStaticMaxScore();
      } else if (params.scoringOptionGroup.scoringOption === SCORE_TYPES.DYNAMIC_SCORE) {
        return calculateDynamicMaxScore();
      }
      // No scoring
      return 0;
    };

    /**
     * Calculates static max score
     *
     * @returns {number}
     */
    var calculateStaticMaxScore = function calculateStaticMaxScore() {
      var defaultEndScore = params.endScreens[0].endScreenScore;
      var defaultMaxScore = defaultEndScore !== undefined ? defaultEndScore : 0;

      // Find max score by checking which ending scenario has the highest score
      return params.content.reduce(function (acc, content) {
        // Flatten alternatives
        var choices = [content];
        if (self.isBranchingQuestion(content)) {
          choices = content.type.params.branchingQuestion.alternatives;
        }
        return acc.concat(choices);
      }, []).filter(function (content) {
        return content.nextContentId === -1;
      }).reduce(function (prev, content) {
        var score = hasEndScreenScore(content) ? content.feedback.endScreenScore : defaultMaxScore;

        return prev >= score ? prev : score;
      }, 0);
    };

    /**
     * Calculates dynamic max score
     *
     * @returns {number}
     */
    var calculateDynamicMaxScore = function calculateDynamicMaxScore() {
      var maxScore = 0;
      scores.forEach(function (score) {
        maxScore += score.maxScore;
      });
      return maxScore;
    };

    /**
     * Get score for a Branching Question alternative
     *
     * @param libraryParams
     * @param chosenAlternative
     * @returns {*}
     */
    var getAlternativeScore = function getAlternativeScore(libraryParams, chosenAlternative) {
      if (!(chosenAlternative >= 0)) {
        return 0;
      }

      var hasAlternative = libraryParams && libraryParams.type && libraryParams.type.params && libraryParams.type.params.branchingQuestion && libraryParams.type.params.branchingQuestion.alternatives && libraryParams.type.params.branchingQuestion.alternatives[chosenAlternative];

      if (!hasAlternative) {
        return 0;
      }
      var alt = libraryParams.type.params.branchingQuestion.alternatives[chosenAlternative];

      if (!hasEndScreenScore(alt) || alt.nextContentId === undefined || alt.nextContentId < 0) {
        return 0;
      }

      return alt.feedback.endScreenScore;
    };

    /**
     * Get max score for a Branching Question
     *
     * @param libraryParams
     * @returns {*}
     */
    var getQuestionMaxScore = function getQuestionMaxScore(libraryParams, chosenAlternative) {
      if (!(chosenAlternative >= 0)) {
        return 0;
      }
      var alt = libraryParams.type.params.branchingQuestion.alternatives;
      var maxScore = 0;
      alt.forEach(function (score, index) {
        // If you change from static to dynamic scoring an end screen can have score
        // This should not be used for dynamic scroing since the field isn't shown 
        if (alt[index].feedback.endScreenScore > maxScore && alt[index].nextContentId !== -1) {
          maxScore = alt[index].feedback.endScreenScore;
        }
      });

      return maxScore;
    };

    /**
     * Get current score. Uses screen score if configured to use static score.
     *
     * @param {number} screenScore Used when static score is configured
     * @returns {number} Current score
     */
    this.getScore = function (screenScore) {
      if (params.scoringOptionGroup.scoringOption === SCORE_TYPES.DYNAMIC_SCORE) {
        return scores.reduce(function (previousValue, score) {
          return previousValue + score.score;
        }, 0);
      } else if (params.scoringOptionGroup.scoringOption === SCORE_TYPES.STATIC_SCORE) {
        return screenScore;
      } else {
        return 0;
      }
    };

    /**
     * Get max score for the whole branching scenario depending on scoring options
     *
     * @returns {number} Max score for branching scenario
     */
    this.getMaxScore = function () {
      return calculateMaxScore();
    };

    /**
     * Restart scoring
     */
    this.restart = function () {
      scores = [];
      visitedIndex = 0;
    };

    /**
     * Retrieve current library's score
     *
     * @param {number} currentId Id of current question
     * @param {number} libraryId Id of current library
     * @param {number} [chosenAlternative] Chosen alternative for branching
     *  questions
     */
    this.addLibraryScore = function (currentId, libraryId, chosenAlternative, contentScores) {
      visitedIndex = visitedIndex + 1;
      var libraryParams = params.content[currentId];
      var currentLibraryScore = 0;
      var currentLibraryMaxScore = 0;

      // BQ if library id differs or if it is the first content
      var isBranchingQuestion = currentId !== libraryId || currentId === 0 && this.isBranchingQuestion(libraryParams);

      // For Branching Questions find score for chosen alternative
      if (isBranchingQuestion) {
        currentLibraryScore = getAlternativeScore(libraryParams, chosenAlternative);
        currentLibraryMaxScore = getQuestionMaxScore(libraryParams, chosenAlternative);
      } else {
        // Add score from field
        if (hasEndScreenScore(libraryParams) && libraryParams.nextContentId && libraryParams.nextContentId > -1) {
          currentLibraryScore = libraryParams.feedback.endScreenScore;
          currentLibraryMaxScore = libraryParams.feedback.endScreenScore;
        }
        // Add score from content
        if (params.scoringOptionGroup.includeInteractionsScores && Object.entries(contentScores).length !== 0) {
          currentLibraryScore += contentScores.score;
          currentLibraryMaxScore += contentScores.maxScore;
        }
      }

      // Update existing score and detect loops
      var isLoop = false;

      // In preview mode it is possible to produce a reverse loop, e.g. start
      // in the order 3->2->3. In this case we only remove the old score
      var duplicateIndex = null;
      var loopBackIndex = -1;
      scores.forEach(function (score, index) {
        if (score.id === currentId) {
          score.score = currentLibraryScore;
          score.visitedIndex = visitedIndex;
          loopBackIndex = score.visitedIndex;

          // If our current id params is not pointing to the next item
          // in our scores array, there has been a jump, and thus there is a
          // reverse loop
          var isPointingToNextScore = scores.length > index + 1 && params.content[score.id].nextContentId === scores[index + 1].id;
          if (!isPointingToNextScore) {
            duplicateIndex = index;
          } else {
            isLoop = true;
          }
        }
      });

      if (isLoop) {
        // Remove all scores visited after loop
        scores = scores.filter(function (score) {
          return score.visitedIndex <= loopBackIndex;
        });
        visitedIndex = loopBackIndex;
      } else {
        // For reverse loops we remove the old item first, so the scores
        // will be in the proper order
        if (duplicateIndex !== null) {
          scores.splice(duplicateIndex, 1);
        }

        scores.push({
          visitedIndex: visitedIndex,
          id: currentId,
          score: currentLibraryScore,
          maxScore: currentLibraryMaxScore
        });
      }
    };

    /**
     * Check if library is a Branching Question
     *
     * @param {object|string} library
     * @returns {boolean} True if library is a Branching Question
     */
    this.isBranchingQuestion = function (library) {
      var libraryString = library;
      if (library && library.type && library.type.library) {
        libraryString = library.type.library;
      }

      return libraryString.split(' ')[0] === 'H5P.BranchingQuestion';
    };

    /**
     * Check if scoring is dynamic
     *
     * @returns {boolean} True if dynamic scoring
     */
    this.isDynamicScoring = function () {
      return params.scoringOptionGroup.scoringOption === SCORE_TYPES.DYNAMIC_SCORE;
    };

    /**
     * Determines if score types are configured to show scores
     *
     * @returns {boolean} True if score should show
     */
    this.shouldShowScore = function () {
      return params.scoringOptionGroup.scoringOption === SCORE_TYPES.STATIC_SCORE || this.isDynamicScoring();
    };
  }

  return Scoring;
}();

/***/ })
/******/ ]);