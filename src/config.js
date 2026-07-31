const DEFAULT_API_BASE_URL = 'https://backendcds.ciisnetwork.in'
const configuredBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

export const API_URL = `${configuredBaseUrl}/api`
export const API_URL_IMG = `${configuredBaseUrl}/`
export const SOCKET_URL = configuredBaseUrl

export const TURN_URL = import.meta.env.VITE_TURN_URL || ''                 
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || ''
export const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || ''

export default API_URL;
