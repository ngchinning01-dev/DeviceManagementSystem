import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import apiClient from '../api/client'
import ActionsMenu from '../components/ActionsMenu'
import Modal from '../components/Modal'

const emptyForm = {
  device_name: '',
  device_type: '',
  serial_number: '',
  ip_address: '',
  status: 'Active',
  branch_id: '',
  assigned_user_id: '',
}

// Devices page: lists devices and provides add/edit/delete via a modal form opened
// from the ☰ actions menu or the Edit button. Supports URL-based filtering.
function Devices() {
  const [devices, setDevices] = useState([])
  const [branches, setBranches] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const branchFilter = searchParams.get('branch_id')
  const statusFilter = searchParams.get('status')
  const assignedUserFilter = searchParams.get('assigned_user_id')

  const loadDevices = () => {
    apiClient
      .get('/devices', {
        params: {
          branch_id: branchFilter || undefined,
          status: statusFilter || undefined,
          assigned_user_id: assignedUserFilter || undefined,
        },
      })
      .then((res) => setDevices(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadDevices()
    apiClient.get('/branches').then((res) => setBranches(res.data)).catch(() => {})
    apiClient.get('/users').then((res) => setUsers(res.data)).catch(() => {})
  }, [branchFilter, statusFilter, assignedUserFilter])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      branch_id: Number(form.branch_id) || null,
      assigned_user_id: Number(form.assigned_user_id) || null,
    }
    const req = editingId
      ? apiClient.put(`/devices/${editingId}`, payload)
      : apiClient.post('/devices', payload)

    req
      .then(() => {
        setForm(emptyForm)
        setEditingId(null)
        setModalOpen(false)
        loadDevices()
      })
      .catch((err) => setError(err.message))
  }

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
    setModalOpen(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(false)
  }

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Devices</h2>
        <ActionsMenu
          onAddNew={() => { setForm(emptyForm); setEditingId(null); setModalOpen(true) }}
          importUrl="/devices/import"
          onImported={loadDevices}
          exportUrl="/devices/export"
          exportFilename="devices.xlsx"
        />
      </div>

      {(branchFilter || statusFilter || assignedUserFilter) && (
        <p className="text-sm text-slate-600 mb-4 bg-slate-100 rounded px-3 py-2">
          Showing devices
          {branchFilter &&
            ` in branch "${branches.find((b) => String(b.branch_id) === branchFilter)?.branch_name ?? branchFilter}"`}
          {statusFilter && ` with status "${statusFilter}"`}
          {assignedUserFilter &&
            ` assigned to "${users.find((u) => String(u.user_id) === assignedUserFilter)?.name ?? assignedUserFilter}"`}
          {' — '}
          <button onClick={() => setSearchParams({})} className="text-slate-800 underline">
            Clear filter
          </button>
        </p>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editingId ? 'Edit Device' : 'Add Device'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name</label>
              <input
                required
                value={form.device_name}
                onChange={(e) => setForm({ ...form, device_name: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <input
                required
                value={form.device_type}
                onChange={(e) => setForm({ ...form, device_type: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Serial Number</label>
              <input
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">IP Address</label>
              <input
                value={form.ip_address}
                onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
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
                className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Assigned User</label>
            <select
              value={form.assigned_user_id}
              onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
            >
              {editingId ? 'Save Changes' : 'Add Device'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-slate-200 text-slate-700 text-sm rounded px-4 py-1.5 hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

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
                <td className="px-4 py-2">
                  <Link to={`/devices/${device.device_id}`} className="text-slate-700 hover:underline">
                    {device.device_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{device.device_type}</td>
                <td className="px-4 py-2">{device.serial_number}</td>
                <td className="px-4 py-2">{device.ip_address}</td>
                <td className="px-4 py-2">{device.status}</td>
                <td className="px-4 py-2">
                  <Link to={`/branches/${device.branch_id}`} className="text-slate-700 hover:underline">
                    {device.branch_name}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  {device.assigned_user_id ? (
                    <Link to={`/users/${device.assigned_user_id}`} className="text-slate-700 hover:underline">
                      {device.assigned_user_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
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
