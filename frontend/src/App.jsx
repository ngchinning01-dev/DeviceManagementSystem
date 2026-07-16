// Top-level route table. Every route except /login is wrapped in RequireAuth
// (redirects to /login if not signed in) and rendered inside Layout (sidebar +
// page content). admin-users is additionally wrapped in RequireAdmin so only
// accounts with is_admin=True can reach the Manage Access page.
import { Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth, usePermissions } from './context/AuthContext'
import { AssistantProvider } from './context/AssistantContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Branches from './pages/Branches'
import Devices from './pages/Devices'
import Users from './pages/Users'
import Maintenance from './pages/Maintenance'
import BranchDetail from './pages/BranchDetail'
import DeviceDetail from './pages/DeviceDetail'
import UserDetail from './pages/UserDetail'
import AdminUsers from './pages/AdminUsers'
import Assistant from './pages/Assistant'

function RequireAuth({ children }) {
  const { token, loading } = useAuth()
  if (token && loading) return null
  return token ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }) {
  const { isAdmin } = usePermissions()
  return isAdmin ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <AuthProvider>
      <AssistantProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="branches" element={<Branches />} />
            <Route path="branches/:branchId" element={<BranchDetail />} />
            <Route path="devices" element={<Devices />} />
            <Route path="devices/:deviceId" element={<DeviceDetail />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:userId" element={<UserDetail />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="assistant" element={<Assistant />} />
            <Route
              path="admin-users"
              element={
                <RequireAdmin>
                  <AdminUsers />
                </RequireAdmin>
              }
            />
          </Route>
        </Routes>
      </AssistantProvider>
    </AuthProvider>
  )
}

export default App
