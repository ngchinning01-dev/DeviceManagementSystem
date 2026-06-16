import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/client'

// Device detail page: shows a device's info, its branch/assigned user, and its
// maintenance history, with a link to log new maintenance for it.
function DeviceDetail() {
  const { deviceId } = useParams()
  const [device, setDevice] = useState(null)
  const [records, setRecords] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    apiClient
      .get(`/devices/${deviceId}`)
      .then((res) => setDevice(res.data))
      .catch((err) => setError(err.message))

    apiClient
      .get('/maintenance', { params: { device_id: deviceId } })
      .then((res) => setRecords(res.data))
      .catch((err) => setError(err.message))
  }, [deviceId])

  return (
    <div>
      <Link to="/devices" className="text-sm text-slate-500 hover:underline">
        ← Back to Devices
      </Link>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

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
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.maintenance_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{record.issue}</td>
                <td className="px-4 py-2">{record.solution ?? '—'}</td>
                <td className="px-4 py-2">{record.date}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
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
