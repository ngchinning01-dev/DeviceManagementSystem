import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import apiClient from '../api/client'
import ExcelImport from '../components/ExcelImport'

const emptyForm = { device_id: '', issue: '', solution: '', date: '' }

// Maintenance page: lists maintenance records and provides a form to log new ones
// against an existing device (no edit support, only add/delete).
function Maintenance() {
  const [records, setRecords] = useState([])
  const [devices, setDevices] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const deviceFilter = searchParams.get('device_id')
  const openFilter = searchParams.get('open')

  // Fetch the maintenance record list from the API, applying any active filters.
  const loadRecords = () => {
    apiClient
      .get('/maintenance', {
        params: {
          device_id: deviceFilter || undefined,
          open: openFilter || undefined,
        },
      })
      .then((res) => setRecords(res.data))
      .catch((err) => setError(err.message))
  }

  // Load records plus the device list needed to populate the form dropdown.
  useEffect(() => {
    loadRecords()
    apiClient.get('/devices').then((res) => setDevices(res.data)).catch(() => {})
  }, [deviceFilter, openFilter])

  // Pre-fill the form's device dropdown when a device_id filter is present.
  useEffect(() => {
    if (deviceFilter) {
      setForm((f) => ({ ...f, device_id: deviceFilter }))
    }
  }, [deviceFilter])

  // Create a new maintenance record for the selected device.
  const handleSubmit = (e) => {
    e.preventDefault()
    apiClient
      .post('/maintenance', { ...form, device_id: Number(form.device_id) || null })
      .then(() => {
        setForm(emptyForm)
        loadRecords()
      })
      .catch((err) => setError(err.message))
  }

  // Delete a maintenance record and refresh the list.
  const handleDelete = (id) => {
    apiClient
      .delete(`/maintenance/${id}`)
      .then(loadRecords)
      .catch((err) => setError(err.message))
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Maintenance</h2>
        <ExcelImport importUrl="/maintenance/import" onImported={loadRecords} />
      </div>

      {(deviceFilter || openFilter) && (
        <p className="text-sm text-slate-600 mb-4 bg-slate-100 rounded px-3 py-2">
          Showing
          {openFilter && ' open'} maintenance records
          {deviceFilter &&
            ` for "${devices.find((d) => String(d.device_id) === deviceFilter)?.device_name ?? deviceFilter}"`}
          {' — '}
          <button onClick={() => setSearchParams({})} className="text-slate-800 underline">
            Clear filter
          </button>
        </p>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end bg-white p-4 rounded-lg shadow-sm"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">Device</label>
          <select
            required
            value={form.device_id}
            onChange={(e) => setForm({ ...form, device_id: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          >
            <option value="">Select device</option>
            {devices.map((d) => (
              <option key={d.device_id} value={d.device_id}>
                {d.device_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Issue</label>
          <input
            required
            value={form.issue}
            onChange={(e) => setForm({ ...form, issue: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Solution</label>
          <input
            value={form.solution}
            onChange={(e) => setForm({ ...form, solution: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          />
        </div>
        <button
          type="submit"
          className="col-span-2 sm:col-span-4 bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700 sm:w-fit"
        >
          Add Record
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Device</th>
              <th className="px-4 py-2">Issue</th>
              <th className="px-4 py-2">Solution</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.maintenance_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{record.maintenance_id}</td>
                <td className="px-4 py-2">
                  <Link to={`/devices/${record.device_id}`} className="text-slate-700 hover:underline">
                    {record.device_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{record.issue}</td>
                <td className="px-4 py-2">{record.solution}</td>
                <td className="px-4 py-2">{record.date}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDelete(record.maintenance_id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No maintenance records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Maintenance
