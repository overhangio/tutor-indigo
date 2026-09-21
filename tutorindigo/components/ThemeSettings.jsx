
const INDIGO_THEME_SETTINGS_STYLE_ID = 'indigo-theme-settings-css';

const INDIGO_THEME_SETTINGS_CSS = `
#theme-settings .indigo-theme-tiles {
  align-items: stretch;
  display: flex;
  flex-flow: row wrap;
  gap: .75rem;
  max-width: none;
}
#theme-settings .indigo-theme-tile {
  align-items: center;
  background: var(--pgn-color-body-bg, transparent);
  border: 1px solid var(--pgn-color-border, var(--pgn-color-form-control-indicator-border, #c4c7cf));
  border-radius: .375rem;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex: 0 0 auto;
  margin: 0;
  max-width: 100%;
  padding: 0;
  position: relative;
  width: 220px;
}
#theme-settings .indigo-theme-tile-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#theme-settings .indigo-theme-tile input[type="radio"] {
  height: 1px;
  margin: 0;
  opacity: 0;
  position: absolute;
  width: 1px;
}
#theme-settings .indigo-theme-tile > div { width: 100%; }
#theme-settings .indigo-theme-tile label {
  align-items: center;
  cursor: pointer;
  display: flex;
  margin: 0;
  padding: .75rem 1rem;
}
#theme-settings .indigo-theme-tile--selected {
  border-color: var(--pgn-color-primary-base, #15376D);
  box-shadow: inset 0 0 0 1px var(--pgn-color-primary-base, #15376D);
}
#theme-settings .indigo-theme-tile:hover {
  border-color: var(--pgn-color-primary-base, #15376D);
}
#theme-settings .indigo-theme-tile:has(input:disabled),
#theme-settings .indigo-theme-tile:has(input:disabled) label {
  cursor: default;
}
#theme-settings .indigo-theme-tile:has(input:disabled):not(.indigo-theme-tile--selected):hover {
  border-color: var(--pgn-color-border, var(--pgn-color-form-control-indicator-border, #c4c7cf));
}
#theme-settings .indigo-theme-tile:focus-within {
  outline: 2px solid var(--pgn-color-primary-base, #15376D);
  outline-offset: 2px;
}
.indigo-theme-settings .indigo-theme-color-card {
  background: var(--pgn-color-card-bg-base, var(--pgn-color-body-bg, transparent));
  border: 1px solid var(--pgn-color-border, var(--pgn-color-form-control-indicator-border, #c4c7cf));
  border-radius: .375rem;
  box-shadow: none;
  color: inherit;
  cursor: pointer;
  height: 100%;
  overflow: hidden;
  text-align: start;
}
.indigo-theme-settings .indigo-theme-color-card:hover {
  border-color: var(--pgn-color-primary-base, #15376D);
}
.indigo-theme-settings .indigo-theme-color-card--disabled {
  cursor: default;
  opacity: .65;
  pointer-events: none;
}
.indigo-theme-settings .indigo-theme-color-card:focus-visible {
  outline: 2px solid var(--pgn-color-primary-base, #15376D);
  outline-offset: 2px;
}
.indigo-theme-settings .indigo-theme-swatch {
  border-bottom: 1px solid var(--pgn-color-border, var(--pgn-color-form-control-indicator-border, #c4c7cf));
  height: 56px;
  width: 100%;
}
.indigo-theme-settings .indigo-theme-hex {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: .75rem;
}
.indigo-theme-settings .indigo-theme-muted { opacity: .7; }
.indigo-theme-settings .indigo-theme-badge {
  background: transparent;
  border: 1px solid currentColor;
  color: var(--pgn-color-primary-base, #15376D);
  font-weight: 500;
}
#theme-settings .btn:disabled, #theme-settings .btn.disabled { opacity: .65; }
#theme-settings .btn-primary:disabled, #theme-settings .btn-primary.disabled {
  background-color: var(--pgn-color-btn-bg-primary, var(--pgn-color-primary-base, #15376D));
  border-color: var(--pgn-color-btn-bg-primary, var(--pgn-color-primary-base, #15376D));
  color: var(--pgn-color-btn-text-primary, #FFFFFF);
}
.pgn__modal-popup__tooltip { z-index: 1060; }
.indigo-theme-popover {
  background: var(--pgn-color-card-bg-base, var(--pgn-color-body-bg, #FFFFFF));
  border: 1px solid var(--pgn-color-border, var(--pgn-color-form-control-indicator-border, #c4c7cf));
  border-radius: .375rem;
  box-shadow: 0 .5rem 1.5rem rgba(0, 0, 0, .25);
  color: var(--pgn-color-text-base, inherit);
  padding: 1rem;
  width: 15rem;
}
.indigo-theme-popover .btn-link { color: var(--pgn-color-primary-base, #15376D); }
.indigo-theme-popover .react-colorful { height: 9rem; width: 100%; }
.indigo-theme-popover .react-colorful__saturation { border-radius: .25rem .25rem 0 0; }
.indigo-theme-popover .react-colorful__last-control { border-radius: 0 0 .25rem .25rem; }
`;

const ensureThemeSettingsCss = () => {
  try {
    if (document.getElementById(INDIGO_THEME_SETTINGS_STYLE_ID)) {
      return;
    }
    const style = document.createElement('style');
    style.id = INDIGO_THEME_SETTINGS_STYLE_ID;
    style.textContent = INDIGO_THEME_SETTINGS_CSS;
    document.head.appendChild(style);
  } catch (error) {}
};

const INDIGO_THEME_HEX_INPUT_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const normalizeHexInput = (value) => {
  const match = INDIGO_THEME_HEX_INPUT_RE.exec((value || '').trim());
  if (!match) {
    return null;
  }
  const digits = match[1];
  const expanded = digits.length === 3
    ? digits.split('').map((char) => char + char).join('')
    : digits;
  return `#${expanded.toUpperCase()}`;
};

const swatchStyle = (color) => ({ backgroundColor: color });

const ThemeSettings = () => {
  const intl = useIntl();
  const { paragonTheme } = useContext(AppContext);
  const isDynamicThemeEnabled = getConfig().INDIGO_ENABLE_DYNAMIC_THEME;
  const authenticatedUser = getAuthenticatedUser();
  const apiUrl = `${getConfig().LMS_BASE_URL}${INDIGO_THEME_API_PATH}`;

  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSavedAlert, setShowSavedAlert] = useState(false);
  const [openToken, setOpenToken] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [hexDraft, setHexDraft] = useState('');

  const savedRef = useRef(null);
  const draftRef = useRef(null);
  const isDirtyRef = useRef(false);
  const cardElements = useRef({});

  const updateDraft = (next) => {
    draftRef.current = next;
    setDraft(next);
  };

  const messages = {
    "theme.settings.heading": {
      id: "theme.settings.heading",
      defaultMessage: "Theme",
      description: "heading of the theme settings section",
    },
    "theme.settings.description": {
      id: "theme.settings.description",
      defaultMessage: "Choose how the site looks for you. Your choices only apply to your account.",
      description: "description of the theme settings section",
    },
    "theme.settings.preset.label": {
      id: "theme.settings.preset.label",
      defaultMessage: "Theme preset",
      description: "accessible label of the theme preset selector",
    },
    "theme.settings.colors.label": {
      id: "theme.settings.colors.label",
      defaultMessage: "Colors",
      description: "label of the theme colors sub-section",
    },
    "theme.settings.colors.help": {
      id: "theme.settings.colors.help",
      defaultMessage: "Personalize the core colors of this theme. Colors are saved separately for Light and Dark.",
      description: "helper text of the theme colors sub-section",
    },
    "theme.settings.color.button": {
      id: "theme.settings.color.button",
      defaultMessage: "{label} color, {value}",
      description: "accessible label of a theme color card",
    },
    "theme.settings.color.modified": {
      id: "theme.settings.color.modified",
      defaultMessage: "Modified",
      description: "badge shown on a theme color that differs from the preset default",
    },
    "theme.settings.color.dialog": {
      id: "theme.settings.color.dialog",
      defaultMessage: "{label} color",
      description: "accessible name of the colour picker popover",
    },
    "theme.settings.color.hex": {
      id: "theme.settings.color.hex",
      defaultMessage: "Hex",
      description: "label of the hexadecimal colour input",
    },
    "theme.settings.color.hex.invalid": {
      id: "theme.settings.color.hex.invalid",
      defaultMessage: "Enter a color such as #15376D.",
      description: "error shown when the hexadecimal colour input is invalid",
    },
    "theme.settings.color.default": {
      id: "theme.settings.color.default",
      defaultMessage: "Use default",
      description: "label of the button that reverts one colour to the preset default",
    },
    "theme.settings.loading": {
      id: "theme.settings.loading",
      defaultMessage: "Loading theme settings",
      description: "screen reader text shown while theme settings load",
    },
    "theme.settings.load.error": {
      id: "theme.settings.load.error",
      defaultMessage: "We could not load your theme settings. Please try again later.",
      description: "error shown when theme settings fail to load",
    },
    "theme.settings.save": {
      id: "theme.settings.save",
      defaultMessage: "Save",
      description: "label of the button that saves the theme",
    },
    "theme.settings.saved": {
      id: "theme.settings.saved",
      defaultMessage: "Theme saved",
      description: "message shown after the theme was saved",
    },
    "theme.settings.save.error": {
      id: "theme.settings.save.error",
      defaultMessage: "We could not save your theme. Please try again.",
      description: "error shown when the theme could not be saved",
    },
    "theme.settings.reset": {
      id: "theme.settings.reset",
      defaultMessage: "Reset to default",
      description: "label of the button that resets the theme to its default",
    },
    "theme.settings.discard": {
      id: "theme.settings.discard",
      defaultMessage: "Discard changes",
      description: "label of the button that discards unsaved theme changes",
    },
  };

  const overridesFromPayload = (payload) => {
    const result = {};
    (payload?.presets || []).forEach((preset) => {
      result[preset.slug] = { ...((payload.overrides || {})[preset.slug] || {}) };
    });
    Object.keys(payload?.overrides || {}).forEach((slug) => {
      if (!result[slug]) {
        result[slug] = { ...payload.overrides[slug] };
      }
    });
    return result;
  };

  const stableOverrides = (overrides) => {
    const result = {};
    Object.keys(overrides || {}).sort().forEach((slug) => {
      const entry = overrides[slug] || {};
      const inner = {};
      Object.keys(entry).sort().forEach((token) => { inner[token] = entry[token]; });
      result[slug] = inner;
    });
    return JSON.stringify(result);
  };

  const isDirty = Boolean(saved && draft
    && stableOverrides(draft.overrides) !== stableOverrides(overridesFromPayload(saved)));

  const adoptPayload = (payload) => {
    setSaved(payload);
    updateDraft({ preset: payload.preset, overrides: overridesFromPayload(payload) });
    setOpenToken(null);
  };

  const applySavedTheme = (payload) => {
    applyThemeTokens(effectiveTokensFor(payload, payload.preset));
    if (payload.variant) {
      persistThemeVariant(payload.variant);
      paragonTheme?.setThemeVariant?.(payload.variant);
    }
  };

  useEffect(() => { savedRef.current = saved; }, [saved]);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { ensureThemeSettingsCss(); }, []);

  useEffect(() => {
    if (!isDynamicThemeEnabled || !authenticatedUser) {
      return undefined;
    }

    let cancelled = false;
    fetchUserTheme()
      .then(({ data }) => {
        if (cancelled) {
          return;
        }
        adoptPayload(data);
        setIsLoading(false);
      })
      .catch((error) => {
        logError(error);
        if (!cancelled) {
          setHasLoadError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (isDirtyRef.current && savedRef.current) {
        applySavedTheme(savedRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showSavedAlert) {
      return undefined;
    }
    const timer = setTimeout(() => setShowSavedAlert(false), 5000);
    return () => clearTimeout(timer);
  }, [showSavedAlert]);

  const activePreset = (saved?.presets || []).find((preset) => preset.slug === draft?.preset);
  const presetTokens = activePreset?.tokens || {};
  const activeOverrides = (draft?.overrides || {})[draft?.preset] || {};

  const overrideFor = (token) => activeOverrides[token];
  const colorFor = (token) => overrideFor(token) || presetTokens[token] || '#000000';
  const isModified = (token) => Boolean(overrideFor(token)) && overrideFor(token) !== presetTokens[token];

  const previewDraft = (nextDraft) => {
    applyThemeTokens(effectiveTokensFor(
      { ...(savedRef.current || saved), overrides: nextDraft.overrides },
      nextDraft.preset,
    ));
  };

  const applyDraftPreset = (nextDraft) => {
    const preset = ((savedRef.current || saved)?.presets || [])
      .find((item) => item.slug === nextDraft.preset);
    updateDraft(nextDraft);
    if (preset?.variant) {
      persistThemeVariant(preset.variant);
      paragonTheme?.setThemeVariant?.(preset.variant);
    }
    previewDraft(nextDraft);
  };

  const onPresetChange = (slug) => {
    if (!draft || slug === draft.preset || !(saved?.presets || []).some((item) => item.slug === slug)) {
      return;
    }
    applyDraftPreset({ ...draft, preset: slug });
    setOpenToken(null);
    setSubmitError('');
    setIsSubmitting(true);
    getAuthenticatedHttpClient()
      .patch(apiUrl, { preset: slug })
      .then(({ data }) => {
        setSaved(data);
        savedRef.current = data;
        writeThemeCache(data);
      })
      .catch((error) => {
        logError(error);
        setSubmitError(intl.formatMessage(messages["theme.settings.save.error"]));
        applyDraftPreset({ ...draftRef.current, preset: savedRef.current?.preset });
      })
      .finally(() => {
        resetUserThemeRequest();
        setIsSubmitting(false);
      });
  };

  const commitColor = (token, value) => {
    const nextDraft = {
      ...draft,
      overrides: {
        ...draft.overrides,
        [draft.preset]: { ...(draft.overrides[draft.preset] || {}), [token]: value },
      },
    };
    updateDraft(nextDraft);
    previewDraft(nextDraft);
  };

  const onPickerChange = (token, value) => {
    const normalized = normalizeHexInput(value);
    if (!normalized) {
      return;
    }
    setHexDraft(normalized);
    commitColor(token, normalized);
  };

  const onHexInputChange = (token, value) => {
    setHexDraft(value);
    const normalized = normalizeHexInput(value);
    if (normalized) {
      commitColor(token, normalized);
    }
  };

  const onHexInputBlur = () => {
    const normalized = normalizeHexInput(hexDraft);
    if (normalized) {
      setHexDraft(normalized);
    }
  };

  const onUseDefault = (token) => {
    const nextOverrides = { ...(draft.overrides[draft.preset] || {}) };
    delete nextOverrides[token];
    const nextDraft = {
      ...draft,
      overrides: { ...draft.overrides, [draft.preset]: nextOverrides },
    };
    updateDraft(nextDraft);
    setHexDraft(normalizeHexInput(presetTokens[token]) || '');
    previewDraft(nextDraft);
  };

  const onOpenPicker = (token) => {
    setHexDraft(normalizeHexInput(colorFor(token)) || colorFor(token));
    setPickerTarget(cardElements.current[token] || null);
    setOpenToken(token);
  };

  const onSave = () => {
    setIsSubmitting(true);
    setSubmitError('');
    setOpenToken(null);
    getAuthenticatedHttpClient()
      .put(apiUrl, { preset: draft.preset, overrides: draft.overrides })
      .then(({ data }) => {
        adoptPayload(data);
        writeThemeCache(data);
        applyThemeTokens(effectiveTokensFor(data, data.preset));
        setShowSavedAlert(true);
      })
      .catch((error) => {
        logError(error);
        setSubmitError(intl.formatMessage(messages["theme.settings.save.error"]));
      })
      .finally(() => {
        resetUserThemeRequest();
        setIsSubmitting(false);
      });
  };

  const onReset = () => {
    setIsSubmitting(true);
    setSubmitError('');
    setOpenToken(null);
    getAuthenticatedHttpClient()
      .delete(apiUrl)
      .then(({ data }) => {
        adoptPayload(data);
        writeThemeCache(data);
        applySavedTheme(data);
        setShowSavedAlert(true);
      })
      .catch((error) => {
        logError(error);
        setSubmitError(intl.formatMessage(messages["theme.settings.save.error"]));
      })
      .finally(() => {
        resetUserThemeRequest();
        setIsSubmitting(false);
      });
  };

  const onDiscard = () => {
    updateDraft({ preset: saved.preset, overrides: overridesFromPayload(saved) });
    setOpenToken(null);
    setSubmitError('');
    applySavedTheme(saved);
  };

  if (!isDynamicThemeEnabled || !authenticatedUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="indigo-theme-settings mt-5" id="theme-settings">
        <Spinner animation="border" screenReaderText={intl.formatMessage(messages["theme.settings.loading"])} />
      </div>
    );
  }

  if (hasLoadError || !saved || !draft) {
    return (
      <div className="indigo-theme-settings mt-5" id="theme-settings">
        <Alert variant="danger">
          {intl.formatMessage(messages["theme.settings.load.error"])}
        </Alert>
      </div>
    );
  }

  const tokenLabel = (entry) => intl.formatMessage({
    id: `theme.settings.token.${entry.token}`,
    defaultMessage: entry.label,
    description: `label of the ${entry.label} theme color`,
  });
  const isHexInvalid = hexDraft !== '' && !normalizeHexInput(hexDraft);
  const tileClassName = (slug) => (slug === draft.preset
    ? 'indigo-theme-tile indigo-theme-tile--selected'
    : 'indigo-theme-tile');
  const colorCardClassName = isSubmitting
    ? 'indigo-theme-color-card indigo-theme-color-card--disabled'
    : 'indigo-theme-color-card';

  return (
    <div className="indigo-theme-settings mt-5" id="theme-settings">
      <h2 className="section-heading h4 mb-2">
        {intl.formatMessage(messages["theme.settings.heading"])}
      </h2>
      <p className="small indigo-theme-muted mb-4">
        {intl.formatMessage(messages["theme.settings.description"])}
      </p>

      {showSavedAlert && (
        <Alert variant="success" onClose={() => setShowSavedAlert(false)} dismissible>
          {intl.formatMessage(messages["theme.settings.saved"])}
        </Alert>
      )}
      {submitError && (
        <Alert variant="danger" onClose={() => setSubmitError('')} dismissible>
          {submitError}
        </Alert>
      )}

      <Form.RadioSet
        name="indigo-theme-preset"
        value={draft.preset}
        onChange={(event) => onPresetChange(event.target.value)}
        isInline
        aria-label={intl.formatMessage(messages["theme.settings.preset.label"])}
        className="indigo-theme-tiles mb-4"
      >
        {(saved.presets || []).map((preset) => (
          <Form.Radio
            key={preset.slug}
            value={preset.slug}
            disabled={isSubmitting}
            className={tileClassName(preset.slug)}
          >
            <Icon src={preset.variant === 'dark' ? Nightlight : WbSunny} className="mr-2" />
            <span className="font-weight-bold indigo-theme-tile-name">{preset.name}</span>
          </Form.Radio>
        ))}
      </Form.RadioSet>

      <div className="font-weight-bold small mb-1">
        {intl.formatMessage(messages["theme.settings.colors.label"])}
      </div>
      <p className="small indigo-theme-muted mb-3">
        {intl.formatMessage(messages["theme.settings.colors.help"])}
      </p>

      <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 mb-4">
        {INDIGO_THEME_TOKENS.map((entry) => (
          <div
            className="col mb-3"
            key={entry.token}
            ref={(element) => { cardElements.current[entry.token] = element; }}
          >
            <Card
              isClickable={!isSubmitting}
              role="button"
              aria-disabled={isSubmitting}
              aria-label={intl.formatMessage(messages["theme.settings.color.button"], {
                label: tokenLabel(entry),
                value: colorFor(entry.token),
              })}
              className={colorCardClassName}
              onClick={() => {
                if (!isSubmitting) {
                  onOpenPicker(entry.token);
                }
              }}
              onKeyDown={(event) => {
                if (!isSubmitting && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onOpenPicker(entry.token);
                }
              }}
            >
              <div className="indigo-theme-swatch" style={swatchStyle(colorFor(entry.token))} />
              <div className="p-2">
                <div className="small font-weight-bold">{tokenLabel(entry)}</div>
                <div className="indigo-theme-hex indigo-theme-muted">{colorFor(entry.token)}</div>
                {isModified(entry.token) && (
                  <Badge className="indigo-theme-badge mt-1">
                    {intl.formatMessage(messages["theme.settings.color.modified"])}
                  </Badge>
                )}
              </div>
            </Card>
            {openToken === entry.token && pickerTarget && !isSubmitting && (
              <ModalPopup
                positionRef={pickerTarget}
                isOpen
                onClose={() => setOpenToken(null)}
                placement="bottom-start"
              >
                <div
                  className="indigo-theme-popover"
                  role="dialog"
                  aria-modal="false"
                  aria-label={intl.formatMessage(messages["theme.settings.color.dialog"], {
                    label: tokenLabel(entry),
                  })}
                >
                  <HexColorPicker
                    color={colorFor(entry.token)}
                    onChange={(value) => onPickerChange(entry.token, value)}
                  />
                  <Form.Group className="mt-3 mb-0" isInvalid={isHexInvalid}>
                    <Form.Label className="small mb-1">
                      {intl.formatMessage(messages["theme.settings.color.hex"])}
                    </Form.Label>
                    <Form.Control
                      size="sm"
                      value={hexDraft}
                      disabled={isSubmitting}
                      spellCheck={false}
                      autoComplete="off"
                      onChange={(event) => onHexInputChange(entry.token, event.target.value)}
                      onBlur={onHexInputBlur}
                    />
                    {isHexInvalid && (
                      <Form.Control.Feedback type="invalid">
                        {intl.formatMessage(messages["theme.settings.color.hex.invalid"])}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 mt-2"
                    disabled={isSubmitting}
                    onClick={() => onUseDefault(entry.token)}
                  >
                    {intl.formatMessage(messages["theme.settings.color.default"])}
                  </Button>
                </div>
              </ModalPopup>
            )}
          </div>
        ))}
      </div>

      <ActionRow>
        <Button variant="outline-primary" onClick={onReset} disabled={isSubmitting}>
          {intl.formatMessage(messages["theme.settings.reset"])}
        </Button>
        <ActionRow.Spacer />
        {isDirty && (
          <Button variant="tertiary" onClick={onDiscard} disabled={isSubmitting}>
            {intl.formatMessage(messages["theme.settings.discard"])}
          </Button>
        )}
        <Button variant="primary" onClick={onSave} disabled={isSubmitting || !isDirty}>
          {intl.formatMessage(messages["theme.settings.save"])}
        </Button>
      </ActionRow>
    </div>
  );
};
