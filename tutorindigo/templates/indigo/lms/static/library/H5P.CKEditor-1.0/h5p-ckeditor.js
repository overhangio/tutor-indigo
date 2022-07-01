H5P.CKEditor = (function (EventDispatcher, $) {

  var DefaultCKEditorConfig = {
    customConfig: '',
    toolbarGroups: [
      { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
      { name: 'styles', groups: [ 'styles' ] },
      { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
      { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
      { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
      { name: 'forms', groups: [ 'forms' ] },
      { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
      { name: 'colors', groups: [ 'colors' ] },
      { name: 'links', groups: [ 'links' ] },
      { name: 'insert', groups: [ 'insert' ] },
      { name: 'tools', groups: [ 'tools' ] },
      { name: 'others', groups: [ 'others' ] },
      { name: 'about', groups: [ 'about' ] }
    ],
    startupFocus: true,
    width: '100%',
    resize_enabled: false,
    linkShowAdvancedTab: false,
    linkShowTargetTab: false,
    removeButtons: 'Cut,Copy,Paste,Undo,Redo,Anchor,Subscript,Superscript,Font,BulletedList,NumberedList,Outdent,Indent,About'
  };

  // Contains a "global" mapping between editor names and callback functions
  var listeners = {};

  // Have we setup our global CK Editor listener?
  var ckEditorListenerInitialized = false;

  /**
   * Loads the CK Editor dynamically
   * @param  {string}       basePath   The basepath for ckeditor files
   * @param  {string}       editorName The editor name
   * @param  {H5P.CKEditor} instance   The CKEditor instance
   * @return {undefined}
   */
  var loadCKEditor = function (basePath, editorName, instance) {
    listeners[editorName] = instance;

    var loaded = function () {
      // Make sure this is only done once.
      if (!ckEditorListenerInitialized) {
        var listener;
        ckEditorListenerInitialized = true;
        var CKEDITOR = window.CKEDITOR;

        CKEDITOR.verbosity = 0;

        // Make sure contenteditable divs are not automatically made into CKs
        CKEDITOR.disableAutoInline = true;

        // An editor instance is created
        CKEDITOR.on('instanceReady', function(event) {
          listener = listeners[event.editor.name];
          if (listener) {
            listener.trigger('created');
          }
        });

        // An editor instance is destroyed
        CKEDITOR.on('instanceDestroyed', function(event) {
          listener = listeners[event.editor.name];
          if (listener) {
            listener.trigger('destroyed');
          }
        });

        // Listen to dialog definitions
        CKEDITOR.on('dialogDefinition', function(event) {
          var dialogDefinition = event.data.definition;

          // Disable dialog resize
          dialogDefinition.resizable = CKEDITOR.DIALOG_RESIZE_NONE;

          listener = listeners[event.editor.name];
          if (listener) {
            listener.trigger('dialogDefinition', {
              dialog: dialogDefinition.dialog
            });
          }
        });
      }

      instance.trigger('loaded');
    };

    if (window.CKEDITOR) {
      return loaded();
    }

    var script = document.createElement('script');
    script.onload = loaded;
    script.src = basePath + 'ckeditor.js';

    document.body.appendChild(script);
  };

  var DESTROYED = 0;
  var CREATING = 1;
  var CREATED = 2;
  var DESTROYING = 3;

  /**
   * Constructor
   * @param {string} targetId The id of the DOM lement beeing replaced by CK
   * @param {string} languageCode The two letter language code
   * @param {H5P.jQuery} dialogContainer The DOM element the CK editor
   *                                     dialogs should be attached to
   * @param {string} [initialContent] The inital content of CK
   * @param {Object} [config] Configuration options for CK. If not set, the
   *                          DefaultCKEditorConfig will be used
   * @constructor
   */
  function CKEditor(targetId, languageCode, $dialogContainer, initialContent, config) {
    EventDispatcher.call(this);

    var self = this;
    var ckInstance;
    var currentCkEditorDialog;
    var state = DESTROYED;
    var data = initialContent;

    config = config || DefaultCKEditorConfig;
    config.defaultLanguage = config.language = languageCode;

    // CK is ready
    var loaded = function () {
      if (state === CREATING || state === CREATED) {
        return;
      }
      else if (state === DESTROYING) {
        return self.once('destroyed', loaded);
      }

      setState(CREATING);

      // This timeout is needed to get ckeditor work in dialogs in IV. CKEDITOR
      // does not find the DOM element without this.
      setTimeout(function () {
        var $target = $('#' + targetId);

        // Abort if target is gone
        if(!$target.is(':visible')) {
          return setState(DESTROYED);
        }

        // Create the CKEditor instance
        ckInstance = window.CKEDITOR.replace($target.get(0), config);
        ckInstance.setData(data);
      }, 50);
    };

    var setState = function (newState) {
      state = newState;
    };

    // Create the CKEditor
    self.create = function () {
      loadCKEditor(H5P.getLibraryPath('H5P.CKEditor-1.0') + '/ckeditor/', targetId, self);
    };

    // Destroy the CKEditor
    self.destroy = function () {
      if (state === DESTROYING || !self.exists()) {
        return;
      }
      else if (state === CREATING) {
        // If CKEditor is creating the instance, we need to wait for it to
        // finish before destroying it
        return self.once('created', self.destroy.bind(self));
      }

      if (self.exists()) {
        data = self.getData();

        setState(DESTROYING);

        if (currentCkEditorDialog) {
          currentCkEditorDialog.hide();
          currentCkEditorDialog = undefined;
        }

        if (ckInstance) {
          ckInstance.resetDirty();
          ckInstance.destroy();
          ckInstance = undefined;
        }
      }
    };

    // Do I have a CK instance?
    self.exists = function () {
      return ckInstance !== undefined;
    };

    // Get the current CK data
    self.getData = function () {
      return self.exists() ? ckInstance.getData().trim() : (data ? data : '');
    };

    // Let's resize
    self.resize = function (width, height) {
      if (self.exists()) {
        // In some scenarios resize throws an exception. No problems seen
        try {
          ckInstance.resize(width ? width : config.width, height ? height : config.height, false, true);
        }
        catch (e) {
          // Do nothing!
        }
      }
    };

    /**
     * Resize the CK Editor Dialogs
     * @param  {CKEDITOR.Dialog} dialog The dialog to resize
     * @returns {undefined}
     */
    var resizeDialog = function (dialog) {
      if (ckInstance === undefined) {
        return;
      }

      // Not nice to get the parent's $container, but we dont have any nice
      // ways of doing this
      var maxHeight = $dialogContainer.height();
      var dialogElement = dialog.getElement();
      var dialogBodyElement = dialogElement.find('.cke_dialog_body').$[0];
      $(dialogBodyElement).css({
        'max-height': maxHeight,
        'overflow-y': 'scroll'
      });

      var dialogContents = dialogElement.find('.cke_dialog_contents').$[0];
      $(dialogContents).css('margin-top', 0);

      // Resize link dialog
      var dialogContentsBody = dialogElement.find('.cke_dialog_contents_body').$[0];
      $(dialogContentsBody).css('height', 'inherit');

      // CKEditor is doing some repositioning inside a timeout. Therefore we need
      // this with a higher value. :(
      setTimeout(function () {
        dialog.move(dialog.getPosition().x, $dialogContainer.offset().top);
      }, 50);
    };

    /**
     * Setup CK Editor dialogs
     * @param {CKEDITOR.Dialog} dialog The dialog
     * @returns {undefined}
     */
    var setupDialog = function (event) {
      var dialog = event.data.dialog;
      // Prevent overflowing out of H5P iframe
      dialog.on('show', function () {
        currentCkEditorDialog = this;
        self.on('resize', resizeDialog.bind(self, this));
        resizeDialog(this);
      });

      dialog.on('hide', function () {
        self.off('resize', resizeDialog);
        currentCkEditorDialog = undefined;
      });
    };

    // Setup listeners
    self.on('destroyed', setState.bind(self, DESTROYED));
    self.on('created', setState.bind(self, CREATED));
    self.on('loaded', loaded);
    self.on('dialogDefinition', setupDialog);
  }

  // Extends the event dispatcher
  CKEditor.prototype = Object.create(EventDispatcher.prototype);
  CKEditor.prototype.constructor = CKEditor;

  return CKEditor;
})(H5P.EventDispatcher, H5P.jQuery);
