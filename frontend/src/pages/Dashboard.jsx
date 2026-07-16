// Landing page: summary stat cards, warranty/overdue-maintenance alerts, and
// charts (devices by status/branch, maintenance records per month) built with
// Recharts. Stat cards and chart segments link/navigate into the filtered
// Devices or Maintenance list (e.g. clicking the "Active" pie slice goes to
// /devices?status=Active), so the dashboard doubles as a set of shortcuts.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, CartesianGrid,
} from 'recharts'
import apiClient from '../api/client'

const STATUS_COLORS = {
  Active: '#10B981',
  Inactive: '#64748B',
  'Under Maintenance': '#FF9100',
  Retired: '#D50000',
}

const BAR_COLOR = '#6366F1'
const TREND_COLOR = '#3B82F6'

// Convert a '2026-07' bucket from the maintenance-trend API into a short
// chart-axis label like "Jul '26".
function formatMonth(ym) {
  const [year, month] = ym.split('-')
  const label = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'short' })
  return `${label} '${year.slice(2)}`
}

function StatCard({ label, value, to }) {
  const content = (
    <div className="rounded-lg bg-white p-4 shadow-sm h-full">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  )
  if (to) {
    return <Link to={to} className="block hover:shadow-md transition-shadow">{content}</Link>
  }
  return content
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    apiClient.get('/dashboard/summary')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
    apiClient.get('/dashboard/maintenance-trend')
      .then((res) => setTrend(res.data))
      .catch(() => {})
    apiClient.get('/dashboard/alerts')
      .then((res) => setAlerts(res.data))
      .catch(() => {})
  }, [])

  const statusData = stats
    ? Object.entries(stats.devices_by_status).map(([name, value]) => ({ name, value }))
    : []

  const branchData = stats?.devices_by_branch ?? []

  const trendData = trend.map((d) => ({ ...d, label: formatMonth(d.month) }))

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Dashboard</h2>

      {error && (
        <p className="text-sm text-red-600 mb-4">Could not load dashboard data: {error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={stats?.total_devices ?? '—'} to="/devices" />
        <StatCard label="Branches" value={stats?.total_branches ?? '—'} to="/branches" />
        <StatCard label="Active Devices" value={stats?.active_devices ?? '—'} to="/devices?status=Active" />
        <StatCard label="Open Maintenance Issues" value={stats?.open_maintenance ?? '—'} to="/maintenance?open=true" />
      </div>

      {alerts && (alerts.warranty_alerts.length > 0 || alerts.overdue_maintenance.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {alerts.warranty_alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Warranty Alerts</h3>
              <ul className="divide-y divide-slate-100">
                {alerts.warranty_alerts.map((d) => (
                  <li key={d.device_id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <Link to={`/devices/${d.device_id}`} className="text-slate-700 hover:underline">
                        {d.device_name}
                      </Link>
                      <span className="text-slate-400"> · {d.branch_name}</span>
                    </div>
                    <span className={d.days_remaining < 0 ? 'text-red-600' : 'text-amber-600'}>
                      {d.days_remaining < 0
                        ? `Expired ${Math.abs(d.days_remaining)}d ago`
                        : `Expires in ${d.days_remaining}d`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {alerts.overdue_maintenance.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Overdue Maintenance</h3>
              <ul className="divide-y divide-slate-100">
                {alerts.overdue_maintenance.map((m) => (
                  <li key={m.maintenance_id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <Link to={`/devices/${m.device_id}`} className="text-slate-700 hover:underline">
                        {m.device_name}
                      </Link>
                      <span className="text-slate-400"> · {m.issue}</span>
                    </div>
                    <span className="text-red-600">Open {m.days_open}d</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Devices by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={110}
                  dataKey="value"
                  onClick={(entry) => navigate(`/devices?status=${entry.name}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-4">No devices yet.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Devices by Branch</h3>
          {branchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(220, branchData.length * 36)}>
              <BarChart
                data={branchData}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="branch_name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar
                  dataKey="device_count"
                  name="Devices"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry) => navigate(`/devices?branch_id=${entry.branch_id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {branchData.map((entry) => (
                    <Cell key={entry.branch_id} fill={BAR_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-4">No branches yet.</p>
          )}
        </div>

      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Maintenance Records per Month</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [value, 'Records']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="count" name="Records" fill={TREND_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 py-4">No maintenance records yet.</p>
        )}
      </div>

    </div>
  )
}

export default Dashboard
