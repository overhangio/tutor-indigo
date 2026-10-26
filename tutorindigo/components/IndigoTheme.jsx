
const INDIGO_THEME_STORAGE_KEY = 'indigo-user-theme-mfe';
const INDIGO_THEME_STYLE_ID = 'indigo-user-theme';
const INDIGO_THEME_API_PATH = '/api/indigo/v1/theme/';

const INDIGO_THEME_TOKENS = [
  { token: '--pgn-color-primary-base', label: 'Buttons and links' },
  { token: '--pgn-color-primary-light', label: 'Button and link highlights' },
  { token: '--pgn-color-brand-base', label: 'Brand accents' },
  { token: '--pgn-color-text-base', label: 'Body text' },
  { token: '--pgn-color-info-base', label: 'Navigation links' },
];

const INDIGO_TOKEN_MESSAGES = {
  '--pgn-color-primary-base': {
    id: 'theme.settings.token.primary.v2',
    defaultMessage: 'Buttons and links',
    description: 'label of the colour used for buttons and links',
  },
  '--pgn-color-primary-light': {
    id: 'theme.settings.token.primaryLight.v2',
    defaultMessage: 'Button and link highlights',
    description: 'label of the colour used for button and link highlights',
  },
  '--pgn-color-brand-base': {
    id: 'theme.settings.token.secondary.v2',
    defaultMessage: 'Brand accents',
    description: 'label of the colour used for brand accents',
  },
  '--pgn-color-text-base': {
    id: 'theme.settings.token.text.v2',
    defaultMessage: 'Body text',
    description: 'label of the colour used for body text',
  },
  '--pgn-color-info-base': {
    id: 'theme.settings.token.info.v2',
    defaultMessage: 'Navigation links',
    description: 'label of the colour used for navigation links',
  },
};

const INDIGO_THEME_COOKIE_NAMES = [
  'selected-paragon-theme-variant',
  'selected-theme-variant',
];
const INDIGO_THEME_ATTRIBUTE_NAMES = [
  'data-paragon-theme-variant',
  'data-theme-variant',
];
const INDIGO_THEME_COOKIE_EXPIRY_DAYS = 90;
const INDIGO_THEME_JWT_COOKIE_NAME = 'edx-jwt-cookie-header-payload';
const INDIGO_THEME_VARIANT_LINK_PATTERNS = [
  /theme-variants-(light|dark)\b/,
  /\/(light|dark)\.min\.css/,
];

const INDIGO_THEME_FAMILIES = ['primary', 'brand', 'info'];
const INDIGO_THEME_SHADE_MIX = {
  100: ['#FFFFFF', 0.94],
  200: ['#FFFFFF', 0.75],
  300: ['#FFFFFF', 0.50],
  400: ['#FFFFFF', 0.25],
  500: null,
  600: ['#000000', 0.10],
  700: ['#000000', 0.20],
  800: ['#000000', 0.25],
  900: ['#000000', 0.30],
};
const INDIGO_THEME_ICON_TOKENS = {
  '--pgn-other-content-form-control-checkbox-indicator-icon-checked-base':
    "url(\"data:image/svg+xml,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M21 3H3V21H21V3ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z' fill='%%HEX%%'/></svg>\")",
  '--pgn-other-content-form-control-radio-indicator-icon-checked-base':
    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%%HEX%%'/%3e%3c/svg%3e\")",
  '--pgn-other-content-form-control-switch-indicator-icon-off':
    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%%HEX%%'/%3e%3c/svg%3e\")",
};

const INDIGO_THEME_HEX_RE = /^#[0-9a-fA-F]{6}$/;
const INDIGO_CONTRAST_AA = 4.5;
const INDIGO_THEME_RESET_PARAM = 'indigo-theme-reset';
const INDIGO_RUNTIME_POLL_MS = 50;
const INDIGO_RUNTIME_TIMEOUT_MS = 10000;

let indigoBaseTokens = {};

const hexToRgb = (hex) => {
  if (typeof hex !== 'string') {
    return null;
  }
  let value = hex.trim().replace('#', '');
  if (value.length === 3) {
    value = value.split('').map((char) => char + char).join('');
  }
  if (value.length === 8) {
    value = value.slice(0, 6);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }
  const int = parseInt(value, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const rgbToHex = (rgb) => {
  const channel = (value) => Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`.toUpperCase();
};

const mixColor = (hex, otherHex, amount) => {
  const base = hexToRgb(hex);
  const other = hexToRgb(otherHex);
  if (!base || !other) {
    return hex;
  }
  return rgbToHex({
    r: base.r * (1 - amount) + other.r * amount,
    g: base.g * (1 - amount) + other.g * amount,
    b: base.b * (1 - amount) + other.b * amount,
  });
};

const rgbToHsl = (rgb) => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h, s, l };
};

const hslToRgb = (hsl) => {
  const { h, s, l } = hsl;
  if (s === 0) {
    return { r: l * 255, g: l * 255, b: l * 255 };
  }
  const hueToChannel = (p, q, hue) => {
    let t = hue;
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hueToChannel(p, q, h + 1 / 3) * 255,
    g: hueToChannel(p, q, h) * 255,
    b: hueToChannel(p, q, h - 1 / 3) * 255,
  };
};

const darkenColor = (hex, amount) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, hsl.l - amount);
  return rgbToHex(hslToRgb(hsl));
};

const relativeLuminance = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
};

const contrastRatio = (hex, otherHex) => {
  const a = relativeLuminance(hex);
  const b = relativeLuminance(otherHex);
  if (a === null || b === null) {
    return null;
  }
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const readableTextOn = (hex) => (
  (contrastRatio(hex, '#FFFFFF') || 0) >= INDIGO_CONTRAST_AA ? '#FFFFFF' : '#111827'
);

const liveTokenDefaults = () => {
  const result = {};
  try {
    const computed = window.getComputedStyle(document.documentElement);
    INDIGO_THEME_TOKENS.forEach((entry) => {
      const value = (computed.getPropertyValue(entry.token) || '').trim();
      if (INDIGO_THEME_HEX_RE.test(value)) {
        result[entry.token] = value.toUpperCase();
      }
    });
  } catch (error) {}
  return result;
};

const captureBaseTokens = () => {
  try {
    const variant = document.documentElement.getAttribute(INDIGO_THEME_ATTRIBUTE_NAMES[0])
      || getStoredThemeVariant()
      || 'light';
    if (!indigoBaseTokens[variant]) {
      indigoBaseTokens[variant] = liveTokenDefaults();
    }
  } catch (error) {}
};

const baseTokensFor = (variant) => indigoBaseTokens[variant] || {};

const buildThemeTokens = (tokens) => {
  const result = { ...(tokens || {}) };
  INDIGO_THEME_FAMILIES.forEach((family) => {
    const base = result[`--pgn-color-${family}-base`];
    if (!hexToRgb(base)) {
      return;
    }
    result[`--pgn-color-action-default-${family}-base`] = darkenColor(base, 0.1);
    Object.keys(INDIGO_THEME_SHADE_MIX).forEach((shade) => {
      const mix = INDIGO_THEME_SHADE_MIX[shade];
      const value = mix ? mixColor(base, mix[0], mix[1]) : rgbToHex(hexToRgb(base));
      result[`--pgn-color-${family}-${shade}`] = value;
      result[`--pgn-color-action-default-${family}-${shade}`] = darkenColor(value, 0.1);
    });
  });
  const primary = result['--pgn-color-primary-base'];
  if (hexToRgb(primary)) {
    const encoded = `%23${primary.replace('#', '').toUpperCase()}FF`;
    Object.keys(INDIGO_THEME_ICON_TOKENS).forEach((name) => {
      result[name] = INDIGO_THEME_ICON_TOKENS[name].replace('%%HEX%%', encoded);
    });
    result['--pgn-color-btn-text-primary'] = readableTextOn(primary);
  }
  return result;
};

const buildThemeCss = (tokens) => {
  const built = buildThemeTokens(tokens);
  const declarations = Object.keys(built)
    .map((name) => `${name}:${built[name]};`)
    .join('');
  return `:root{${declarations}}`;
};

const applyThemeTokens = (tokens) => {
  try {
    let style = document.getElementById(INDIGO_THEME_STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = INDIGO_THEME_STYLE_ID;
    }
    style.textContent = buildThemeCss(tokens);
    document.head.appendChild(style);
  } catch (error) {}
};

const clearThemeTokens = () => {
  try {
    const style = document.getElementById(INDIGO_THEME_STYLE_ID);
    if (style) {
      style.remove();
    }
  } catch (error) {}
};

const getStoredThemeVariant = () => {
  try {
    for (const name of INDIGO_THEME_COOKIE_NAMES) {
      const value = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1];
      if (value !== undefined && value !== '' && value !== 'undefined') {
        return value;
      }
    }
    for (const name of INDIGO_THEME_COOKIE_NAMES) {
      const value = window.localStorage.getItem(name);
      if (value && value !== 'undefined') {
        return value;
      }
    }
  } catch (error) {}
  return undefined;
};

const themeVariantLinkName = (href) => {
  for (const pattern of INDIGO_THEME_VARIANT_LINK_PATTERNS) {
    const match = pattern.exec(href);
    if (match) {
      return match[1];
    }
  }
  return null;
};

const syncThemeVariantStylesheets = (variant) => {
  try {
    document.querySelectorAll('link[rel*="stylesheet"]').forEach((link) => {
      const name = themeVariantLinkName(link.getAttribute('href') || '');
      if (!name) {
        return;
      }
      link.setAttribute('rel', name === variant ? 'stylesheet' : 'alternate stylesheet');
    });
  } catch (error) {}
};

const notifyThemeVariantIframes = (variant) => {
  try {
    document.querySelectorAll('iframe').forEach((frame) => {
      frame.contentWindow?.postMessage({ 'indigo-toggle-dark': variant }, '*');
    });
  } catch (error) {}
};

const persistThemeVariant = (variant) => {
  try {
    const serverURL = new URL(getConfig().LMS_BASE_URL);
    const today = new Date();
    const expires = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + INDIGO_THEME_COOKIE_EXPIRY_DAYS,
    );
    INDIGO_THEME_COOKIE_NAMES.forEach((name) => {
      document.cookie = `${name}=${variant}; domain=${serverURL.hostname}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      window.localStorage.setItem(name, variant);
    });
    INDIGO_THEME_ATTRIBUTE_NAMES.forEach((attribute) => {
      document.documentElement.setAttribute(attribute, variant);
    });
  } catch (error) {}
  syncThemeVariantStylesheets(variant);
  notifyThemeVariantIframes(variant);
};

const getCookieUsername = () => {
  try {
    const name = getConfig().ACCESS_TOKEN_COOKIE_NAME || INDIGO_THEME_JWT_COOKIE_NAME;
    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.slice(name.length + 1);
    if (!value) {
      return null;
    }
    const payload = value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(payload)).preferred_username || null;
  } catch (error) {
    return null;
  }
};

const clearThemeCache = () => {
  try {
    window.localStorage.removeItem(INDIGO_THEME_STORAGE_KEY);
  } catch (error) {}
};

const readThemeCache = () => {
  try {
    const raw = window.localStorage.getItem(INDIGO_THEME_STORAGE_KEY);
    const cache = raw ? JSON.parse(raw) : null;
    const username = getCookieUsername();
    if (!cache || !username || cache.username !== username) {
      clearThemeCache();
      return null;
    }
    return cache;
  } catch (error) {
    return null;
  }
};

const writeThemeCache = (payload) => {
  try {
    const username = getAuthenticatedUser()?.username || getCookieUsername();
    if (!username) {
      clearThemeCache();
      return;
    }
    window.localStorage.setItem(INDIGO_THEME_STORAGE_KEY, JSON.stringify({ ...payload, username }));
  } catch (error) {}
};

const effectiveTokensFor = (payload, presetSlug) => {
  const overrides = (payload?.overrides || {})[presetSlug] || {};
  const result = {};
  Object.keys(overrides).forEach((token) => {
    if (overrides[token]) {
      result[token] = overrides[token];
    }
  });
  return result;
};

let indigoThemeRequest = null;

const resetUserThemeRequest = () => {
  indigoThemeRequest = null;
};

const fetchUserTheme = () => {
  if (!indigoThemeRequest) {
    indigoThemeRequest = getAuthenticatedHttpClient()
      .get(`${getConfig().LMS_BASE_URL}${INDIGO_THEME_API_PATH}`)
      .catch((error) => {
        resetUserThemeRequest();
        throw error;
      });
  }
  return indigoThemeRequest;
};

const saveThemeVariant = (variant) => {
  if (!getConfig().INDIGO_ENABLE_DYNAMIC_THEME || !getAuthenticatedUser()) {
    return Promise.resolve();
  }
  return fetchUserTheme()
    .then(({ data }) => {
      const preset = (data?.presets || []).find((item) => item.variant === variant);
      if (!preset || preset.slug === data.preset) {
        return null;
      }
      return getAuthenticatedHttpClient()
        .patch(`${getConfig().LMS_BASE_URL}${INDIGO_THEME_API_PATH}`, { preset: preset.slug })
        .then(({ data: updated }) => {
          resetUserThemeRequest();
          writeThemeCache(updated);
          return updated;
        });
    })
    .catch((error) => {
      logError(error);
    });
};

const runtimeIfReady = () => {
  let config = null;
  try {
    config = getConfig() || null;
  } catch (error) {
    return null;
  }
  if (!config || !config.LMS_BASE_URL) {
    return null;
  }
  try {
    getAuthenticatedHttpClient();
  } catch (error) {
    return null;
  }
  return config;
};

const whenRuntimeReady = () => new Promise((resolve) => {
  const started = Date.now();
  const check = () => {
    const config = runtimeIfReady();
    if (config) {
      resolve(config);
      return;
    }
    if (Date.now() - started > INDIGO_RUNTIME_TIMEOUT_MS) {
      resolve(null);
      return;
    }
    window.setTimeout(check, INDIGO_RUNTIME_POLL_MS);
  };
  check();
});

const resetRequested = () => {
  try {
    return new URLSearchParams(window.location.search).has(INDIGO_THEME_RESET_PARAM);
  } catch (error) {
    return false;
  }
};

const dropResetParam = () => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(INDIGO_THEME_RESET_PARAM);
    window.location.replace(url.toString());
  } catch (error) {}
};

const resetStoredTheme = () => getAuthenticatedHttpClient()
  .delete(`${getConfig().LMS_BASE_URL}${INDIGO_THEME_API_PATH}`)
  .then(() => {
    resetUserThemeRequest();
    clearThemeTokens();
    clearThemeCache();
  })
  .catch((error) => {
    logError(error);
  })
  .then(dropResetParam);

const adoptThemeVariant = (variant, data) => {
  const preset = (data?.presets || []).find((item) => item.variant === variant);
  if (!preset) {
    return;
  }
  persistThemeVariant(variant);
  getAuthenticatedHttpClient()
    .patch(`${getConfig().LMS_BASE_URL}${INDIGO_THEME_API_PATH}`, { preset: preset.slug })
    .then(({ data: updated }) => {
      resetUserThemeRequest();
      writeThemeCache(updated);
      applyThemeTokens(effectiveTokensFor(updated, updated.preset));
    })
    .catch((error) => {
      logError(error);
    });
};

const applyThemePayload = (data) => {
  writeThemeCache(data);
  const applied = document.documentElement.getAttribute(INDIGO_THEME_ATTRIBUTE_NAMES[0]);
  const browserVariant = getStoredThemeVariant() || applied;
  if (!data.stored && browserVariant && data.variant && browserVariant !== data.variant) {
    adoptThemeVariant(browserVariant, data);
    return;
  }
  if (data.variant && data.variant !== applied) {
    persistThemeVariant(data.variant);
  }
  applyThemeTokens(effectiveTokensFor(data, data.preset));
};

let indigoThemeStarted = false;

const startIndigoTheme = () => {
  if (indigoThemeStarted) {
    return;
  }
  indigoThemeStarted = true;
  captureBaseTokens();
  whenRuntimeReady().then((config) => {
    if (!config || config.INDIGO_ENABLE_DYNAMIC_THEME === false || !getCookieUsername()) {
      clearThemeTokens();
      clearThemeCache();
      resetUserThemeRequest();
      return;
    }
    if (resetRequested()) {
      resetStoredTheme();
      return;
    }
    const cache = readThemeCache();
    if (cache && cache.preset) {
      applyThemeTokens(effectiveTokensFor(cache, cache.preset));
    }
    fetchUserTheme()
      .then(({ data }) => {
        applyThemePayload(data);
      })
      .catch((error) => {
        logError(error);
      });
  });
};

startIndigoTheme();

const ApplyUserTheme = () => {
  useEffect(() => {
    startIndigoTheme();
  }, []);

  return (<div />);
};
