/*global H5P*/
var H5PEditor = H5PEditor || {};

/**
 * Interactive Video editor widget module
 *
 * @param {jQuery} $
 */
H5PEditor.widgets.impressPresentationEditor = H5PEditor.ImpressPresentationEditor = (function ($, JoubelUI, FreeTransform) {

  /**
   * Initialize interactive video editor.
   *
   * @returns {ImpressPresentationEditor}
   */
  function ImpressPresentationEditor(parent, field, params, setValue) {
    var self = this;

    self.defaults = {
      action: {},
      backgroundGroup: {
        transparentBackground: true,
        backgroundColor: 'fff',
        backgroundWidth: 640,
        backgroundHeight: 360
      },
      positioning: {
        centerText: true,
        y: 0,
        x: 0,
        z: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        absoluteRotation: 0
      },
      ordering: {
        includeInPath: true
      }
    };

    // Set default params
    if (params === undefined) {
      params = {
        perspectiveRatio: 1,
        views: [
          self.defaults
        ]
      };
      setValue(field, params);

      self.emptyParams = true;
    }

    self.parent = parent;
    self.field = field;
    self.setValue = setValue;
    self.params = params;
    self.editModes = {
      move: false,
      rotate: false,
      transform: false
    };

    /**
     * Editing slide index
     *
     * @type {number}
     */
    self.editingStepId = 0;

    /**
     * Keeps track of semantic fields for parameters
     *
     * @type {void|*}
     */
    self.semanticsList = $.extend(true, [], self.field.fields[0].field);

    /**
     * Editor wrapper
     *
     * @type {H5P.jQuery}
     */
    self.$wrapper = $(
      '<div class="impress-editor-wrapper">' +
        '<div class="impress-presentation-preview"></div>' +
        '<div class="impress-presentation-buttonbar"></div>' +
        '<div class="impress-presentation-step-dialog"></div>' +
      '</div>'
    );

    /**
     * Preview container
     *
     * @type {jQuery}
     */
    self.$preview = $('.impress-presentation-preview', self.$wrapper);

    /**
     * Button bar
     *
     * @type {jQuery}
     */
    self.$buttonBar = $('.impress-presentation-buttonbar', self.$wrapper);

    /**
     * Step dialog
     *
     * @type {jQuery}
     */
    self.$stepDialog = $('.impress-presentation-step-dialog', self.$wrapper);
    self.createStepDialog(self.$stepDialog);

    // Make sure widget can pass readies (used when processing semantics)
    self.passReadies = true;
    self.parent.ready(function () {
      self.passReadies = false;
    });

    self.resize();

    // Create preview
    self.createPreview();

    // Create example content if no params
    if (self.emptyParams) {
      var firstStep = self.IP.getStep(0);
      firstStep.createExampleContent(self.field.fields[0].field.fields[0].options)
        .setName(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'step', {}) + ' ' + firstStep.getId());
      self.updateActiveStepDisplay(firstStep.getName());
      self.params.views[0] = self.IP.getStep(0).getParams();
    }

    // Enable free transform of steps
    self.freeTransform = new FreeTransform(self.IP, self);
  }

  /**
   * Create step dialog and append it to wrapper
   * @param {jQuery} $wrapper
   */
  ImpressPresentationEditor.prototype.createStepDialog = function ($wrapper) {
    var self = this;

    self.$stepDialogContent = $('<div>', {
      'class': 'h5p-step-dialog-content'
    }).appendTo($wrapper);

    var $stepDialogFooter = $('<div>', {
      'class': 'h5p-step-dialog-footer'
    }).appendTo($wrapper);

    // Create done button
    self.$stepDialogButton = JoubelUI.createButton({
      'class': 'h5p-step-dialog-done',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'done', {})
    }).appendTo($stepDialogFooter);
  };

  /**
   * Create preview of Impressive Presentation
   */
  ImpressPresentationEditor.prototype.createPreview = function () {
    var self = this;
    self.IP = new H5P.ImpressPresentation({viewsGroup: self.params}, H5PEditor.contentId, {disableNavLine: true});

    // Reference IP params to only update params one place
    self.params.views = self.IP.params.viewsGroup.views;
    self.createStepSelector();
    self.createActiveStepDisplay();

    self.IP.on('createdStep', function (e) {
      var step = e.data;
      step.disableContentInteraction();
      self.addStepToSelector(step);

      // Listen for library (re)creation in Step
      step.on('createdLibraryElement', function () {
        step.disableContentInteraction();
      });

      self.registerEnterStepListener(step);
    });

    self.IP.attach(self.$preview);
    self.editingStepId = self.getUniqueId(self.IP.$jmpress.jmpress('active'));
  };

  ImpressPresentationEditor.prototype.setPerspectiveRatio = function () {
    var self = this;
    self.params.perspectiveRatio = self.$preview.width() / 1000;
    self.IP.params.viewsGroup.perspectiveRatio = self.params.perspectiveRatio;
    self.IP.resize();
  };

  /**
   * Append preview to container
   * @param {$} $wrapper
   */
  ImpressPresentationEditor.prototype.appendTo = function ($wrapper) {
    var self = this;
    self.$inner = $wrapper;
    self.createSemantics();
    self.$wrapper.appendTo($wrapper);
    self.setPerspectiveRatio();

    // Create buttons
    self.createButtons(self.$buttonBar);

    self.resize();
  };

  ImpressPresentationEditor.prototype.createButtons = function ($buttonBar) {
    var self = this;
    var $topButtonRow = self.createTopButtonRow($buttonBar);
    var $bottomButtonRow = self.createBottomButtonRow($buttonBar);

    var $coreButtonBar = self.createCoreButtonBar().appendTo($bottomButtonRow);
    var $transformButtonBar = self.createTransformButtonBar().appendTo($bottomButtonRow);
    var $orderingButtonBar = self.createOrderingButtonBar().appendTo($bottomButtonRow);

    var setActiveButton = function ($button) {
      $coreMenuButton.removeClass('active');
      $transformMenuButton.removeClass('active');
      $orderingMenuButton.removeClass('active');
      $backgroundMenuButton.removeClass('active');
      $editContentMenuButton.removeClass('active');
      $button.addClass('active');
    };

    var showSubMenuBar = function ($subMenu) {
      $coreButtonBar.removeClass('show');
      $transformButtonBar.removeClass('show');
      $orderingButtonBar.removeClass('show');
      $subMenu.addClass('show');
    };

    // Create selector for selecting which step we are on.
    var $leftAlignedMenu = $('<div>', {
      'class': 'h5p-left-aligned-main-menu'
    }).appendTo($topButtonRow);

    self.createStepSelectorWidget()
      .appendTo($leftAlignedMenu);

    self.createActiveStepDisplayWidget()
      .appendTo($leftAlignedMenu);

    self.createModeDisplay()
      .appendTo($leftAlignedMenu);

    var $rightAlignedMenu = $('<div>', {
      'class': 'h5p-right-aligned-submenu'
    }).appendTo($topButtonRow);

    var coreTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'coreMenu', {});
    var $coreMenuButton =JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-core-menu-button active',
      'title': coreTitle
    }).click(function () {
      setActiveButton($(this));
      showSubMenuBar($coreButtonBar);
      self.IP.refocusView();
    }).appendTo($rightAlignedMenu);

    var transformTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'transformMenu', {});
    var $transformMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-transform-menu-button',
      'title': transformTitle
    }).click(function () {
      setActiveButton($(this));
      showSubMenuBar($transformButtonBar);
      self.IP.refocusView();
    }).appendTo($rightAlignedMenu);

    var orderingTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'orderingMenu', {});
    var $orderingMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-ordering-menu-button',
      'title': orderingTitle
    }).click(function () {
      setActiveButton($(this));
      showSubMenuBar($orderingButtonBar);
      self.IP.refocusView();
    }).appendTo($rightAlignedMenu);

    var backgroundTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'background', {});
    var $backgroundMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-background-menu-button',
      'title': backgroundTitle
    }).click(function () {
      self.editStepBackground();
    }).appendTo($rightAlignedMenu);

    var editTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'edit', {});
    var $editContentMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-edit-content-menu-button',
      'title': editTitle
    }).click(function () {
      self.editStepContent();
    }).appendTo($rightAlignedMenu);

  };

  ImpressPresentationEditor.prototype.createTopButtonRow = function ($buttonBar) {
    return $('<div>', {
      'class': 'h5p-buttonbar-top-row'
    }).appendTo($buttonBar);
  };

  ImpressPresentationEditor.prototype.createBottomButtonRow = function ($buttonBar) {
    return $('<div>', {
      'class': 'h5p-buttonbar-bottom-row'
    }).appendTo($buttonBar);
  };

  ImpressPresentationEditor.prototype.createRouteListWidget = function () {
    var self = this;

    var $sortRouteListButton = JoubelUI.createButton({
      'class': 'h5p-bottom-button',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'orderSteps', {})
    }).click(function () {
      self.editStepOrdering();
    });

    self.$routeListDialog = $('<div>', {
      'class': 'h5p-route-list-dialog'
    });

    // Help text
    $('<div>', {
      'class': 'h5p-route-list-help-text',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'routeListText', {})
    }).appendTo(self.$routeListDialog);

    var $routeList = $('<ul>', {
      'class': 'h5p-route-list'
    }).appendTo(self.$routeListDialog);

    self.sortable = Sortable.create($routeList.get(0));
    self.$routeList = $routeList;

    return $sortRouteListButton;
  };

  /**
   * Update route list to array

   * @param {Array} array
   */
  ImpressPresentationEditor.prototype.updateRouteList = function (array) {
    var self = this;

    self.$routeList.children().remove();
    var route = array;

    // Only 1 item
    if (array[0] === array[1]) {
      route = array.splice(1, 1);
    }

    if (route && route.length) {
      var i;
      for (i = 0; i < route.length; i++) {

        // Add list element
        var stepId = self.getUniqueId(self.IP.$jmpress.find((route[i])));
        var step = self.IP.getStep(stepId);
        $('<li>', {
          'class': 'h5p-route-list-element',
          'html': step.getName()
        }).hover(function () {
          $(this).addClass('hover');
        }, function () {
          $(this).removeClass('hover');
        }).appendTo(self.$routeList);
      }
    }
  };

  ImpressPresentationEditor.prototype.editStepOrdering = function () {
    var self = this;

    self.updateRouteList(self.IP.route);

    // Hide jmpress
    self.IP.$jmpress.addClass('hide');

    // Show library form
    self.$routeListDialog.appendTo(self.$stepDialogContent);
    self.$stepDialog.addClass('show');

    // Create done button
    self.$stepDialogButton.unbind('click').click(function () {
      self.doneStepOrdering();
    });
  };

  /**
   * Done editing step ordering, remove form.
   */
  ImpressPresentationEditor.prototype.doneStepOrdering = function () {
    var self = this;

    // Recreate route
    self.IP.route = [];

    // Update route with new order
    var $routeElements = self.$routeList.children();
    $routeElements.each(function () {
      var stepName = $(this).html();
      var i;
      for (i = 0; i < self.IP.steps.length; i++) {
        var step = self.IP.steps[i];
        if (step.getName() === stepName) {
          self.IP.route.push('#' + H5P.ImpressPresentation.ID_PREFIX + step.getId());
          break;
        }
      }
    });

    self.IP.updateRoute();

    // Hide library form
    self.$routeListDialog.detach();
    self.$stepDialog.removeClass('show');

    // Show jmpress
    self.IP.$jmpress.removeClass('hide');

    self.IP.refocusView();
  };

  ImpressPresentationEditor.prototype.createOrderingButtonBar = function () {
    var self = this;

    var $orderingButtonBar = $('<div>', {
      'class': 'h5p-buttonbar-sub-menu'
    });

    // Create route check box
    self.createRouteCheckbox()
      .appendTo($orderingButtonBar);

    // Create sortable route list.
    self.createRouteListWidget(self.IP.route)
      .appendTo($orderingButtonBar);

    return $orderingButtonBar;
  };

  ImpressPresentationEditor.prototype.createTransformButtonBar = function () {
    var self = this;

    var $transformButtonBar = $('<div>', {
      'class': 'h5p-buttonbar-sub-menu'
    });

    var toggleButtonState = function ($modeButton, enable) {
      $moveModeButton.removeClass('active');
      $rotateModeButton.removeClass('active');
      $transformModeButton.removeClass('active');
      if (enable) {
        $modeButton.addClass('active');
      }
    };

    var $moveModeButton = JoubelUI.createButton({
      'class': 'h5p-bottom-button',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'moveStep', {})
    }).click(function () {
      var enabled = self.toggleMode(ImpressPresentationEditor.MOVE);
      toggleButtonState($(this), enabled);
      self.IP.refocusView();
    }).appendTo($transformButtonBar);

    var $rotateModeButton = JoubelUI.createButton({
      'class': 'h5p-bottom-button',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'rotateStep', {})
    }).click(function () {
      var enabled = self.toggleMode(ImpressPresentationEditor.ROTATE);
      toggleButtonState($(this), enabled);
      self.IP.refocusView();
    }).appendTo($transformButtonBar);

    var $transformModeButton = JoubelUI.createButton({
      'class': 'h5p-bottom-button',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'transformStep', {})
    }).click(function () {
      var enabled = self.toggleMode(ImpressPresentationEditor.TRANSFORM);
      toggleButtonState($(this), enabled);
      self.IP.refocusView();
    }).appendTo($transformButtonBar);

    return $transformButtonBar;
  };

  ImpressPresentationEditor.prototype.createCoreButtonBar = function () {
    var self = this;

    var $coreButtonBar = $('<div>', {
      'class': 'h5p-buttonbar-sub-menu show'
    });

    // Add step dynamically
    JoubelUI.createButton({
      'class': 'h5p-bottom-button',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'add', {})
    }).click(function () {
      self.addStep();
      self.IP.refocusView();
      return false;
    }).appendTo($coreButtonBar);

    // Remove step dynamically
    JoubelUI.createButton({
      'class': 'h5p-bottom-button',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'remove', {})
    }).click(function () {
      self.removeStep();
      self.IP.refocusView();
      return false;
    }).appendTo($coreButtonBar);

    return $coreButtonBar;
  };

  ImpressPresentationEditor.prototype.editStepBackground = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingStepId);

    // Hide jmpress
    self.IP.$jmpress.addClass('hide');

    // Show library form
    step.getBackgroundForm().appendTo(self.$stepDialogContent);
    self.$stepDialog.addClass('show');

    // Change done button
    self.$stepDialogButton.unbind('click')
      .click(function () {
        var valid = true;
        step.children.forEach(function (child) {
          if (!child.validate()) {
            valid = false;
          }
        });

        if (valid) {
          step.setBackground(self.IP.contentId);
          self.doneStepBackground(step);
        }
      });
  };

  /**
   * Edit step content, show form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.editStepContent = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingStepId);

    // Hide jmpress
    self.IP.$jmpress.addClass('hide');

    // Show library form
    step.getLibraryForm().appendTo(self.$stepDialogContent);
    self.$stepDialog.addClass('show');

    // Change done button
    self.$stepDialogButton.unbind('click')
      .click(function () {
        var valid = true;
        step.children.forEach(function (child) {
          if (!child.validate()) {
            valid = false;
          }
        });

        if (valid) {
          if (H5PEditor.Html) {
            H5PEditor.Html.removeWysiwyg();
          }
          step.updateLibrary();
          self.doneStepContent(step);
        }
      });
  };

  /**
   * Done editing step content, remove form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.doneStepContent = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingStepId);

    // Hide library form
    step.getLibraryForm().detach();
    self.$stepDialog.removeClass('show');

    // Show jmpress
    self.IP.$jmpress.removeClass('hide');

    self.IP.refocusView();
  };

  /**
   * Done editing step background, remove form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.doneStepBackground = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingStepId);

    // Hide library form
    step.getBackgroundForm().detach();
    self.$stepDialog.removeClass('show');

    // Show jmpress
    self.IP.$jmpress.removeClass('hide');

    self.IP.refocusView();
  };

  ImpressPresentationEditor.prototype.createStepSelector = function () {
    var self = this;
    self.$stepSelector = $('<select>', {
      'class': 'h5p-step-selector'
    }).change(function () {
      var stepId = parseInt($(this).val());
      self.updateButtonBar(stepId);
      self.IP.refocusView();
    })
  };

  ImpressPresentationEditor.prototype.createRouteCheckbox = function () {
    var self = this;
    var $routeCheckbox = $('<div>', {
      'class': 'h5p-check-box'
    });

    var $includeInPathLabel = $('<label>', {
      'text': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'include', {})
    }).appendTo($routeCheckbox);

    self.$includeInPathCheckbox = $('<input>', {
      'type': 'checkbox',
      'checked': 'checked'
    }).click(function (e) {
      var step = self.IP.getStep(self.editingStepId);
      var checked = $(this).is(':checked');

      if (checked) {
        self.IP.addToRoute(step.getId());
      }
      else {
        var removed = self.removeFromRoute(step.getId());

        // Did not remove
        if (!removed) {
          e.preventDefault();
          return false;
        }
      }
      step.setRouteState(checked);
      self.IP.updateRoute();
      self.IP.refocusView();
    }).prependTo($includeInPathLabel);

    return $routeCheckbox;
  };

  /**
   * Remove step from route
   *
   * @param {Number} stepId
   * @returns {Boolean} True if step was removed from route
   */
  ImpressPresentationEditor.prototype.removeFromRoute = function (stepId) {
    var self = this;

    // Route must have at least one step
    if (self.IP.getRoute().length <= 1) {
      self.IP.createErrorMessage(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'removeFromPathError', {}));
      return false;
    }

    self.IP.removeFromRoute(stepId);
    return true;
  };

  /**
   * Update route checkbox with step params
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.updateRouteCheckbox = function (step) {
    var self = this;
    self.$includeInPathCheckbox.prop('checked', step.getRouteState());
  };

  ImpressPresentationEditor.prototype.updateButtonBar = function (stepId) {
    var self = this;
    self.$stepSelector.val(stepId);
    self.editingStepId = stepId;
    self.updateRouteCheckbox(self.IP.getStep(stepId));
  };

  ImpressPresentationEditor.prototype.createActiveStepDisplay = function () {
    var self = this;
    self.$activeStepDisplay = $('<input>', {
      'class': 'h5p-active-step-display',
      'maxlength': 15
    }).change(function () {
      self.updateActiveStepDisplay($(this).val());
    }).val(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'step', {}) + ' 0');
  };

  ImpressPresentationEditor.prototype.updateActiveStepDisplay = function (newName) {
    var self = this;
    var $activeStep = self.IP.$jmpress.jmpress('active');
    var activeStepId = self.getUniqueId($activeStep);
    var activeStep = self.IP.getStep(activeStepId);
    activeStep.setName(newName);
    self.updateStepInSelector(activeStep);
    self.setActiveStepDisplay(activeStep);
  };

  ImpressPresentationEditor.prototype.createActiveStepDisplayWidget = function () {
    var self = this;

    // Wrapper
    var $activeStepDisplayWrapper = $('<div>', {
      'class': 'h5p-active-step-wrapper'
    });

    // Title
    $('<div>', {
      'class': 'h5p-active-step-title',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'activeStep', {})
    }).appendTo($activeStepDisplayWrapper);

    // Display the active step
    self.$activeStepDisplay.appendTo($activeStepDisplayWrapper);

    return $activeStepDisplayWrapper;
  };

  ImpressPresentationEditor.prototype.setActiveStepDisplay = function (step) {
    var self = this;
    var stepName = step.getName();
    self.$activeStepDisplay.val(stepName);
  };

  ImpressPresentationEditor.prototype.createModeDisplay = function () {
    var self = this;
    var $modeContainer = $('<div>', {
      'class': 'h5p-mode-container hide'
    });

    $('<div>', {
      'class': 'h5p-mode-title',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'mode', {})
    }).appendTo($modeContainer);

    self.$activeMode = $('<div>', {
      'class': 'h5p-mode-active'
    }).appendTo($modeContainer);

    self.$modeContainer = $modeContainer;

    return $modeContainer;
  };

  ImpressPresentationEditor.prototype.createStepSelectorWidget = function () {
    var self = this;

    // Wrapper
    var $selectorContainer = $('<div>', {
      'class': 'h5p-select-container'
    });

    // Title
    $('<div>', {
      'class': 'h5p-select-title',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'editingStep', {})
    }).appendTo($selectorContainer);

    // Add selector
    self.$stepSelector.appendTo($selectorContainer);

    /**
     * Go to selected slide button
     */
    var goToTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'goTo', {});
    JoubelUI.createButton({
      'class': 'h5p-select-go-to',
      'title': goToTitle
    }).click(function () {
      self.IP.$jmpress.jmpress('goTo', '#' + H5P.ImpressPresentation.ID_PREFIX + self.editingStepId);
      self.IP.refocusView();
    }).appendTo($selectorContainer);

    return $selectorContainer;
  };

  /**
   * Update step name in selector.
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.updateStepInSelector = function (step) {
    var self = this;
    var stepId = step.getId();
    self.$stepSelector.find('option[value=' + stepId + ']')
      .each(function () {
        $(this).text(step.getName());
      });
  };

  /**
   * Add step to selector
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.addStepToSelector = function (step) {
    var self = this;

    var idx = step.getId();
    var $option = $('<option>', {
      value: idx
    }).text(step.getName());
    self.$stepSelector.append($option);
  };

  ImpressPresentationEditor.prototype.removeStepFromSelector = function (step) {
    var self = this;
    var stepId = step.getId();
    self.$stepSelector.children().each(function () {
      if (parseInt($(this).val()) === stepId) {
        $(this).remove();
      }
    });

    // Update editing slide in case we were editing this step.
    self.$stepSelector.change();
  };

  /**
   * Register listener for when entering steps
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.registerEnterStepListener = function (step) {
    var self = this;
    var $step = step.getElement();
    $step.on('enterStep', function () {
      self.setActiveStepDisplay(step);
    });
  };

  /**
   * Collect functions to execute once the tree is complete.
   *
   * @param {function} ready
   * @returns {undefined}
   */
  ImpressPresentationEditor.prototype.ready = function (ready) {
    var self = this;
    if (self.passReadies) {
      self.parent.ready(ready);
    } else {
      self.readies.push(ready);
    }
  };

  /**
   * Update semantics.
   */
  ImpressPresentationEditor.prototype.updateSemantics = function () {
    var self = this;
    self.createSemantics();
  };

  /**
   * Create semantics.
   */
  ImpressPresentationEditor.prototype.createSemantics = function () {
    var self = this;

    // semantics holder
    self.IP.steps.forEach(function (step) {
      self.createLibrarySemantics(step);
      self.createBackgroundSemantics(step);
    });
  };

  /**
   * Create background semantics
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.createBackgroundSemantics = function (step) {
    var self = this;
    var $libraryInstance = $('<div>', {
      'class': 'h5p-semantics-instance'
    });

    H5PEditor.processSemanticsChunk(self.semanticsList.fields[2].fields, step.getParams().backgroundGroup, $libraryInstance, self);

    step.setBackgroundForm($libraryInstance);

    // Store children on step
    step.children = step.children.concat(self.children);
    self.children = undefined;
  };

  /**
   * Create library semantics
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.createLibrarySemantics = function (step) {
    var self = this;
    var $libraryInstance = self.createSemanticsFields('action', step, self.semanticsList.fields);

    step.setLibraryForm($libraryInstance);

    // Store children on step
    if (!step.children.length) {
      step.children = [];
    }
    step.children = step.children.concat(self.children);
    self.children = undefined;
  };

  var findPropertyField = function (property, semanticsList) {
    var actionField = [];

    semanticsList.forEach(function (semanticField) {
      if (semanticField.name === property) {
        actionField.push(semanticField);
      }
    });

    return actionField;
  };

  /**
   * Create semantic fields for step.
   * @param {String} property semantics property
   * @param {Object} step parameters for step containing property
   * @param {Object} semanticsList semantic field list containing property
   */
  ImpressPresentationEditor.prototype.createSemanticsFields = function (property, step, semanticsList) {
    var self = this;
    var actionField = findPropertyField(property, semanticsList);

    var $semanticsInstance = $('<div>', {
      'class': 'h5p-semantics-instance'
    });

    // Only process semantics field if found
    if (actionField.length) {
      H5PEditor.processSemanticsChunk(actionField, step.getParams(), $semanticsInstance, self);
    }

    return $semanticsInstance;
  };

  /**
   * Resize area used for Impressive Presentation preview
   */
  ImpressPresentationEditor.prototype.resize = function () {
    var self = this;
    var containerWidth = self.$preview.width();
    var containerHeight = (containerWidth * 9) / 16;

    // Set container height, width already 100%
    self.$preview.height(containerHeight);
    if (self.IP) {
      H5P.trigger(self.IP, 'resize');
    }
  };

  /**
   * Add new step at active step position and go to new step.
   */
  ImpressPresentationEditor.prototype.addStep = function () {
    var self = this;

    // Initialize new step at the position of active step
    var $activeStep = self.IP.$jmpress.jmpress('active');
    var activeStepId = self.getUniqueId($activeStep);
    var activeStepParams = self.IP.getStep(activeStepId).getParams();
    var newStepParams = $.extend(true, {}, this.defaults);
    $.extend(true, newStepParams.positioning, activeStepParams.positioning);

    // Create step, example content and activate it
    var newStep = self.IP.createStep(newStepParams, true, activeStepId)
      .createExampleContent(self.field.fields[0].field.fields[0].options)
      .activateStep(self.IP.$jmpress);

    newStep.setName(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'step', {}) + ' ' + newStep.getId());

    self.IP.updateRoute();

    // Redraw semantics
    self.createLibrarySemantics(newStep);
    self.createBackgroundSemantics(newStep);
    var newStepId = newStep.getId();

    // Set step as current
    self.IP.$jmpress.jmpress('goTo', '#' + H5P.ImpressPresentation.ID_PREFIX + newStepId);
    self.updateActiveStepDisplay(newStep.getName());
    self.updateButtonBar(newStepId);
  };

  ImpressPresentationEditor.prototype.removeStep = function () {
    var self = this;

    // Too few steps
    if (self.IP.getStepCount() <= 1) {
      self.IP.createErrorMessage(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'removeStepError', {}));
      return;
    }

    if (confirm(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'removeStep', {}))) {
      var editingStep = self.IP.getStep(self.editingStepId);
      var activeStepID = self.getUniqueId(self.IP.$jmpress.jmpress('active'));

      // Move to previous step if on the deleted step
      if (activeStepID === self.editingStepId) {
        self.IP.$jmpress.jmpress('prev');
      }
      editingStep.removeStep(self.IP.$jmpress);
      self.IP.removeStep(editingStep.getId());
      self.removeStepFromSelector(editingStep);
    }
  };

  ImpressPresentationEditor.prototype.getUniqueId = function ($step) {
    var stepId = $step.attr('id');
    var id = stepId.split(H5P.ImpressPresentation.ID_PREFIX);
    return parseInt(id[1]);
  };

  /**
   * Toggle editor mode.
   * @returns {Boolean} Returns new state of mode
   */
  ImpressPresentationEditor.prototype.toggleMode = function (mode) {
    var self = this;
    if (self.editModes[mode]) {
      self.disableMode(mode);
    } else {
      self.enableMode(mode);
    }

    return self.editModes[mode];
  };

  /**
   * Enable free transform mode. Disables click navigation.
   */
  ImpressPresentationEditor.prototype.enableMode = function (mode) {
    var self = this;

    // Disable all modes before enabling new mode
    self.disableAllModes();
    var settings = self.IP.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = false;
    self.editModes[mode] = true;
    self.$activeMode.html(H5PEditor.t('H5PEditor.ImpressPresentationEditor', mode, {}));
    self.$modeContainer.removeClass('hide');
  };

  /**
   * Disable free transform mode.
   */
  ImpressPresentationEditor.prototype.disableMode = function (mode) {
    var self = this;
    self.editModes[mode] = false;
    var settings = self.IP.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = true;
    self.$modeContainer.addClass('hide');
  };

  /**
   * Disable all free transform modes
   */
  ImpressPresentationEditor.prototype.disableAllModes = function () {
    var self = this;

    for (var mode in self.editModes) {
      if (self.editModes.hasOwnProperty(mode)) {
        self.editModes[mode] = false;
      }
    }
    self.$modeContainer.addClass('hide');
    var settings = self.IP.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = true;
  };

  /**
   * Reselct current step, needed for some steps to update.
   */
  ImpressPresentationEditor.prototype.reselectStep = function () {
    var self = this;
    var $activeSlide = self.IP.$jmpress.jmpress('active');
    var activeSlideId = self.getUniqueId($activeSlide);
    if (self.editingStepId === activeSlideId) {
      self.IP.$jmpress.jmpress('select', $activeSlide, 'resize');
    }
  };

  /**
   * Update step by reapplying styles
   * @param {Number} [id]
   */
  ImpressPresentationEditor.prototype.updateStep = function (id) {
    var self = this;
    var $updateStep;
    if (id !== undefined) {
      var step = self.IP.getStep(id);
      $updateStep = step.getElement();
    }
    else {
      $updateStep = self.IP.$jmpress.jmpress('active');
    }

    self.IP.$jmpress.jmpress('reapply', $updateStep);
  };

  ImpressPresentationEditor.prototype.remove = function () {

  };

  ImpressPresentationEditor.prototype.validate = function () {
    var self = this;

    // Register route in semantics
    self.params.route = self.IP.route;

    // Always valid
    return true;
  };

  ImpressPresentationEditor.MOVE = 'move';
  ImpressPresentationEditor.ROTATE = 'rotate';
  ImpressPresentationEditor.TRANSFORM = 'transform';

  return ImpressPresentationEditor;

}(H5P.jQuery, H5P.JoubelUI, H5PEditor.ImpressPresentationEditor.FreeTransform));

// Default english translations
H5PEditor.language['H5PEditor.ImpressPresentationEditor'] = {
  libraryStrings: {
    step: 'Step',
    add: 'Add step',
    remove: 'Delete step',
    moveStep: 'Move step',
    rotateStep: 'Rotate step',
    transformStep: 'Transform step',
    edit: 'Edit step content',
    background: 'Edit step background',
    coreMenu: 'Show core menu',
    transformMenu: 'Show transform menu',
    orderingMenu: 'Show ordering menu',
    goTo: 'Go to step',
    done: 'Done',
    removeStep: 'Are you sure you wish to remove this step?',
    removeStepError: 'You can not have zero steps, create a new step and try again.',
    removeFromPathError: 'You can not have an empty path, add a different step to the path and try again.',
    include: 'Included in path',
    mode: 'Mode:',
    move: 'Move',
    rotate: 'Rotate',
    transform: 'Transform',
    editingStep: 'Editing step:',
    activeStep: 'Active step:',
    orderSteps: 'Order steps',
    routeListText: 'Reorder a step by dragging it to a new place'
  }
};
