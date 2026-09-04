const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'https://backendcds.ciisnetwork.in';

export const API_URL = import.meta.env.VITE_API_URL || `${API_ORIGIN}/api`;
export const API_URL_IMG = import.meta.env.VITE_API_URL_IMG || `${API_ORIGIN}/`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_ORIGIN;

export const TURN_URL = import.meta.env.VITE_TURN_URL || ''
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || ''
export const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || ''

export default API_URL;
