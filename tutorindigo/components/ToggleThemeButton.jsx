
const ToggleThemeButton = () => {
  const intl = useIntl();
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(false);

  const themeCookieNames = [
    'selected-paragon-theme-variant',
    'selected-theme-variant',
  ];
  const themeAttributeNames = [
    'data-paragon-theme-variant',
    'data-theme-variant',
  ];
  const primaryCookie = themeCookieNames[0];
  const themeCookieExpiry = 90; // days
  const isThemeToggleEnabled = getConfig().INDIGO_ENABLE_DARK_TOGGLE;

  const getCookie = (name) => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1];
  };

  const getThemeCookie = () => {
    for (const name of themeCookieNames) {
      const value = getCookie(name);
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  };

  const setCookie = (name, value, { domain, path, expires }) => {
    document.cookie = `${name}=${value}; domain=${domain}; path=${path}; expires=${expires.toUTCString()}; SameSite=Lax`;
  };

  const setThemeCookies = (value, opts) => {
    for (const name of themeCookieNames) {
      setCookie(name, value, opts);
    }
  };
  const setThemeAttribute = (theme) => {
    for (const attr of themeAttributeNames) {
      document.documentElement.setAttribute(attr, theme);
    }
  };

  const serverURL = new URL(getConfig().LMS_BASE_URL);

  const getCookieExpiry = () => {
    const today = new Date();
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + themeCookieExpiry
    );
  };

  const getCookieOptions = (serverURL) => ({
    domain: serverURL.hostname,
    path: '/',
    expires: getCookieExpiry(),
  });

  const onToggleTheme = () => {
    let theme = '';

    if (getThemeCookie() === 'dark') {
      setThemeAttribute('light');
      setIsDarkThemeEnabled(false);
      theme = 'light';
    } else {
      setThemeAttribute('dark');
      setIsDarkThemeEnabled(true);
      theme = 'dark';
    }

    for (const name of themeCookieNames) {
        window.localStorage.setItem(name, theme);
    }
    setTimeout(() => {
      setThemeCookies(theme, getCookieOptions(serverURL));
      window.location.reload();
    }, 1);
  };

  useEffect(() => {
    const cookie = getThemeCookie();
    if (!cookie || cookie === 'undefined') {
      return;
    }
    if (cookie !== window.localStorage.getItem(primaryCookie)) {
      for (const name of themeCookieNames) {
          window.localStorage.setItem(name, cookie);
      }
      window.location.reload();
    }
    document.documentElement.setAttribute(themeAttributeNames[0], cookie);
  }, []);

  const handleKeyUp = (event) => {
    if (event.key === "Enter") {
      onToggleTheme();
    }
  };

  if (!isThemeToggleEnabled) {
    return <div />;
  }

  const messages = {
    "header.user.theme": {
      id: "header.user.theme",
      defaultMessage: "Toggle Theme",
      description: "Toggle between light and dark theme",
    },
  };

  return (
    <div className="theme-toggle-button mr-3">
      <div className="light-theme-icon">
        <Icon src={WbSunny} />
      </div>
      <div className="toggle-switch">
        <label htmlFor="theme-toggle-checkbox" className="switch">
          <input
            id="theme-toggle-checkbox"
            defaultChecked={getThemeCookie() === "dark"}
            onChange={onToggleTheme}
            onKeyUp={handleKeyUp}
            type="checkbox"
            title={intl.formatMessage(messages["header.user.theme"])}
          />
          <span className="slider round" />
          <span id="theme-label" className="sr-only">{`Switch to ${isDarkThemeEnabled ? "Light" : "Dark"
            } Mode`}</span>
        </label>
      </div>
      <div className="dark-theme-icon">
        <Icon src={Nightlight} />
      </div>
    </div>
  );
};
