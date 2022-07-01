H5P = H5P || {};

H5P.BranchingScenario = function (params, contentId) {
  const self = this;

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
  const extend = function () {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          if (typeof arguments[0][key] === 'object' &&
            typeof arguments[i][key] === 'object') {
            extend(arguments[0][key], arguments[i][key]);
          }
          else {
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
    endScreens: [
      {
        endScreenTitle: "",
        endScreenSubtitle: "",
        contentId: -1
      }
    ],
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
  params.content.forEach((item, index) => {
    item.contentId = index;
    if (item.nextContentId === undefined) {
      item.nextContentId = -1;
    }
  });

  // Compute pattern for enabling/disabling back button
  self.backwardsAllowedFlags = params.content.map(content => {
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
  const createStartScreen = function ({ startScreenTitle, startScreenSubtitle, startScreenImage, startScreenAltText }, isCurrentScreen) {
    const startScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: true,
      titleText: startScreenTitle,
      subtitleText: startScreenSubtitle,
      image: startScreenImage,
      altText: startScreenAltText,
      fullscreenAria: params.l10n.fullscreenAria,
      buttonText: params.l10n.startScreenButtonText,
      isCurrentScreen
    });

    startScreen.on('toggleFullScreen', () => {
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
  const createEndScreen = function (endScreenData) {
    const endScreen = new H5P.BranchingScenario.GenericScreen(self, {
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
      showScore: self.scoring.shouldShowScore(),
    });

    endScreen.on('toggleFullScreen', () => {
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
    return (params.content[id] !== undefined ? params.content[id] : false);
  };

  /**
   * Handle exitfullscreen event and resize the BS screen
   */
  self.on('exitFullScreen', function () {
    setTimeout(() => {
      self.trigger('resize');
    }, 100);
  });

  /**
   * Handle the start of the branching scenario
   */
  self.on('started', function () {
    const startNode = this.params.content[0];

    // Disable back button if not allowed
    if (self.canEnableBackButton(0) === false) {
      self.disableBackButton();
    }
    else {
      self.enableBackButton();
    }

    if (startNode && startNode.type && startNode.type.library && startNode.type.library.split(' ')[0] === 'H5P.BranchingQuestion') {
      // First node is Branching Question, no sliding, just trigger BQ overlay
      self.trigger('navigated', {
        nextContentId: 0
      });
    }
    else {
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

    const id = parseInt(e.data.nextContentId);

    // Keep track of user steps
    self.userPath.push(id);

    // Remove Back button from BQ overlay
    if (self.currentId > -1 && H5P.BranchingScenario.LibraryScreen.isBranching(self.getLibrary(self.currentId)) && self.$container.find('.h5p-back-button[isBQ="true"]').length) {
      self.$container.find('.h5p-back-button[isBQ="true"]').remove();
    }

    const nextLibrary = self.getLibrary(id);
    let resizeScreen = true;

    if (!self.libraryScreen) {
      self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(
        self,
        params.startScreen.startScreenTitle,
        nextLibrary
      );

      self.libraryScreen.on('toggleFullScreen', () => {
        self.toggleFullScreen();
      });

      self.$container.append(self.libraryScreen.getElement());
      self.currentId = id;
    }
    else {
      // Try to stop any playback
      self.libraryScreen.stopPlayback(self.currentId);

      // Try to collect xAPIData for last screen
      if (!this.params.preventXAPI) {
        const xAPIData = self.libraryScreen.getXAPIData(self.currentId);
        // We do not include branching questions that hasn't been answered in the report (going back from a BQ)
        const isBranching = H5P.BranchingScenario.LibraryScreen.isBranching(self.getLibrary(self.currentId));
        const isBranchingQuestionAndAnswered = isBranching
          && xAPIData.statement && xAPIData.statement.result && xAPIData.statement.result.response !== undefined;

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
      }
      else {
        // Showing two end screens after each other
        self.libraryScreen.hideFeedbackDialogs();
        self.currentEndScreen.hide();
        self.currentEndScreen = null;
      }
    }
    else if (self.startScreen && self.startScreen.isShowing && nextLibrary) {
      if (!H5P.BranchingScenario.LibraryScreen.isBranching(nextLibrary)) {
        self.startScreen.hide();
        self.libraryScreen.show();
        resizeScreen = false;
      }
    }
    else {
      // Remove any feedback dialogs
      self.libraryScreen.hideFeedbackDialogs();
    }

    if (resizeScreen) {
      self.trigger('resize');
    }
    if (self.currentId !== -1) {
      self.triggerXAPI('progressed');

      let contentScores = {};

      if (self.libraryScreen.currentLibraryInstance && self.libraryScreen.currentLibraryInstance.getScore) {
        contentScores = {
          "score": self.libraryScreen.currentLibraryInstance.getScore(),
          "maxScore": self.libraryScreen.currentLibraryInstance.getMaxScore()
        };
      }

      self.scoring.addLibraryScore(
        this.currentId,
        this.libraryScreen.currentLibraryId,
        e.data.chosenAlternative,
        contentScores
      );
    }

    if (nextLibrary === false) {
      //  Show the relevant end screen if there is no next library
      self.currentEndScreen = self.endScreens[id];
      // Custom end screen
      if (e.data.feedback) {
        const endScreen = createEndScreen({
          endScreenTitle: e.data.feedback.title || '',
          endScreenSubtitle: e.data.feedback.subtitle || '',
          endScreenImage: e.data.feedback.image,
          endScreenScore: e.data.feedback.endScreenScore
        });
        self.$container.append(endScreen.getElement());
        self.currentEndScreen = endScreen;
      }
      else if (self.scoring.isDynamicScoring()) {
        self.currentEndScreen.setScore(self.getScore());
        self.currentEndScreen.setMaxScore(self.getMaxScore());
      }

      self.startScreen.hide();
      self.libraryScreen.hide(true);
      self.currentEndScreen.show();
      self.triggerXAPICompleted(self.scoring.getScore(self.currentEndScreen.getScore()), self.scoring.getMaxScore());
    }
    else {
      self.libraryScreen.showNextLibrary(nextLibrary, e.data.reverse);

      // Disable back button if not allowed in new library screen
      if (self.canEnableBackButton(id) === false) {
        self.disableBackButton();
      }
      else {
        self.enableBackButton();
      }
      self.currentId = id;
    }

    // First node was BQ, so sliding from start screen to library screen is needed now
    if (e.data.nextContentId !== 0 && document.querySelector('.h5p-start-screen').classList.contains('h5p-current-screen')) {
      // Remove translation of info content which would tamper with timing of sliding
      const wrapper = self.libraryScreen.wrapper.querySelector('.h5p-slide-in');
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

    self.libraryScreen.on('toggleFullScreen', () => {
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
    if (
      self.libraryScreen
      && typeof self.libraryScreen === 'object'
      && Object.keys(self.libraryScreen).length !== 0
    ) {
      self.libraryScreen.resize(event);
    }

    // Add classname for phone size adjustments
    const rect = self.$container[0].getBoundingClientRect();
    if (rect.width <= 480) {
      self.$container.addClass('h5p-phone-size');
    }
    else {
      self.$container.removeClass('h5p-phone-size');
    }
    if (rect.width < 768) {
      self.$container.addClass('h5p-medium-tablet-size');
    }
    else {
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
    }
    else {
      H5P.fullScreen(self.$container, this);
    }

  };

  /**
   * Returns true if we're in full screen or semi full screen.
   *
   * @returns {boolean}
   */
  self.isFullScreen = function () {
    return H5P.isFullscreen
      || (self.$container
        && self.$container[0].classList.contains('h5p-fullscreen'))
      || (self.$container
        && self.$container[0].classList.contains('h5p-semi-fullscreen'));
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
  self.enableNavButton = function (animated = false) {
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
  self.showNavButton = function (animated = false) {
    if (!self.libraryScreen.navButton) {
      return;
    }

    self.libraryScreen.navButton.classList.remove('h5p-hidden');
    document.activeElement.blur();

    let focusTime = 100;

    if (animated) {
      self.animateNavButton();
    }

    setTimeout(() => {
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
    const fontSize = parseInt(window.getComputedStyle(document.getElementsByTagName('body')[0]).fontSize, 10);
    // Wide screen
    if (this.$container.width() / fontSize > 43) {
      self.$container[0].classList.add('h5p-wide-screen');
    }
    else {
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
      const contentMessage = document.createElement('div');
      contentMessage.innerHTML = 'No content';
      self.$container.append(contentMessage);
      return;
    }

    self.startScreen = createStartScreen(params.startScreen, true);
    self.$container.append(self.startScreen.getElement());
    self.currentId = -1;

    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.startScreen.startScreenTitle, self.getLibrary(0));
    self.libraryScreen.on('toggleFullScreen', () => {
      self.toggleFullScreen();
    });
    self.$container.append(self.libraryScreen.getElement());

    params.endScreens.forEach(endScreen => {
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

    const xAPIEvent = self.createXAPIEventTemplate('answered');

    // Extend definition
    const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    H5P.jQuery.extend(definition, {
      interactionType: 'compound',
      type: 'http://adlnet.gov/expapi/activities/cmi.interaction'
    });
    definition.extensions = {
      'https://h5p.org/x-api/no-question-score': 1
    };

    const score = self.scoring.getScore(self.currentEndScreen.getScore());
    const maxScore = self.scoring.getMaxScore();
    xAPIEvent.setScoredResult(score, maxScore, this, true, score === maxScore);

    return {
      statement: xAPIEvent.data.statement,
      children: self.xAPIDataCollector
    };
  };
};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;
