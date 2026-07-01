import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Modal from '../components/Modal'

// Device detail page: shows a device's info, its branch/assigned user, and its
// maintenance history, with a link to log new maintenance for it.
function DeviceDetail() {
  const { deviceId } = useParams()
  const [device, setDevice] = useState(null)
  const [records, setRecords] = useState([])
  const [error, setError] = useState(null)
  const [resolveRecord, setResolveRecord] = useState(null)
  const [resolveText, setResolveText] = useState('')

  const loadRecords = () => {
    apiClient
      .get('/maintenance', { params: { device_id: deviceId } })
      .then((res) => setRecords(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    apiClient
      .get(`/devices/${deviceId}`)
      .then((res) => setDevice(res.data))
      .catch((err) => setError(err.message))

    loadRecords()
  }, [deviceId])

  const handleResolveSubmit = () => {
    apiClient
      .put(`/maintenance/${resolveRecord.maintenance_id}`, {
        device_id: resolveRecord.device_id,
        issue: resolveRecord.issue,
        solution: resolveText,
        date: resolveRecord.date,
      })
      .then(() => {
        setResolveRecord(null)
        setResolveText('')
        loadRecords()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  return (
    <div>
      <Link to="/devices" className="text-sm text-slate-500 hover:underline">
        ← Back to Devices
      </Link>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      <Modal
        isOpen={resolveRecord !== null}
        onClose={() => { setResolveRecord(null); setResolveText('') }}
        title="Mark as Resolved"
      >
        <p className="text-sm text-slate-500 mb-3">
          Issue: <span className="text-slate-700 font-medium">{resolveRecord?.issue}</span>
        </p>
        <div className="mb-4">
          <label className="block text-xs text-slate-500 mb-1">Solution</label>
          <input
            autoFocus
            value={resolveText}
            onChange={(e) => setResolveText(e.target.value)}
            placeholder="Describe how the issue was resolved..."
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => { setResolveRecord(null); setResolveText('') }}
            className="bg-slate-200 text-slate-700 text-sm rounded px-4 py-1.5 hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResolveSubmit}
            disabled={!resolveText.trim()}
            className="bg-green-600 text-white text-sm rounded px-4 py-1.5 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Resolved
          </button>
        </div>
      </Modal>

      {device && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold text-slate-800">{device.device_name}</h2>
          <p className="text-sm text-slate-500 mt-1">{device.device_type}</p>
          <p className="text-sm text-slate-500">Serial: {device.serial_number ?? '—'}</p>
          <p className="text-sm text-slate-500">IP: {device.ip_address ?? '—'}</p>
          <p className="text-sm text-slate-500">Status: {device.status}</p>
          <p className="text-sm text-slate-500">
            Branch:{' '}
            <Link to={`/branches/${device.branch_id}`} className="text-slate-700 hover:underline">
              {device.branch_name}
            </Link>
          </p>
          <p className="text-sm text-slate-500">
            Assigned User:{' '}
            {device.assigned_user_id ? (
              <Link to={`/users/${device.assigned_user_id}`} className="text-slate-700 hover:underline">
                {device.assigned_user_name}
              </Link>
            ) : (
              '—'
            )}
          </p>
          {device.purchase_date && (
            <p className="text-sm text-slate-500">Purchase Date: {device.purchase_date}</p>
          )}
          {device.warranty_expiry && (() => {
            const today = new Date(); today.setHours(0, 0, 0, 0)
            const exp = new Date(device.warranty_expiry + 'T00:00:00')
            const days = Math.ceil((exp - today) / 86400000)
            const badge = days < 0
              ? <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>
              : days <= 30
              ? <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Expiring in {days}d</span>
              : null
            return <p className="text-sm text-slate-500">Warranty Expiry: {device.warranty_expiry}{badge}</p>
          })()}
          {device.cost != null && (
            <p className="text-sm text-slate-500">Cost: ${device.cost.toFixed(2)}</p>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-6 mb-2">
        <h3 className="text-lg font-semibold text-slate-800">Maintenance History</h3>
        <Link
          to={`/maintenance?device_id=${deviceId}`}
          className="text-sm bg-slate-800 text-white rounded px-4 py-1.5 hover:bg-slate-700"
        >
          Log maintenance for this device
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-2">Issue</th>
              <th className="px-4 py-2">Solution</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.maintenance_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{record.issue}</td>
                <td className="px-4 py-2">
                  {record.solution
                    ? <span className="text-slate-700">{record.solution}</span>
                    : <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Open</span>
                  }
                </td>
                <td className="px-4 py-2">{record.date}</td>
                <td className="px-4 py-2 text-right">
                  {!record.solution && (
                    <button
                      onClick={() => { setResolveRecord(record); setResolveText('') }}
                      className="text-green-600 hover:underline text-xs"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No maintenance records for this device.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DeviceDetail
