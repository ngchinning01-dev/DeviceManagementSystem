// Shared axios instance used for every API call in the app.
// - Request interceptor: attaches the stored bearer token to every request.
// - Response interceptor: on a 401 from any endpoint other than the login
//   call itself, clears the stored token and broadcasts 'auth:logout' so
//   AuthContext can reset its state (e.g. session was revoked server-side).
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('token')
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(err)
  }
)

export default apiClient
