export const API_URL = 'https://backendcds.ciisnetwork.in/api'
export const API_URL_IMG = 'https://backendcds.ciisnetwork.in/'
export const SOCKET_URL = 'https://backendcds.ciisnetwork.in/'

// export const API_URL = 'http://127.0.0.1:3000/api'
// export const API_URL_IMG = 'http://127.0.0.1:3000/'
// export const SOCKET_URL = 'http://127.0.0.1:3000'

// Optional TURN server support for better real-world video calling across NATs
export const TURN_URL = import.meta.env.VITE_TURN_URL || ''
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || ''
export const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || ''

export default API_URL;