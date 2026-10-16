import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { HexColorPicker } from 'react-colorful';

import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient, getAuthenticatedUser } from '@edx/frontend-platform/auth';
import {
  ActionRow, Alert, Badge, breakpoints, Button, Card, Form, Icon, ModalPopup, Spinner, useMediaQuery,
} from '@openedx/paragon';
import { Calendar, Nightlight, WbSunny } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

// @openedx/frontend-base-compat stands in for @edx/frontend-platform in
// frontend-base site builds and exports only ".", "./auth" and "./i18n".
// logError lives behind "./logging", so shim it rather than import it.
const logError = (error) => { console.error(error); };
