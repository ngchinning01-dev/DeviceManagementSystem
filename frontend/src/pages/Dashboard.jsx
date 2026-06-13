import { useEffect, useState } from 'react'
import apiClient from '../api/client'

// Small card displaying a single labeled stat.
function StatCard({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  )
}

// Dashboard page: fetches summary stats from the API and shows them as stat cards.
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
        <StatCard label="Total Devices" value={stats?.total_devices ?? '—'} />
        <StatCard label="Branches" value={stats?.total_branches ?? '—'} />
        <StatCard label="Active Devices" value={stats?.active_devices ?? '—'} />
        <StatCard
          label="Open Maintenance Issues"
          value={stats?.open_maintenance ?? '—'}
        />
      </div>
    </div>
  )
}

export default Dashboard
