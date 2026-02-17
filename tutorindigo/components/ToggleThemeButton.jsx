
const ToggleThemeButton = () => {
  const intl = useIntl();
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(false);

  const themeCookie = 'selected-paragon-theme-variant';
  const themeCookieExpiry = 90; // days
  const isThemeToggleEnabled = getConfig().INDIGO_ENABLE_DARK_TOGGLE;

  const getCookie = (name) => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1];
  };

  const setCookie = (name, value, { domain, path, expires }) => {
    document.cookie = `${name}=${value}; domain=${domain}; path=${path}; expires=${expires.toUTCString()}; SameSite=Lax`;
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

    if (getCookie(themeCookie) === 'dark') {
      document.documentElement.setAttribute('data-paragon-theme-variant', 'light');
      setIsDarkThemeEnabled(false);
      theme = 'light';
    } else {
      document.documentElement.setAttribute('data-paragon-theme-variant', 'dark');
      setIsDarkThemeEnabled(true);
      theme = 'dark';
    }

    window.localStorage.setItem(themeCookie, theme);
    setTimeout(() => {
      setCookie(themeCookie, theme, getCookieOptions(serverURL));
      window.location.reload();
    }, 1);
  };

  useEffect(() => {
    if (!getCookie(themeCookie) || getCookie(themeCookie) === 'undefined') {
      return;
    }
    if (getCookie(themeCookie) !== window.localStorage.getItem(themeCookie)) {
      window.localStorage.setItem(themeCookie, getCookie(themeCookie));
      window.location.reload();
    }
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
            defaultChecked={getCookie(themeCookie) === "dark"}
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
