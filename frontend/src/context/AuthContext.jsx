// Holds the signed-in admin's token/identity/permissions for the whole app.
// The token is persisted to localStorage (so a refresh stays logged in); the
// admin object (username, is_admin, permissions) is not, so it's re-fetched
// from /auth/me on load. usePermissions() is the read/add/edit/delete/isAdmin
// helper that pages use to show/hide actions.
import { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(!!token)

  const login = (t, adminPayload) => {
    localStorage.setItem('token', t)
    setToken(t)
    setAdmin(adminPayload)
    setLoading(false)
  }

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {})
    localStorage.removeItem('token')
    setToken(null)
    setAdmin(null)
  }

  // Re-hydrate identity/permissions from the server on page load, since
  // only the token (not the admin payload) survives a refresh.
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    apiClient
      .get('/auth/me')
      .then((res) => setAdmin(res.data))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onLogout = () => { setToken(null); setAdmin(null) }
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  return (
    <AuthContext.Provider value={{ token, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export function usePermissions() {
  const { admin } = useAuth()
  const permissions = admin?.permissions || {}
  return {
    canRead: !!permissions.read,
    canAdd: !!permissions.add,
    canEdit: !!permissions.edit,
    canDelete: !!permissions.delete,
    isAdmin: !!admin?.is_admin,
  }
}
