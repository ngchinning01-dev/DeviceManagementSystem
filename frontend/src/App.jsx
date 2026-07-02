import { Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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

function RequireAuth({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
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
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
