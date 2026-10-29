
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
  position: relative;
  width: 100%;
}
.indigo-theme-settings .indigo-theme-swatch-edit {
  align-items: center;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, .25);
  border-radius: 50%;
  bottom: .375rem;
  color: #111827;
  display: flex;
  height: 1.25rem;
  justify-content: center;
  position: absolute;
  right: .375rem;
  width: 1.25rem;
}
.indigo-theme-settings .indigo-theme-swatch-edit .pgn__icon {
  height: .75rem;
  width: .75rem;
}
.indigo-theme-settings .indigo-theme-hex {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: .75rem;
}
.indigo-theme-settings .indigo-theme-muted { opacity: .7; }
.indigo-theme-contrast {
  border-top: 1px solid var(--pgn-color-border, var(--pgn-color-form-control-indicator-border, #c4c7cf));
  margin-top: .75rem;
  padding-top: .75rem;
}
.indigo-theme-contrast-row {
  align-items: baseline;
  display: flex;
  gap: .5rem;
  justify-content: space-between;
}
.indigo-theme-picker { position: relative; }
.indigo-theme-picker .react-colorful { height: 200px; width: 100%; }
.indigo-theme-picker-guides {
  height: calc(100% - 36px);
  left: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
}
.indigo-theme-picker-guides polyline {
  fill: none;
  opacity: .85;
  stroke: #FFFFFF;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}
.indigo-theme-contrast-pass { color: var(--pgn-color-success-base, #0D7D4D); font-weight: 600; }
.indigo-theme-contrast-fail { color: var(--pgn-color-danger-base, #C32D3A); font-weight: 600; }
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
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [baseTokenVersion, setBaseTokenVersion] = useState(0);
  const [contrastWarning, setContrastWarning] = useState('');

  const savedRef = useRef(null);
  const draftRef = useRef(null);
  const isDirtyRef = useRef(false);
  const cardElements = useRef({});

  const updateDraft = (next) => {
    draftRef.current = next;
    setDraft(next);
  };

  const messages = defineMessages({
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
      defaultMessage: "Click any color to change it. Colors are saved separately for Light and Dark.",
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
    "theme.settings.contrast.ratio": {
      id: "theme.settings.contrast.ratio",
      defaultMessage: "Contrast ratio: {ratio}",
      description: "contrast ratio of the chosen colour against the page background",
    },
    "theme.settings.contrast.pass": {
      id: "theme.settings.contrast.pass",
      defaultMessage: "Pass",
      description: "shown when a colour meets a contrast level",
    },
    "theme.settings.contrast.fail": {
      id: "theme.settings.contrast.fail",
      defaultMessage: "Fail",
      description: "shown when a colour does not meet a contrast level",
    },
    "theme.settings.contrast.against": {
      id: "theme.settings.contrast.against",
      defaultMessage: "Measured against the {variant} page background.",
      description: "explains what the contrast ratio is measured against",
    },
    "theme.settings.contrast.against.text": {
      id: "theme.settings.contrast.against.text",
      defaultMessage: "Measured against Body text, which is shown on this color.",
      description: "explains that a surface colour is measured against the text drawn on it",
    },
    "theme.settings.contrast.warning": {
      id: "theme.settings.contrast.warning",
      defaultMessage: "Saved. {labels} may be hard to read against the page background — you can pick another value, or use the default.",
      description: "warning shown after saving colours that fall below the recommended contrast",
    },
    "theme.settings.reset.confirm": {
      id: "theme.settings.reset.confirm",
      defaultMessage: "Reset {preset} to its default colors? Your custom colors for this appearance will be lost.",
      description: "confirmation shown before resetting a preset",
    },
    "theme.settings.reset.confirm.action": {
      id: "theme.settings.reset.confirm.action",
      defaultMessage: "Yes, reset",
      description: "label of the button that confirms resetting a preset",
    },
    "theme.settings.reset.cancel": {
      id: "theme.settings.reset.cancel",
      defaultMessage: "Cancel",
      description: "label of the button that cancels resetting a preset",
    },
  });

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
    }
  };

  useEffect(() => { savedRef.current = saved; }, [saved]);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { ensureThemeSettingsCss(); }, []);
  useEffect(() => onBaseTokensCaptured(() => setBaseTokenVersion((value) => value + 1)), []);

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
  const presetTokens = useMemo(
    () => ({ ...(activePreset?.tokens || {}), ...baseTokensFor(activePreset?.variant) }),
    [activePreset, baseTokenVersion],
  );
  const activeOverrides = (draft?.overrides || {})[draft?.preset] || {};
  const availablePresets = (saved?.presets || []).filter(
    (preset) => getConfig().INDIGO_ENABLE_DARK_TOGGLE || preset.variant !== 'dark',
  );
  const savedActiveOverrides = (overridesFromPayload(saved) || {})[draft?.preset] || {};
  const canReset = Object.keys(savedActiveOverrides).length > 0;

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

  const contrastBackground = () => (activePreset?.variant === 'dark' ? '#0D0D0E' : '#FFFFFF');

  const contrastLevelsFor = () => [
    { label: 'AA', min: INDIGO_CONTRAST_AA },
    { label: 'AAA', min: 7 },
  ];

  const contrastPeerFor = (token) => {
    if (token !== '--pgn-color-primary-light') {
      return { color: contrastBackground(), onText: false };
    }
    const text = activeOverrides['--pgn-color-text-base']
      || presetTokens['--pgn-color-text-base'];
    return { color: text || contrastBackground(), onText: Boolean(text) };
  };

  const pickerGuides = (token, color) => {
    const levels = contrastLevelsFor(token);
    const rgb = hexToRgb(color);
    if (!levels.length || !rgb) {
      return [];
    }
    const { h } = rgbToHsv(rgb);
    const peer = contrastPeerFor(token);
    return levels
      .map((level) => ({
        label: level.label,
        points: contrastGuidePoints(h, level.min, peer.color),
      }))
      .filter((guide) => guide.points);
  };

  const contrastReport = (token, color) => {
    const levels = contrastLevelsFor(token);
    const peer = contrastPeerFor(token);
    const ratio = contrastRatio(color, peer.color);
    if (!levels.length || !ratio) {
      return null;
    }
    return {
      ratio: Math.round(ratio * 100) / 100,
      onText: peer.onText,
      levels: levels.map((level) => ({ ...level, pass: ratio >= level.min })),
    };
  };

  const openGuides = useMemo(
    () => (openToken ? pickerGuides(openToken, colorFor(openToken)) : []),
    [openToken, activeOverrides, presetTokens, activePreset],
  );

  const contrastFailures = () => INDIGO_THEME_TOKENS
    .filter((entry) => {
      if (!activeOverrides[entry.token]) {
        return false;
      }
      const report = contrastReport(entry.token, activeOverrides[entry.token]);
      return report && !report.levels[0].pass;
    })
    .map((entry) => tokenLabel(entry));

  const onSave = () => {
    const failures = contrastFailures();
    setIsSubmitting(true);
    setSubmitError('');
    setContrastWarning('');
    setOpenToken(null);
    getAuthenticatedHttpClient()
      .put(apiUrl, { preset: draft.preset, overrides: draft.overrides })
      .then(({ data }) => {
        adoptPayload(data);
        writeThemeCache(data);
        applyThemeTokens(effectiveTokensFor(data, data.preset));
        if (failures.length) {
          setContrastWarning(intl.formatMessage(
            messages["theme.settings.contrast.warning"],
            { labels: failures.join(', ') },
          ));
        } else {
          setShowSavedAlert(true);
        }
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
    setIsConfirmingReset(false);
    setIsSubmitting(true);
    setSubmitError('');
    setOpenToken(null);
    const cleared = { ...overridesFromPayload(saved), [draft.preset]: {} };
    getAuthenticatedHttpClient()
      .put(apiUrl, { preset: draft.preset, overrides: cleared })
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

  const tokenLabel = (entry) => (INDIGO_TOKEN_MESSAGES[entry.token]
    ? intl.formatMessage(INDIGO_TOKEN_MESSAGES[entry.token])
    : entry.label);
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
      {contrastWarning && (
        <Alert variant="warning" onClose={() => setContrastWarning('')} dismissible>
          {contrastWarning}
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
        {availablePresets.map((preset) => (
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

      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 mb-4">
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
              <div className="indigo-theme-swatch" style={swatchStyle(colorFor(entry.token))}>
                <span className="indigo-theme-swatch-edit" aria-hidden="true">
                  <Icon src={Edit} />
                </span>
              </div>
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
                  <div className="indigo-theme-picker">
                    <HexColorPicker
                      color={colorFor(entry.token)}
                      onChange={(value) => onPickerChange(entry.token, value)}
                    />
                    <svg
                      className="indigo-theme-picker-guides"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      {openGuides.map((guide) => (
                        <polyline key={guide.label} points={guide.points} />
                      ))}
                    </svg>
                  </div>
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
                  {(() => {
                    const report = contrastReport(entry.token, colorFor(entry.token));
                    if (!report) {
                      return null;
                    }
                    return (
                      <div className="indigo-theme-contrast small">
                        <div className="font-weight-bold mb-1">
                          {intl.formatMessage(
                            messages["theme.settings.contrast.ratio"],
                            { ratio: report.ratio.toFixed(2) },
                          )}
                        </div>
                        {report.levels.map((level) => (
                          <div className="indigo-theme-contrast-row" key={level.label}>
                            <span>{`${level.label}: ${level.min}`}</span>
                            <span className={level.pass
                              ? 'indigo-theme-contrast-pass'
                              : 'indigo-theme-contrast-fail'}
                            >
                              {intl.formatMessage(messages[level.pass
                                ? "theme.settings.contrast.pass"
                                : "theme.settings.contrast.fail"])}
                            </span>
                          </div>
                        ))}
                        <div className="indigo-theme-muted mt-1">
                          {report.onText
                            ? intl.formatMessage(messages["theme.settings.contrast.against.text"])
                            : intl.formatMessage(
                              messages["theme.settings.contrast.against"],
                              { variant: activePreset?.name || '' },
                            )}
                        </div>
                      </div>
                    );
                  })()}
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

      {isConfirmingReset && (
        <Alert variant="warning">
          <p className="mb-3">
            {intl.formatMessage(
              messages["theme.settings.reset.confirm"],
              { preset: activePreset?.name || '' },
            )}
          </p>
          <ActionRow>
            <Button variant="tertiary" onClick={() => setIsConfirmingReset(false)} disabled={isSubmitting}>
              {intl.formatMessage(messages["theme.settings.reset.cancel"])}
            </Button>
            <Button variant="danger" onClick={onReset} disabled={isSubmitting}>
              {intl.formatMessage(messages["theme.settings.reset.confirm.action"])}
            </Button>
          </ActionRow>
        </Alert>
      )}

      <ActionRow>
        <Button
          variant="outline-primary"
          onClick={() => setIsConfirmingReset(true)}
          disabled={isSubmitting || !canReset || isConfirmingReset}
        >
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
