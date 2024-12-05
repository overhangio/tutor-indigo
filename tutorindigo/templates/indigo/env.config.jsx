import React, { useEffect } from 'react';
import Cookies from 'universal-cookie';

import Footer from '@edly-io/indigo-frontend-component-footer';
import { getConfig } from '@edx/frontend-platform';
import { DIRECT_PLUGIN, PLUGIN_OPERATIONS } from '@openedx/frontend-plugin-framework';

let themeCookie = 'indigo-toggle-dark';
let themeCookieExpiry = 90; // days

const AddDarkTheme = () => {
  const cookies = new Cookies();
  const isThemeToggleEnabled = getConfig().INDIGO_ENABLE_DARK_TOGGLE;

  const getCookieExpiry = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + themeCookieExpiry);
  };

  const getCookieOptions = () => {
    const serverURL = new URL(getConfig().LMS_BASE_URL);
    const options = { domain: serverURL.hostname, path: '/', expires: getCookieExpiry() };
    return options;
  };

  const addDarkThemeToIframes = () => {
    const iframes = document.getElementsByTagName('iframe');
    const iframesLength = iframes.length;
    if (iframesLength > 0) {
      Array.from({ length: iframesLength }).forEach((_, ind) => {
        const style = document.createElement('style');
        style.textContent = `
          body{
            background-color: #0D0D0E;
            color: #ccc;
          }
          a {color: #ccc;}
          a:hover{color: #d3d3d3;}
          `;
        if (iframes[ind].contentDocument) { iframes[ind].contentDocument.head.appendChild(style); }
      });
    }
  };

  useEffect(() => {
    const theme = cookies.get(themeCookie);

    // When page load, Footer load before than MFE content which says that there is no iframe on page
    // hence, not append any class. MutationObserver observes changes in DOM and hence appended dark
    // attributes when iframe added. After 10 sec, we destroy this observer. 
    // Adding outside dark-theme condition so that we can remove it on Component Unmount
    const observer = new MutationObserver(() => {
      addDarkThemeToIframes();
    });

    if (isThemeToggleEnabled && theme === 'dark') {
      document.body.classList.add('indigo-dark-theme');
      
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer?.disconnect(), 15000); // clear after 10 sec to avoid resource usage

      cookies.set(themeCookie, theme, getCookieOptions());      //  on page load, update expiry
    }

    return () => observer?.disconnect();
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