const localBackendUrl = 'http://127.0.0.1:3000'
const productionBackendUrl = 'https://backendcds.ciisnetwork.in'
const backendUrl = (import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? localBackendUrl : productionBackendUrl)).replace(/\/$/, '')

export const API_URL = `${backendUrl}/api`
export const API_URL_IMG = `${backendUrl}/`
export const SOCKET_URL = backendUrl

export const TURN_URL = import.meta.env.VITE_TURN_URL || ''                 
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || ''
export const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || ''

export default API_URL;
