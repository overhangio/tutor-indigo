H5P.BranchingScenario.GenericScreen = (function () {

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
    H5P.EventDispatcher.call(this);

    const self = this;
    self.parent = parent;
    self.isShowing = screenData.isStartScreen;
    self.isFeedbackAvailable = false;
    self.screenWrapper = document.createElement('div');
    self.screenWrapper.classList.add(screenData.isStartScreen ? 'h5p-start-screen' : 'h5p-end-screen');
    self.screenWrapper.classList.add(screenData.isCurrentScreen ? 'h5p-current-screen' : 'h5p-next-screen');
    if (!screenData.isCurrentScreen) {
      this.screenWrapper.classList.add('h5p-branching-hidden');
    }
    else {
      self.parent.currentHeight = '45em';
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('h5p-branching-scenario-screen-content');

    var feedbackText = document.createElement('div');
    feedbackText.classList.add('h5p-feedback-content-content');
    contentDiv.appendChild(feedbackText);
    self.feedbackText = feedbackText;

    const title = document.createElement('h1');
    title.className = 'h5p-branching-scenario-title-text';
    title.innerHTML = screenData.titleText;

    const subtitle = document.createElement('div');
    subtitle.className = 'h5p-branching-scenario-subtitle-text';
    subtitle.innerHTML = screenData.subtitleText;

    const navButton = document.createElement('button');
    navButton.classList.add(screenData.isStartScreen ? 'h5p-start-button' : 'h5p-end-button');
    navButton.classList.add('transition');

    navButton.onclick = function () {
      screenData.isStartScreen ? self.parent.trigger('started') : self.parent.trigger('restarted');
      let startScreen = document.getElementsByClassName('h5p-start-screen')[0];
      // Resize start screen when user restart the course
      if (!screenData.isStartScreen) {
        startScreen.style.height = '';
      }
      self.parent.navigating = true;
    };

    self.navButton = navButton;

    const buttonTextNode = document.createTextNode(screenData.buttonText);
    navButton.appendChild(buttonTextNode);

    feedbackText.appendChild(title);
    feedbackText.appendChild(subtitle);
    contentDiv.appendChild(navButton);

    if (screenData.showScore && screenData.score !== undefined) {
      self.scoreWrapper = this.createResultContainer(
        screenData.scoreText,
        screenData.score,
        screenData.maxScore
      );
      contentDiv.insertBefore(self.scoreWrapper, contentDiv.firstChild);
    }

    if (H5P.canHasFullScreen) {
      const fullScreenButton = document.createElement('button');
      fullScreenButton.className = 'h5p-branching-full-screen';
      fullScreenButton.setAttribute('aria-label', this.parent.params.l10n.fullscreenAria);
      fullScreenButton.addEventListener('click', () => {
        this.trigger('toggleFullScreen');
      });
      self.screenWrapper.appendChild(fullScreenButton);
    }

    self.screenWrapper.appendChild(
      self.createScreenBackground(screenData.isStartScreen, screenData.image, screenData.altText)
    );
    self.screenWrapper.appendChild(contentDiv);

    // Validate any of the contents are present, make screen reader to read
    if ((screenData.showScore && screenData.score !== undefined) || screenData.titleText !== "" || screenData.subtitleText !== "") {
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
      let startScreen = document.getElementsByClassName('h5p-start-screen')[0];
      const finalScreenReachedClasses = ['h5p-end-screen', 'h5p-current-screen'];
      if (finalScreenReachedClasses.every(i => self.screenWrapper.classList.contains(i))) {
        startScreen.classList.add('h5p-reset-start');
      } 
      else if (startScreen.classList.contains('h5p-reset-start')) {
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
    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-result-wrapper');

    const resultContainer = document.createElement('div');
    resultContainer.classList.add('h5p-result-container');

    const scoreText = document.createElement('div');
    scoreText.classList.add('h5p-score-text');
    scoreText.appendChild(document.createTextNode(scoreLabel));

    const scoreCircle = document.createElement('div');
    scoreCircle.classList.add('h5p-score-circle');

    const achievedScore = document.createElement('span');
    achievedScore.className = 'h5p-score-value';
    this.scoreValue = document.createTextNode(score.toString());
    achievedScore.appendChild(this.scoreValue);

    scoreCircle.appendChild(achievedScore);

    const scoreDelimiter = document.createElement('span');
    scoreDelimiter.className = 'h5p-score-delimiter';
    scoreDelimiter.textContent = '/';
    scoreCircle.appendChild(scoreDelimiter);

    const maxAchievableScore = document.createElement('span');
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
    const backgroundWrapper = document.createElement('div');
    backgroundWrapper.classList.add('h5p-screen-background');

    const backgroundBanner = document.createElement('div');
    backgroundBanner.classList.add('h5p-screen-banner');

    const backgroundImage = document.createElement('img');
    backgroundImage.classList.add('h5p-background-image');

    if (image && image.path) {
      backgroundImage.tabIndex = 0;
      backgroundImage.src = H5P.getPath(image.path, this.parent.contentId);
    }
    else {
      backgroundImage.src = isStartScreen ? this.parent.getLibraryFilePath('assets/start-screen-default.jpg') : this.parent.getLibraryFilePath('assets/end-screen-default.jpg');
    }

    if (altText && altText.length) {
      backgroundImage.setAttribute('aria-label', altText);
    }

    backgroundImage.addEventListener('load', () => {
      this.parent.trigger('resize');
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
  GenericScreen.prototype.show = function (slideBack = false) {
    const self = this;
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
        }
        else {
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
    const self = this;
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
})();
