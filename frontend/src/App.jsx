import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Branches from './pages/Branches'
import Devices from './pages/Devices'
import Users from './pages/Users'
import Maintenance from './pages/Maintenance'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="branches" element={<Branches />} />
        <Route path="devices" element={<Devices />} />
        <Route path="users" element={<Users />} />
        <Route path="maintenance" element={<Maintenance />} />
      </Route>
    </Routes>
  )
}

export default App
