H5P.BranchingScenario.Scoring = (function () {

  const SCORE_TYPES = {
    STATIC_SCORE: 'static-end-score',
    DYNAMIC_SCORE: 'dynamic-score',
    NO_SCORE: 'no-score',
  };

  /**
   * Handles scoring
   *
   * @param params
   * @constructor
   */
  function Scoring(params) {
    const self = this;
    let scores = [];
    let visitedIndex = 0;

    /**
     * Check if library has end score
     *
     * @param {object} library
     * @returns {boolean} True if library has end score
     */
    const hasEndScreenScore = function (library) {
      return library
        && library.feedback
        && library.feedback.endScreenScore !== undefined;
    };

    /**
     * Find all branching paths with an ending from the given content
     *
     * @param content Content to find branching paths from
     * @param visitedNodes Currently visited nodes, loops are ignored
     * @returns {Array} List of possible paths leading to an ending
     */
    const findBranchingPaths = function (content, visitedNodes) {
      if (!self.isBranchingQuestion(content)) {
        return findBranchingEndings(content, visitedNodes);
      }

      // Check all alternatives for branching question
      let foundPaths = [];
      const alternatives = content.type.params.branchingQuestion.alternatives;
      alternatives.forEach(function (alt, index) {
        const accumulatedNodes = visitedNodes.concat({
          type: 'alternative',
          index: index,
          alternativeParent: visitedNodes[visitedNodes.length - 1].index,
        });

        const paths = findBranchingEndings(alt, accumulatedNodes);
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
    const findBranchingEndings = function (content, visitedNodes) {
      // Ending screen
      if (content.nextContentId === -1) {
        return [visitedNodes];
      }

      const isLoop = visitedNodes.some(function (node) {
        // Only check 'content' type, not alternatives, as we can't loop
        // to alternatives
        return node.type === 'content' && node.index === content.nextContentId;
      });

      // Skip loops as they are already explored
      if (!isLoop) {
        const nextContent = params.content[content.nextContentId];
        const accumulatedNodes = visitedNodes.concat({
          type: 'content',
          index: content.nextContentId,
          alternativeParent: null,
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
    const calculateMaxScore = function () {
      if (params.scoringOptionGroup.scoringOption === SCORE_TYPES.STATIC_SCORE) {
        return calculateStaticMaxScore();
      }
      else if (params.scoringOptionGroup.scoringOption === SCORE_TYPES.DYNAMIC_SCORE) {
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
    const calculateStaticMaxScore = function () {
      const defaultEndScore = params.endScreens[0].endScreenScore;
      const defaultMaxScore = defaultEndScore !== undefined
        ? defaultEndScore : 0;

      // Find max score by checking which ending scenario has the highest score
      return params.content.reduce(function (acc, content) {
        // Flatten alternatives
        let choices = [content];
        if (self.isBranchingQuestion(content)) {
          choices = content.type.params.branchingQuestion.alternatives;
        }
        return acc.concat(choices);
      }, []).filter(function (content) {
        return content.nextContentId === -1;
      }).reduce(function (prev, content) {
        let score = hasEndScreenScore(content)
          ? content.feedback.endScreenScore
          : defaultMaxScore;

        return prev >= score ? prev : score;
      }, 0);
    };

    /**
     * Calculates dynamic max score
     *
     * @returns {number}
     */
    const calculateDynamicMaxScore = function () {
      let maxScore = 0;
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
    const getAlternativeScore = function (libraryParams, chosenAlternative) {
      if (!(chosenAlternative >= 0)) {
        return 0;
      }

      const hasAlternative = libraryParams
        && libraryParams.type
        && libraryParams.type.params
        && libraryParams.type.params.branchingQuestion
        && libraryParams.type.params.branchingQuestion.alternatives
        && libraryParams.type.params.branchingQuestion.alternatives[chosenAlternative];

      if (!hasAlternative) {
        return 0;
      }
      const alt = libraryParams.type.params.branchingQuestion.alternatives[chosenAlternative];

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
    const getQuestionMaxScore = function (libraryParams, chosenAlternative) {
      if (!(chosenAlternative >= 0)) {
        return 0;
      }
      const alt = libraryParams.type.params.branchingQuestion.alternatives;
      let maxScore = 0;
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
      }
      else if (params.scoringOptionGroup.scoringOption === SCORE_TYPES.STATIC_SCORE) {
        return screenScore;
      }
      else {
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
      const libraryParams = params.content[currentId];
      let currentLibraryScore = 0;
      let currentLibraryMaxScore = 0; 

      // BQ if library id differs or if it is the first content
      const isBranchingQuestion = currentId !== libraryId
        || (currentId === 0 && this.isBranchingQuestion(libraryParams));

      // For Branching Questions find score for chosen alternative
      if (isBranchingQuestion) {
        currentLibraryScore = getAlternativeScore(libraryParams, chosenAlternative);
        currentLibraryMaxScore = getQuestionMaxScore(libraryParams, chosenAlternative);
      }
      else {
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
      let isLoop = false;

      // In preview mode it is possible to produce a reverse loop, e.g. start
      // in the order 3->2->3. In this case we only remove the old score
      let duplicateIndex = null;
      let loopBackIndex = -1;
      scores.forEach(function (score, index) {
        if (score.id === currentId) {
          score.score = currentLibraryScore;
          score.visitedIndex = visitedIndex;
          loopBackIndex = score.visitedIndex;

          // If our current id params is not pointing to the next item
          // in our scores array, there has been a jump, and thus there is a
          // reverse loop
          const isPointingToNextScore = scores.length > index + 1
            && params.content[score.id].nextContentId === scores[index + 1].id;
          if (!isPointingToNextScore) {
            duplicateIndex = index;
          }
          else {
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
      }
      else {
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
      let libraryString = library;
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
      return params.scoringOptionGroup.scoringOption === SCORE_TYPES.STATIC_SCORE
        || this.isDynamicScoring();
    };
  }

  return Scoring;
})();
