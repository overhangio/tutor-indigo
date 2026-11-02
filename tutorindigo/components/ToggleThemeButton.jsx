
const ToggleThemeButton = () => {
  const intl = useIntl();
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(
    () => getStoredThemeVariant() === 'dark',
  );

  const isThemeToggleEnabled = getConfig().INDIGO_ENABLE_DARK_TOGGLE;

  const onToggleTheme = () => {
    const theme = getStoredThemeVariant() === 'dark' ? 'light' : 'dark';
    setIsDarkThemeEnabled(theme === 'dark');
    persistThemeVariant(theme);

    saveThemeVariant(theme).then(() => {
      window.location.reload();
    });
  };

  useEffect(() => {
    const variant = getStoredThemeVariant();
    if (!variant) {
      return;
    }
    if (variant !== window.localStorage.getItem(INDIGO_THEME_COOKIE_NAMES[0])) {
      persistThemeVariant(variant);
      window.location.reload();
    }
    applyThemeVariant(variant);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDarkThemeEnabled(
        root.getAttribute(INDIGO_THEME_ATTRIBUTE_NAMES[0]) === 'dark',
      );
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: INDIGO_THEME_ATTRIBUTE_NAMES,
    });
    return () => observer.disconnect();
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
            checked={isDarkThemeEnabled}
            onChange={onToggleTheme}
            onKeyUp={handleKeyUp}
            type="checkbox"
            title={intl.formatMessage(messages["header.user.theme"])}
          />
          <span className="slider round" />
          <span id="theme-label" className="sr-only">{`Switch to ${isDarkThemeEnabled ? "Light" : "Dark"} Mode`}</span>
        </label>
      </div>
      <div className="dark-theme-icon">
        <Icon src={Nightlight} />
      </div>
    </div>
  );
};
