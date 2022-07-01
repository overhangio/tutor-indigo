/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	// Load library
	H5PEditor.QuestionSetTextualEditor = __webpack_require__(1).default;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _textParser = __webpack_require__(2);

	var _textParser2 = _interopRequireDefault(_textParser);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var $ = H5P.jQuery;
	var H5PEditor = H5PEditor || window.H5PEditor || {};

	/**
	 * Helps localize strings.
	 *
	 * @private
	 * @param {String} identifier
	 * @param {Object} [placeholders]
	 * @returns {String}
	 */
	var t = function t(identifier, placeholders) {
	  if (H5PEditor.t !== undefined) {
	    return H5PEditor.t('H5PEditor.QuestionSetTextualEditor', identifier, placeholders);
	  }
	};

	/**
	 * Line break.
	 *
	 * @private
	 * @constant {String}
	 */
	var LB = '\n';

	/**
	 * Multi Choice library to use
	 * @type {string}
	 */
	var MULTI_CHOICE_LIBRARY = 'H5P.MultiChoice 1.14';

	/**
	 * Warn user the first time he uses the editor.
	 */
	var warned = false;

	var QuestionSetTextualEditor =
	/**
	 * Creates a text input widget for editing question sets
	 *
	 * @class
	 * @param {object[]} list
	 */
	function QuestionSetTextualEditor(list) {
	  _classCallCheck(this, QuestionSetTextualEditor);

	  var self = this;

	  //var entity = list.getEntity();
	  var recreation = false;
	  var shouldWarn = false;

	  self.textParser = new _textParser2.default(MULTI_CHOICE_LIBRARY);

	  /**
	   * Instructions as to how this editor widget is used.
	   * @public
	   */
	  self.helpText = t('helpText') + '<pre>' + t('example') + '</pre>';

	  // Create list html
	  var $input = $('<textarea/>', {
	    id: list.getId(),
	    'aria-describedby': list.getDescriptionId(),
	    rows: 20,
	    css: {
	      resize: 'none'
	    },
	    placeholder: t('example'),
	    on: {
	      change: function change() {
	        recreateList();
	      }
	    }
	  });

	  // Used to convert HTML to text and vice versa
	  var $cleaner = $('<div/>');

	  /**
	   * Clears all items from the list, processes the text and add the items
	   * from the text. This makes it possible to switch to another widget
	   * without losing datas.
	   *
	   * @private
	   */
	  var recreateList = function recreateList() {
	    // Get current list (to re-use values)
	    var oldQuestions = list.getValue();

	    // Reset list
	    list.removeAllItems();

	    // Parse to questions, and add to list
	    self.textParser.parse($input.val()).forEach(function (entry) {
	      var item = self.recycleQuestion(oldQuestions, entry);
	      list.addItem(item);
	    });
	  };

	  /**
	   * Find out if we should re-use values from an old question
	   *
	   * @param {MultiChoiceQuestion[]} oldQuestions
	   * @param {MultiChoiceQuestion} question
	   * @return {MultiChoiceQuestion}
	   */
	  self.recycleQuestion = function (oldQuestions, question) {
	    var parts = self.splitQuestionText(question.params.question);

	    if (self.canRecycleQuestion(parts)) {
	      var index = parts[1] - 1;
	      var text = parts[2];
	      var recycledQuestion = oldQuestions[index] || question; // picks out the numbered question

	      if (recycledQuestion.library === MULTI_CHOICE_LIBRARY) {
	        recycledQuestion.params.question = text;
	        recycledQuestion.params.answers = question.params.answers;
	        recycledQuestion.params.behaviour.singleAnswer = question.params.behaviour.singleAnswer;
	      }

	      return recycledQuestion;
	    } else {
	      return question;
	    }
	  };

	  /**
	   * Checks if the question is recyclable
	   *
	   * @param {String|Number} arr
	   * @return {boolean}
	   */
	  self.canRecycleQuestion = function (arr) {
	    return arr !== null && arr.length === 3;
	  };

	  /**
	   * Splits a question string into component parts
	   *
	   * @param {string} questionText
	   * @return {*|Array|{index: number, input: string}}
	   */
	  self.splitQuestionText = function (questionText) {
	    return questionText.match(/^(\d+)\.\s?(.+)$/);
	  };

	  /**
	   * Find the name of the given field.
	   *
	   * @private
	   * @param {Object} field
	   * @return {String}
	   */
	  var getName = function getName(field) {
	    return field.getName !== undefined ? field.getName() : field.field.name;
	  };

	  /**
	   * Strips down value to make it text friendly
	   *
	   * @private
	   * @param {(String|Boolean)} value To work with
	   * @param {String} [prefix] Prepended to value
	   * @param {String} [suffix] Appended to value
	   */
	  var strip = function strip(value, prefix, suffix) {
	    if (!value) {
	      return '';
	    }

	    value = value.replace(/(<[^>]*>|\r\n|\n|\r)/gm, '').trim();
	    if (value !== '') {
	      if (prefix) {
	        // Add given prefix to value
	        value = prefix + value;
	      }
	      if (suffix) {
	        // Add given suffix to value
	        value += suffix;
	      }
	    }

	    return value;
	  };

	  /**
	   * Get multi choice question in text friendly format.
	   *
	   * @private
	   * @param {Object} item Field instance
	   * @param {Number} id Used for labeling
	   */
	  self.addMultiChoice = function (item, id) {
	    var question = '';

	    item.forEachChild(function (child) {
	      switch (getName(child)) {
	        case 'question':
	          // Strip value to make it text friendly
	          question = strip(child.validate(), id + 1 + '. ', LB) + question;
	          break;

	        case 'answers':
	          // Loop through list of answers
	          child.forEachChild(function (listChild) {

	            // Loop through group of answer properties
	            var answer = '';
	            var feedback = '';
	            var tip = '';
	            listChild.forEachChild(function (groupChild) {
	              switch (getName(groupChild)) {
	                case 'text':
	                  // Add to end
	                  answer += strip(groupChild.validate()).replace(/:/g, '\\:');
	                  break;

	                case 'correct':
	                  if (groupChild.value) {
	                    // Add to beginning
	                    answer = '*' + answer; // Correct answer
	                  }
	                  break;

	                case 'tipsAndFeedback':
	                  groupChild.forEachChild(function (tipOrFeedback) {
	                    switch (getName(tipOrFeedback)) {
	                      case 'chosenFeedback':
	                        // Add to beginning
	                        feedback = strip(tipOrFeedback.validate()).replace(/:/g, '\\:') + (feedback == undefined ? '' : feedback);
	                        break;

	                      case 'notChosenFeedback':
	                        // Add to end
	                        feedback += strip(tipOrFeedback.validate().replace(/:/g, '\\:'), ':');
	                        break;

	                      case 'tip':
	                        tip = strip(tipOrFeedback.validate()).replace(/:/g, '\\:');
	                        break;
	                    }
	                  });

	                  break;
	              }
	            });

	            if (feedback !== '') {
	              // Add feedback to tip
	              tip += ':' + feedback;
	            }
	            if (tip !== '') {
	              // Add tip to answer
	              answer += ':' + tip;
	            }
	            if (answer !== '') {
	              // Add answer to question
	              question += answer + LB;
	            }
	          });
	          break;
	      }
	    });

	    return question;
	  };

	  /**
	   * Add items to the text input.
	   *
	   * @public
	   * @param {Object} item Field instance added
	   * @param {Number} id Used for labeling
	   */
	  self.addItem = function (item, id) {
	    if (recreation) {
	      return;
	    }

	    var question;

	    // Get question text formatting
	    switch (item.currentLibrary) {
	      case MULTI_CHOICE_LIBRARY:
	        question = self.addMultiChoice(item, id);
	        break;

	      default:
	        // Not multi choice question
	        question = id + 1 + '. ' + t('unknownQuestionType') + LB;
	        break;

	      case undefined:
	    }

	    if (!warned && item.currentLibrary !== undefined && !shouldWarn) {
	      shouldWarn = true;
	    }

	    // Add question to text field
	    if (question) {
	      // Convert all escaped html to text
	      $cleaner.html(question);
	      question = $cleaner.text();

	      // Append text
	      var current = $input.val();
	      if (current !== '') {
	        current += LB;
	      }
	      $input.val(current + question);
	    }
	  };

	  /**
	   * Puts this widget at the end of the given container.
	   *
	   * @public
	   * @param {jQuery} $container
	   */
	  self.appendTo = function ($container) {
	    $input.appendTo($container);
	    if (shouldWarn && !warned) {
	      alert(t('warning'));
	      warned = true;
	    }
	  };

	  /**
	   * Remove this widget from the editor DOM.
	   *
	   * @public
	   */
	  self.remove = function () {
	    $input.remove();
	  };
	};

	exports.default = QuestionSetTextualEditor;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var TextParser = function () {
	  /**
	   * Creates a text input widget for editing question sets
	   * @constructor
	   * @class
	   *
	   * @param {string} multiChoiceLibrary The multichoice library to use
	   */
	  function TextParser(multiChoiceLibrary) {
	    _classCallCheck(this, TextParser);

	    this.multiChoiceLibrary = multiChoiceLibrary;
	    // Used to convert HTML to text and vice versa
	    this.$cleaner = H5P.jQuery('<div/>');
	  }

	  /**
	   * Parses text to objects
	   *
	   * @param {String} text
	   * @public
	   * @return {MultiChoiceQuestion[]}
	   */


	  _createClass(TextParser, [{
	    key: 'parse',
	    value: function parse(text) {
	      return this.parseTextLines(text.split('\n'));
	    }

	    /**
	     * Parses text lines to objects
	     *
	     * @param {String[]} textLines
	     * @private
	     * @return {MultiChoiceQuestion[]}
	     */

	  }, {
	    key: 'parseTextLines',
	    value: function parseTextLines(textLines) {
	      return textLines.reduce(this.parseTextLine.bind(this), []).map(this.finalizeQuestion);
	    }

	    /**
	     * Parse a single line
	     *
	     * @param {MultiChoiceQuestion[]} questions
	     * @param {String} textLine
	     * @param {Number} index
	     * @param {String[]} arr
	     * @private
	     * @return {MultiChoiceQuestion[]}
	     */

	  }, {
	    key: 'parseTextLine',
	    value: function parseTextLine(questions, textLine, index, arr) {
	      if (!this.isBlankLine(textLine)) {
	        if (this.isQuestion(arr, index)) {
	          questions.push(this.parseQuestion(textLine));
	        } else {
	          // answer
	          var question = questions[questions.length - 1];
	          var answer = this.parseAnswer(textLine);
	          question.params.answers.push(answer);
	        }
	      }

	      return questions;
	    }

	    /**
	     * Parse a String to a question
	     *
	     * @param {String} textLine
	     * @private
	     * @return {MultiChoiceQuestion}
	     */

	  }, {
	    key: 'parseQuestion',
	    value: function parseQuestion(textLine) {
	      /**
	       * @typedef {Object} MultiChoiceQuestion
	       * @property {String} library
	       * @property {Object} params
	       * @property {String} params.question
	       * @property {MultiChoiceAnswer[]} params.answers
	       * @property {Boolean} params.behaviour.singleAnswer
	       */
	      return {
	        library: this.multiChoiceLibrary,
	        params: {
	          question: this.cleanTextLine(textLine),
	          answers: [],
	          behaviour: {
	            singleAnswer: true
	          }
	        }
	      };
	    }

	    /**
	     * Parse a String to an answer
	     *
	     * @param {String} textLine
	     * @private
	     * @return {MultiChoiceAnswer}
	     */

	  }, {
	    key: 'parseAnswer',
	    value: function parseAnswer(textLine) {
	      var parts = this.splitAnswerString(this.cleanTextLine(textLine));
	      var text = this.trim(parts[0]);

	      /**
	       * @typedef {Object} MultiChoiceAnswer
	       * @property {String} text
	       * @property {Boolean} correct
	       * @property {String} tipsAndFeedback.tip
	       * @property {String} tipsAndFeedback.chosenFeedback
	       * @property {String} tipsAndFeedback.notChosenFeedback
	       */
	      return {
	        text: this.removeLeadingAsterisk(text),
	        correct: this.hasLeadingAsterisk(text),
	        tipsAndFeedback: {
	          tip: this.trim(parts[1]),
	          chosenFeedback: this.trim(parts[2]),
	          notChosenFeedback: this.trim(parts[3])
	        }
	      };
	    }

	    /**
	     * Trims a String if it's not undefined
	     *
	     * @param {String} str
	     * @private
	     * @return {string}
	     */

	  }, {
	    key: 'trim',
	    value: function trim(str) {
	      if (str !== undefined && str.length > 0) {
	        return str.trim();
	      }
	    }

	    /**
	     * Adds a boolean to behaviour saying if the question expects a single answer (or multipe).
	     *
	     * @param {MultiChoiceQuestion} question
	     * @private
	     * @return {MultiChoiceQuestion}
	     */

	  }, {
	    key: 'finalizeQuestion',
	    value: function finalizeQuestion(question) {
	      var corrects = question.params.answers.reduce(function (answer) {
	        return answer.correct ? 1 : 0;
	      }, 0);
	      question.params.behaviour.singleAnswer = corrects <= 1;
	      return question;
	    }

	    /**
	     * Is a String a blank line
	     *
	     * @param {String} textLine
	     * @private
	     * @return {boolean}
	     */

	  }, {
	    key: 'isBlankLine',
	    value: function isBlankLine(textLine) {
	      return textLine !== undefined && textLine.length === 0;
	    }

	    /**
	     * Is a array entry a question. Returns true if first line,
	     * or the line before was blank
	     *
	     * @param {String[]} arr
	     * @param {Number} index
	     * @private
	     * @return {boolean}
	     */

	  }, {
	    key: 'isQuestion',
	    value: function isQuestion(arr, index) {
	      return index === 0 || this.isBlankLine(arr[index - 1]);
	    }

	    /**
	     * Remove Html elements from a string
	     *
	     * @param {String} str
	     * @private
	     * @return {String}
	     */

	  }, {
	    key: 'cleanTextLine',
	    value: function cleanTextLine(str) {
	      return this.$cleaner.text(str).html();
	    }

	    /**
	     * Removes a leading asterisk if it exists
	     *
	     * @param {string} str
	     * @private
	     * @return {string}
	     */

	  }, {
	    key: 'removeLeadingAsterisk',
	    value: function removeLeadingAsterisk(str) {
	      if (this.hasLeadingAsterisk(str)) {
	        return str.trim().substr(1, str.length);
	      } else {
	        return str;
	      }
	    }

	    /**
	     * Returns true if a String has a leading asterisk
	     *
	     * @param {string} str
	     * @private
	     * @return {boolean}
	     */

	  }, {
	    key: 'hasLeadingAsterisk',
	    value: function hasLeadingAsterisk(str) {
	      return str != undefined && str.substr(0, 1) === '*';
	    }

	    /**
	     * Cleans and splits an answer string, using the ':'-delimiter.
	     *
	     * @param {String} str
	     * @private
	     * @return {String[]}
	     */

	  }, {
	    key: 'splitAnswerString',
	    value: function splitAnswerString(str) {
	      return str.replace(/\\:/g, '¤').split(':', 4);
	    }
	  }]);

	  return TextParser;
	}();

	exports.default = TextParser;

/***/ })
/******/ ]);