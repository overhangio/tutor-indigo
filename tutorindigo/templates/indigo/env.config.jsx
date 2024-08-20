import React, { useEffect } from 'react';

import Footer from '@edly-io/indigo-frontend-component-footer';
import { getConfig } from '@edx/frontend-platform';
import { DIRECT_PLUGIN, PLUGIN_OPERATIONS } from '@openedx/frontend-plugin-framework';
import Cookies from 'universal-cookie';

const AddDarkTheme = () => {
  useEffect(() => {
    const cookies = new Cookies();
    const themeCookieName = getConfig().THEME_COOKIE_NAME;
    if (themeCookieName && cookies.get(themeCookieName) === 'dark') {
      document.body.classList.add('indigo-dark-theme');
    }

    return () => cookies.removeChangeListener();
  }, []);
  return (<div />);
};

const themePluginSlot = {
  keepDefault: false,
  plugins: [
    {
      op: PLUGIN_OPERATIONS.Insert,
      widget: {
        id: 'default_contents',
        type: DIRECT_PLUGIN,
        priority: 1,
        RenderWidget: <Footer />,
      },
    },
    {
      op: PLUGIN_OPERATIONS.Insert,
      widget: {
        id: 'read_theme_cookie',
        type: DIRECT_PLUGIN,
        priority: 2,
        RenderWidget: AddDarkTheme,
      },
    },
  ],
};

const config = {
  pluginSlots: {
    footer_slot: themePluginSlot,
  },
};

export default config;
