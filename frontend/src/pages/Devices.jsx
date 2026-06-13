import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const emptyForm = {
  device_name: '',
  device_type: '',
  serial_number: '',
  ip_address: '',
  status: 'Active',
  branch_id: '',
  assigned_user_id: '',
}

// Devices page: lists devices and provides a form to create, edit, and delete them,
// including assigning a branch and (optionally) a user to each device.
function Devices() {
  const [devices, setDevices] = useState([])
  const [branches, setBranches] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)

  // Fetch the device list from the API.
  const loadDevices = () => {
    apiClient
      .get('/devices')
      .then((res) => setDevices(res.data))
      .catch((err) => setError(err.message))
  }

  // Load devices plus the branches/users needed to populate the form dropdowns.
  useEffect(() => {
    loadDevices()
    apiClient.get('/branches').then((res) => setBranches(res.data)).catch(() => {})
    apiClient.get('/users').then((res) => setUsers(res.data)).catch(() => {})
  }, [])

  // Create a new device, or save changes if editing an existing one.
  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      branch_id: Number(form.branch_id) || null,
      assigned_user_id: Number(form.assigned_user_id) || null,
    }
    const request = editingId
      ? apiClient.put(`/devices/${editingId}`, payload)
      : apiClient.post('/devices', payload)

    request
      .then(() => {
        setForm(emptyForm)
        setEditingId(null)
        loadDevices()
      })
      .catch((err) => setError(err.message))
  }

  // Populate the form with an existing device's data for editing.
  const handleEdit = (device) => {
    setEditingId(device.device_id)
    setForm({
      device_name: device.device_name,
      device_type: device.device_type,
      serial_number: device.serial_number ?? '',
      ip_address: device.ip_address ?? '',
      status: device.status,
      branch_id: device.branch_id ?? '',
      assigned_user_id: device.assigned_user_id ?? '',
    })
  }

  // Exit edit mode and reset the form.
  const handleCancel = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  // Delete a device and refresh the list.
  const handleDelete = (id) => {
    apiClient
      .delete(`/devices/${id}`)
      .then(() => {
        if (editingId === id) handleCancel()
        loadDevices()
      })
      .catch((err) => setError(err.message))
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Devices</h2>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 items-end bg-white p-4 rounded-lg shadow-sm"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">Name</label>
          <input
            required
            value={form.device_name}
            onChange={(e) => setForm({ ...form, device_name: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Type</label>
          <input
            required
            value={form.device_type}
            onChange={(e) => setForm({ ...form, device_type: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Serial Number</label>
          <input
            value={form.serial_number}
            onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">IP Address</label>
          <input
            value={form.ip_address}
            onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          >
            <option>Active</option>
            <option>Inactive</option>
            <option>Under Repair</option>
            <option>Retired</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Branch</label>
          <select
            required
            value={form.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          >
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={b.branch_id}>
                {b.branch_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Assigned User</label>
          <select
            value={form.assigned_user_id}
            onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="col-span-2 sm:col-span-4 lg:col-span-1 bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
        >
          {editingId ? 'Save Changes' : 'Add Device'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={handleCancel}
            className="col-span-2 sm:col-span-4 lg:col-span-1 bg-slate-200 text-slate-700 text-sm rounded px-4 py-1.5 hover:bg-slate-300"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Serial</th>
              <th className="px-4 py-2">IP</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Assigned User</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.device_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{device.device_id}</td>
                <td className="px-4 py-2">{device.device_name}</td>
                <td className="px-4 py-2">{device.device_type}</td>
                <td className="px-4 py-2">{device.serial_number}</td>
                <td className="px-4 py-2">{device.ip_address}</td>
                <td className="px-4 py-2">{device.status}</td>
                <td className="px-4 py-2">{device.branch_name}</td>
                <td className="px-4 py-2">{device.assigned_user_name ?? '—'}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(device)}
                    className="text-slate-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(device.device_id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                  No devices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Devices
