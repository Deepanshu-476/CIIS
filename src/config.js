const LOCAL_API_ORIGIN = 'http://127.0.0.1:3000';
const PRODUCTION_API_ORIGIN = 'https://backendcds.ciisnetwork.in';
const defaultApiOrigin = import.meta.env.DEV ? LOCAL_API_ORIGIN : PRODUCTION_API_ORIGIN;

export const API_URL = import.meta.env.VITE_API_URL || `${defaultApiOrigin}/api`;
export const API_URL_IMG = import.meta.env.VITE_API_URL_IMG || `${defaultApiOrigin}/`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultApiOrigin;
export const CHAT_UPLOAD_ORIGINS = [
  API_URL_IMG,
  'https://backendappapp.ciisnetwork.in/',
  'https://backendciisnetwork.com/',
];

export const TURN_URL = import.meta.env.VITE_TURN_URL || ''
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || ''
export const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || ''

export default API_URL; 
