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
      Array.from({ length: iframesLength }).forEach((_, index) => {
        const style = document.createElement('style');
        style.textContent = `
          body{
            background-color: #0D0D0E;
            color: #ccc;
          }
          a {color: #ccc;}
          a:hover{color: #d3d3d3;}
          `;
        if (iframes[index].contentDocument) { iframes[index].contentDocument.head.appendChild(style); }
      });
    }
  };

  useEffect(() => {
    const theme = cookies.get(themeCookie);

    // - When page loads, Footer loads before MFE content. Since there is no iframe on page,
    // it does not append any class. MutationObserver observes changes in DOM and hence appends dark
    // attributes when iframe is added. After 15 sec, this observer is destroyed to conserve resources. 
    // - It has been added outside dark-theme condition so that it can be removed on Component Unmount.
    // - Observer can be passed to `addDarkThemeToIframes` function and disconnected after observing Iframe.
    // This approach has a limitation: the observer first detects the iframe and then detects the docSrc. 
    // We need to wait for docSrc to fully load before appending the style tag.
    const observer = new MutationObserver(() => {
      addDarkThemeToIframes();
    });

    if (isThemeToggleEnabled && theme === 'dark') {
      document.body.classList.add('indigo-dark-theme');
      
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer?.disconnect(), 15000); // clear after 15 sec to avoid resource usage

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
