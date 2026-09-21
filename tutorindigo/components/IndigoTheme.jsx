
const INDIGO_THEME_STORAGE_KEY = 'indigo-user-theme';
const INDIGO_THEME_STYLE_ID = 'indigo-user-theme';
const INDIGO_THEME_API_PATH = '/api/indigo/v1/theme/';

const INDIGO_THEME_TOKENS = [
  { token: '--pgn-color-primary-base', label: 'Primary' },
  { token: '--pgn-color-primary-light', label: 'Primary light' },
  { token: '--pgn-color-brand-base', label: 'Secondary' },
  { token: '--pgn-color-text-base', label: 'Text' },
  { token: '--pgn-color-info-base', label: 'Info' },
];

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
const INDIGO_THEME_HEX_RE = /^#[0-9a-fA-F]{6}$/;

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
  const preset = (payload?.presets || []).find((item) => item.slug === presetSlug);
  const overrides = (payload?.overrides || {})[presetSlug] || {};
  return { ...(preset?.tokens || {}), ...overrides };
};

const applyCachedTheme = () => {
  try {
    const cache = readThemeCache();
    if (cache && cache.preset) {
      applyThemeTokens(effectiveTokensFor(cache, cache.preset));
    } else {
      clearThemeTokens();
    }
  } catch (error) {}
};

applyCachedTheme();

subscribe(APP_READY, () => {
  if (!getConfig().INDIGO_ENABLE_DYNAMIC_THEME) {
    clearThemeTokens();
    clearThemeCache();
  }
});

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

const ApplyUserTheme = () => {
  const { paragonTheme } = useContext(AppContext);
  const isDynamicThemeEnabled = getConfig().INDIGO_ENABLE_DYNAMIC_THEME;

  useEffect(() => {
    if (!isDynamicThemeEnabled || !getAuthenticatedUser()) {
      clearThemeTokens();
      clearThemeCache();
      resetUserThemeRequest();
      return undefined;
    }

    let cancelled = false;
    fetchUserTheme()
      .then(({ data }) => {
        if (cancelled) {
          return;
        }
        writeThemeCache(data);
        const appliedVariant = document.documentElement.getAttribute('data-paragon-theme-variant');
        if (data.variant && data.variant !== appliedVariant) {
          persistThemeVariant(data.variant);
          paragonTheme?.setThemeVariant?.(data.variant);
        }
        applyThemeTokens(effectiveTokensFor(data, data.preset));
      })
      .catch((error) => {
        logError(error);
      });

    return () => { cancelled = true; };
  }, [isDynamicThemeEnabled]);

  return (<div />);
};
