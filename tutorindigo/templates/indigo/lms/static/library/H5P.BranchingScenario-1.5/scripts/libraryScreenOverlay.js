H5P.BranchingScenario.LibraryScreenOverlay = (function () {

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
    this.overlay.classList.remove('h5p-hidden');
    window.requestAnimationFrame(() => {
      this.buttonsContainer.classList.remove('h5p-hidden');
      this.hidden = false;

      this.setLibraryTabIndex("-1");

      // Focus last button (assuming proceed)
      Object.values(this.buttons)[Object.keys(this.buttons).length - 1].focus();
    });
  };

  /**
   * Sets the tab index of the library behind the overlay, so that these elements can not
   * visited when the overlay is present and visited when the overlay goes away.
   */
  LibraryScreenOverlay.prototype.setLibraryTabIndex = function (index) {
    const $currentLibraryWrapper = this.parent.currentLibraryWrapper;
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
    if (
      !id && id !== 0 ||
      !label ||
      typeof callback !== 'function' ||
      this.buttons[id]
    ) {
      return null;
    }

    const button = document.createElement('button');
    button.classList.add('transition');
    button.classList.add('h5p-nav-button');
    button.classList.add(`h5p-nav-button-${id}`);
    button.innerText = label;

    button.addEventListener('click', event => {
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
})();
