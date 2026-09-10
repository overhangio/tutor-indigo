
const MobileViewHeader = () => {
  const config = getConfig();
  const intl = useIntl();
  const messages = {
    "mobile.view.header.logo.altText": {
      id: "mobile.view.header.logo.altText",
      defaultMessage: "My Open edX",
      description: "alt text for the mobile view header logo",
    },
  };

  const BASE_URL = config.LMS_BASE_URL;

  return (
    <>
      <style>
        {`
          #root .logo-image.logo-white {
            display: none;
          }
          [data-paragon-theme-variant="dark"] #root .logo-image {
            display: none;
          }
          [data-paragon-theme-variant="dark"] #root .logo-white {
            display: block;
          }
        `}
      </style>
      <a href={`${BASE_URL}/dashboard`} title="Open edX" className="logo">
        <img className="logo-image" src={`${BASE_URL}/static/indigo/images/paradigma-mark.svg`} alt="Paradigma" />
        <img className="logo-image logo-white" src={`${BASE_URL}/static/indigo/images/paradigma-mark-white.svg`} alt="Paradigma" />
      </a>
    </>
  );
};
