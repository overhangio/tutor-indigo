/** @namespace H5PUpgrades */
var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.AdventCalendar'] = (function () {
  return {
    0: {
      2: function (parameters, finished, extras) {
        parameters.a11y = parameters.a11y || {};

        parameters.a11y.mute = (parameters.l10n && parameters.l10n.mute) ? parameters.l10n.mute : 'Mute audio';
        parameters.a11y.unmute = (parameters.l10n && parameters.l10n.unmute) ? parameters.l10n.unmute : 'Unmute audio';
        parameters.a11y.closeWindow = (parameters.l10n && parameters.l10n.closeWindow) ? parameters.l10n.closeWindow : 'Close window';

        delete parameters.l10n;

        finished(null, parameters, extras);
      }
    }
  };
})();
