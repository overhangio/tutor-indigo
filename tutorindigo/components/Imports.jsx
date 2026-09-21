import React, { useContext, useEffect, useRef, useState } from 'react';
import Cookies from 'universal-cookie';
import { HexColorPicker } from 'react-colorful';

import { APP_READY, getConfig, subscribe } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient, getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { logError } from '@edx/frontend-platform/logging';
import { AppContext } from '@edx/frontend-platform/react';
import {
  ActionRow, Alert, Badge, Button, Card, Form, Icon, ModalPopup, Spinner,
} from '@openedx/paragon';
import { Nightlight, WbSunny } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';
