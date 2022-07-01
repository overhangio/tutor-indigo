var H5P = H5P || {};
H5P.Flashcards = H5P.Flashcards || {};

/**
 * Flashcards xAPI generator
 *
 * @type {Object}
 */
H5P.Flashcards.xapiGenerator = (function ($) {
  const placeHolder = '__________';

  const getXapiEvent = function (instance) {
    const xAPIEvent = instance.createXAPIEventTemplate('answered');

    const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    $.extend(definition, getxAPIDefinition(instance));

    xAPIEvent.setScoredResult(
      instance.getScore(),
      instance.getMaxScore(),
      instance
    );

    xAPIEvent.data.statement.result.response = instance.answers.join('[,]');
    return xAPIEvent;
  };

  const getxAPIDefinition = function (instance) {
    const definition = {};
    definition.description = {
      'en-US': '<p>' + instance.options.description + '</p>'
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'fill-in';
    definition.correctResponsesPattern = [
      '{case_matters=' + instance.options.caseSensitive + '}'
    ];
    const crpAnswers = instance.options.cards.map(function (card) {
      return card.answer;
    }).join('[,]');

    definition.correctResponsesPattern[0] += crpAnswers;

    const cardDescriptions = instance.options.cards.map(function (card) {
      return '<p>' + card.text + ' ' + placeHolder + '</p>';
    }).join('');

    definition.description['en-US'] += cardDescriptions;
    return definition;
  };

  return {
    getXapiEvent: getXapiEvent,
  };
})(H5P.jQuery);