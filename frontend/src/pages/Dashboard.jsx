import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'

// Small card displaying a single labeled stat. If `to` is provided, the whole
// card links to that route.
function StatCard({ label, value, to }) {
  const content = (
    <div className="rounded-lg bg-white p-4 shadow-sm h-full">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block hover:shadow-md transition-shadow">
        {content}
      </Link>
    )
  }

  return content
}

// Dashboard page: fetches summary stats from the API and shows them as stat cards
// and breakdowns, each linking into a filtered Devices/Maintenance view.
function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  // Load summary stats once on mount.
  useEffect(() => {
    apiClient
      .get('/dashboard/summary')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Dashboard</h2>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Could not load dashboard data: {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={stats?.total_devices ?? '—'} to="/devices" />
        <StatCard label="Branches" value={stats?.total_branches ?? '—'} to="/branches" />
        <StatCard
          label="Active Devices"
          value={stats?.active_devices ?? '—'}
          to="/devices?status=Active"
        />
        <StatCard
          label="Open Maintenance Issues"
          value={stats?.open_maintenance ?? '—'}
          to="/maintenance?open=true"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Devices by Branch</h3>
          <ul className="text-sm divide-y divide-slate-100">
            {stats?.devices_by_branch.map((entry) => (
              <li key={entry.branch_name} className="flex justify-between py-1.5">
                <Link
                  to={`/devices?branch_id=${entry.branch_id}`}
                  className="text-slate-700 hover:underline"
                >
                  {entry.branch_name}
                </Link>
                <span className="text-slate-500">{entry.device_count}</span>
              </li>
            ))}
            {!stats?.devices_by_branch.length && (
              <li className="py-1.5 text-slate-400">No branches yet.</li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Devices by Status</h3>
          <ul className="text-sm divide-y divide-slate-100">
            {stats &&
              Object.entries(stats.devices_by_status).map(([status, count]) => (
                <li key={status} className="flex justify-between py-1.5">
                  <Link to={`/devices?status=${status}`} className="text-slate-700 hover:underline">
                    {status}
                  </Link>
                  <span className="text-slate-500">{count}</span>
                </li>
              ))}
            {stats && Object.keys(stats.devices_by_status).length === 0 && (
              <li className="py-1.5 text-slate-400">No devices yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
