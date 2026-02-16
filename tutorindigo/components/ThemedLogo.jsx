
const ThemedLogo = () => {
  const BASE_URL = getConfig().LMS_BASE_URL;

  return (
    <>
      <style>
        {`
          #root header .logo-image.logo-white {
            display: none;
          }
          [data-paragon-theme-variant="dark"] #root header .logo-image {
            display: none;
          }
          [data-paragon-theme-variant="dark"] #root header .logo-white {
            display: block;
          }
        `}
      </style>
      <a href={`${BASE_URL}/dashboard`} title="Open edX" className="logo">
        <img className="logo-image" src={`${BASE_URL}/static/indigo/images/logo.png`} alt="Open edX" />
        <img className="logo-image logo-white" src={`${BASE_URL}/static/indigo/images/logo-white.png`} alt="Open edX" />
      </a>
    </>
  );
};
