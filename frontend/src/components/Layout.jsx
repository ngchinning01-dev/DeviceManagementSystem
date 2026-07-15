import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth, usePermissions } from '../context/AuthContext'

function Layout() {
  const { admin, logout } = useAuth()
  const { isAdmin } = usePermissions()
  const navigate = useNavigate()

  const navItems = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/branches', label: 'Branches' },
    { to: '/devices', label: 'Devices' },
    { to: '/users', label: 'Users' },
    { to: '/maintenance', label: 'Maintenance' },
    { to: '/assistant', label: 'Assistant' },
    ...(isAdmin ? [{ to: '/admin-users', label: 'Manage Access' }] : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 p-4 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <h1 className="text-lg font-semibold mb-6 px-2">Device Manager</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {admin && (
          <p className="px-2 text-xs text-slate-400 mb-1">Signed in as {admin.username}</p>
        )}
        <button
          onClick={handleLogout}
          className="mt-1 text-left rounded px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
