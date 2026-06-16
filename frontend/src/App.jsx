import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Branches from './pages/Branches'
import Devices from './pages/Devices'
import Users from './pages/Users'
import Maintenance from './pages/Maintenance'
import BranchDetail from './pages/BranchDetail'
import DeviceDetail from './pages/DeviceDetail'
import UserDetail from './pages/UserDetail'

// Defines the page routes, all rendered inside the shared Layout (sidebar + content area).
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
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
  )
}

export default App
