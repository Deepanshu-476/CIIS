const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:3000' : 'https://backendappapp.ciisnetwork.in');

export const API_URL = `${BACKEND_ORIGIN.replace(/\/$/, '')}/api`;
export const API_URL_IMG = `${BACKEND_ORIGIN.replace(/\/$/, '')}/`;
export const SOCKET_URL = BACKEND_ORIGIN.replace(/\/$/, '');

export const TURN_URL = import.meta.env.VITE_TURN_URL || ''                 
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || ''
export const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || ''

export default API_URL;       