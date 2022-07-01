var H5P = H5P || {};

/**
 * Text Input Field module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.TextInputField = (function ($) {
  // CSS Classes:
  var MAIN_CONTAINER = 'h5p-text-input-field';
  var INPUT_LABEL = 'h5p-text-input-field-label';
  var INPUT_FIELD = 'h5p-text-input-field-textfield';
  var WRAPPER_MESSAGE = 'h5p-text-input-field-message-wrapper';
  var CHAR_MESSAGE = 'h5p-text-input-field-message-char';

  var ariaId = 0;

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {Object} TextInputField TextInputField instance
   */
  function TextInputField(params, id, contentData) {
    this.$ = $(this);
    this.id = id;
    this.contentData = contentData;

    // Set default behavior.
    this.params = $.extend({}, {
      taskDescription: 'Input field',
      placeholderText: '',
      inputFieldSize: '1',
      requiredField: false
    }, params);

    // Sanitize the task description as it comes in HTML
    this.XAPIGenerator = new H5P.TextInputField.XAPIGenerator(this.params.taskDescription.replace(/^\s+|\s+$/g, '').replace(/(<p>|<\/p>)/img, ""));

    // Set the maximum length for the textarea
    this.maxTextLength = (typeof this.params.maximumLength === 'undefined') ? '' : parseInt(this.params.maximumLength, 10);

    // Get previous state
    if (this.contentData !== undefined && this.contentData.previousState !== undefined) {
      this.previousState = this.contentData.previousState;
    }

    ariaId++;
  }

  /**
   * Attach function called by H5P framework to insert H5P content into page.
   *
   * @param {jQuery} $container The container which will be appended to.
   */
  TextInputField.prototype.attach = function ($container) {
    var self = this;
    this.$inner = $container.addClass(MAIN_CONTAINER);

    this.$taskDescription = $('<div>', {
      id: ariaId,
      'class': INPUT_LABEL + (this.params.requiredField ? ' required' : ''),
      'html': self.params.taskDescription
    }).appendTo(self.$inner);

    this.$inputField = $('<textarea>', {
      'class': INPUT_FIELD,
      'rows': parseInt(self.params.inputFieldSize, 10),
      'maxlength': self.maxTextLength,
      'placeholder': self.params.placeholderText,
      'tabindex': '0',
      'aria-required': this.params.requiredField,
      'aria-labelledby': ariaId
    }).appendTo(self.$inner);

    // set state from previous one
    this.setState(this.previousState);

    var $wrapperMessage = $('<div>', {'class': WRAPPER_MESSAGE}).appendTo(self.$inner);
    this.$charMessage = $('<div>', {'class': CHAR_MESSAGE}).appendTo($wrapperMessage);
    this.$inputField.on('change keyup paste', function () {
      if (self.params.maximumLength !== undefined) {
        self.$charMessage.html(self.params.remainingChars.replace(/@chars/g, self.computeRemainingChars()));
      }
    });

    this.$inputField.blur(function () {
      var xApiTemplate = self.createXAPIEventTemplate('interacted');
      var xApiEvent = self.XAPIGenerator.generateXApi(xApiTemplate, self.$inputField.val());
      self.trigger(xApiEvent);
    });

    this.$inputField.trigger('change');
  };

  /**
   * Returns true if input field is not required or non-empty
   * @returns {boolean} True if input field is filled or not required
   */
  TextInputField.prototype.isRequiredInputFilled = function () {
    if (!this.params.requiredField) {
      return true;
    }

    if (this.params.requiredField && this.$inputField.val().length) {
      return true;
    }

    return false;
  };

  /**
   * Retrieves the text input field
   * @returns {description:string, value:string} Returns input field
   */
  TextInputField.prototype.getInput = function () {
    // Strip away HTML from description:
    var descriptionDoc = new DOMParser().parseFromString(this.params.taskDescription, 'text/html');
    var description = (descriptionDoc.body && descriptionDoc.body.textContent) ? descriptionDoc.body.textContent : '';

    // Remove trailing newlines
    var cleanedTaskDescription = description
      .replace(/^\s+|\s+$/g, '')
      .replace(/(<p>|<\/p>)/img, "");

    // Escape html
    var descriptionElement = document.createElement('div');
    descriptionElement.textContent = cleanedTaskDescription;

    return {
      description: descriptionElement.innerHTML,
      value: this.$inputField.val()
    };
  };

  /**
   * Get current state for H5P.Question.
   * @return {object} Current state.
   */
  TextInputField.prototype.getCurrentState = function () {
    // We could have just uses a string, but you never know when you need to store more parameters
    return {
      'inputField': this.$inputField.val()
    };
  };

  /**
   * Set state from previous state.
   * @param {object} previousState - PreviousState.
   */
  TextInputField.prototype.setState = function (previousState) {
    var self = this;

    if (previousState === undefined) {
      return;
    }
    if (typeof previousState === 'object' && !Array.isArray(previousState)) {
      self.$inputField.html(previousState.inputField || '');
    }
  };

  /**
   * Mark field if empty until it's filled.
   */
  TextInputField.prototype.markEmptyField = function () {
    const self = this;

    if (this.$inputField.val().length === 0) {
      this.$inputField.addClass('required-input');
    }
    this.$inputField.one('input', function () {
      self.$inputField.removeClass('required-input');
    });
  };

  /**
   * Compute the remaining number of characters
   * @returns {number} Returns number of characters left
   */
  TextInputField.prototype.computeRemainingChars = function () {
    return this.maxTextLength - this.$inputField.val().length;
  };

  /**
   * Triggers an 'answered' xAPI event for all inputs
   */
  TextInputField.prototype.triggerAnsweredEvent = function  () {
    var xApiTemplate = this.createXAPIEventTemplate('answered');
    var xApiEvent = this.XAPIGenerator.generateXApi(xApiTemplate, this.getCurrentState().inputField);
    this.trigger(xApiEvent);
  };

  /**
   * Get xAPI data.
   * Contract used by report rendering engine.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  TextInputField.prototype.getXAPIData = function () {
    var xApiTemplate = this.createXAPIEventTemplate('answered');
    var xApiEvent = this.XAPIGenerator.generateXApi(xApiTemplate, this.getCurrentState().inputField);
    return {
      statement: xApiEvent.data.statement
    };
  };

  return TextInputField;
}(H5P.jQuery));
