import { API_URL as configuredApiUrl } from '../utils/env';

// Keep every authenticated request on the same production API host.  A single
// source prevents a user from signing in on one Railway address and sending a
// chat request to another.
const FALLBACK_API_URL = 'https://api.invest-book.com/api';

export const API_URL = (configuredApiUrl || FALLBACK_API_URL).replace(/\/$/, '');
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

