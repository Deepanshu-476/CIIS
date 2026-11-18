export const API_URL = (import.meta.env.VITE_API_URL || 'https://backendcds.ciisnetwork.in/api').replace(/\/+$/, '');
export const API_ORIGIN = new URL(API_URL).origin;
export const API_URL_IMG = import.meta.env.VITE_API_URL_IMG || `${API_ORIGIN}/`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_ORIGIN;

// export const API_URL = 'https://backendappapp.ciisnetwork.in/api'
// export const API_URL_IMG = 'https://backendappapp.ciisnetwork.in/'
// export const SOCKET_URL = 'https://backendappapp.ciisnetwork.in'

// // export const API_URL = 'https://backendapp.ciisnetwork.in/api'
// // export const API_URL_IMG = 'https://backendapp.ciisnetwork.in/'
// // export const SOCKET_URL = 'https://backendapp.ciisnetwork.in/'

// export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
// export const API_URL_IMG = import.meta.env.VITE_API_URL_IMG || 'http://127.0.0.1:3000/';
// export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:3000';



export const CHAT_UPLOAD_ORIGINS = [
  API_URL_IMG,
  // 'https://backendappapp.ciisnetwork.in/',
  'https://backendcds.ciisnetwork.in/',
];

// The mobile app talks to a separate backend process with its own uploads
// folder, so files uploaded from the app only exist on that origin.
export const UPLOAD_FALLBACK_ORIGINS = [
  API_URL_IMG,
  'https://backendapp.ciisnetwork.in/',
  'https://backendcds.ciisnetwork.in/',
];

export default API_URL; 
