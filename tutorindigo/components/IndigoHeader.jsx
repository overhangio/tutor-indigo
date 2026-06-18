
const IndigoHeader = () => {
  const BASE_URL = getConfig().LMS_BASE_URL;
  const currentPath = window.location.pathname;

  // Read nav links from MFE_CONFIG — defined once in openlms_brand.py
  // Falls back to sensible defaults if not configured
  const navLinks = getConfig().HEADER_NAV_LINKS ?? [
    { title: 'My Courses', url: '/dashboard' },
    { title: 'Discover',   url: '/courses'   },
  ];

  return navLinks.map((link) => {
    const href = link.url.startsWith('http') ? link.url : `${BASE_URL}${link.url}`;
    const isActive = currentPath === link.url || currentPath.startsWith(link.url + '/');

    return React.createElement(
      'a',
      {
        key: link.url,
        href,
        className: `nav-link${isActive ? ' active' : ''}`,
        'aria-current': isActive ? 'page' : undefined,
      },
      link.title,
    );
  });
};
