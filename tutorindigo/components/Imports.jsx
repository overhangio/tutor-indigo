import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'universal-cookie';

import { getConfig } from '@edx/frontend-platform';
import {
  breakpoints, Button, Card, Icon, useMediaQuery,
} from '@openedx/paragon';
import { Calendar, Nightlight, WbSunny } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';
