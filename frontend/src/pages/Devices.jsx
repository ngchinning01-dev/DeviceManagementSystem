import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import apiClient from '../api/client'
import ActionsMenu from '../components/ActionsMenu'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import ConfirmDialog from '../components/ConfirmDialog'

const emptyForm = {
  device_id: '',
  device_name: '',
  device_type: '',
  serial_number: '',
  ip_address: '',
  status: 'Active',
  branch_id: '',
  assigned_user_id: '',
}

function Devices() {
  const [devices, setDevices] = useState([])
  const [branches, setBranches] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('device_id')
  const [sortDir, setSortDir] = useState('asc')
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

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const req = editingId
      ? apiClient.put(`/devices/${editingId}`, {
          device_name: form.device_name,
          device_type: form.device_type,
          serial_number: form.serial_number,
          ip_address: form.ip_address,
          status: form.status,
          branch_id: form.branch_id || null,
          assigned_user_id: form.assigned_user_id || null,
        })
      : apiClient.post('/devices', {
          device_id: form.device_id.trim() || undefined,
          device_name: form.device_name,
          device_type: form.device_type,
          serial_number: form.serial_number,
          ip_address: form.ip_address,
          status: form.status,
          branch_id: form.branch_id || null,
          assigned_user_id: form.assigned_user_id || null,
        })

    req
      .then(() => {
        setForm(emptyForm)
        setEditingId(null)
        setModalOpen(false)
        loadDevices()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const handleEdit = (device) => {
    setEditingId(device.device_id)
    setForm({
      device_id: device.device_id,
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
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const q = search.toLowerCase().trim()
  const filtered = devices.filter(
    (d) =>
      !q ||
      d.device_name.toLowerCase().includes(q) ||
      d.device_type.toLowerCase().includes(q) ||
      (d.serial_number ?? '').toLowerCase().includes(q) ||
      (d.ip_address ?? '').toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q) ||
      (d.branch_name ?? '').toLowerCase().includes(q) ||
      (d.assigned_user_name ?? '').toLowerCase().includes(q)
  )

  const sorted = [...filtered].sort((a, b) => {
    const cmp = String(a[sortCol] ?? '').localeCompare(String(b[sortCol] ?? ''), undefined, { numeric: true, sensitivity: 'base' })
    return sortDir === 'asc' ? cmp : -cmp
  })

  const Th = ({ col, children }) => (
    <th
      onClick={() => toggleSort(col)}
      className="px-4 py-2 cursor-pointer select-none hover:text-slate-700"
    >
      {children} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}
    </th>
  )

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

      <input
        type="search"
        placeholder="Search devices..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 border border-slate-300 rounded px-3 py-1.5 text-sm w-full max-w-sm bg-white"
      />

      {(branchFilter || statusFilter || assignedUserFilter) && (
        <p className="text-sm text-slate-600 mb-4 bg-slate-100 rounded px-3 py-2">
          Showing devices
          {branchFilter &&
            ` in branch "${branches.find((b) => b.branch_id === branchFilter)?.branch_name ?? branchFilter}"`}
          {statusFilter && ` with status "${statusFilter}"`}
          {assignedUserFilter &&
            ` assigned to "${users.find((u) => u.user_id === assignedUserFilter)?.name ?? assignedUserFilter}"`}
          {' — '}
          <button onClick={() => setSearchParams({})} className="text-slate-800 underline">
            Clear filter
          </button>
        </p>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null) }}
      />

      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editingId ? 'Edit Device' : 'Add Device'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              ID{' '}
              {editingId ? (
                <span className="text-slate-400">(cannot be changed)</span>
              ) : (
                <span className="text-slate-400">(optional — auto-generated if blank)</span>
              )}
            </label>
            <input
              value={form.device_id}
              onChange={(e) => setForm({ ...form, device_id: e.target.value })}
              disabled={!!editingId}
              placeholder={editingId ? '' : 'e.g. DV001'}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
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
                <option>Under Maintenance</option>
                <option>Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Branch</label>
              <SearchableSelect
                key={`branch-${modalOpen}`}
                options={branches}
                value={form.branch_id}
                onChange={(val) => setForm({ ...form, branch_id: val })}
                labelKey="branch_name"
                valueKey="branch_id"
                placeholder="Select branch"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Assigned User</label>
            <SearchableSelect
              key={`user-${modalOpen}`}
              options={users}
              value={form.assigned_user_id}
              onChange={(val) => setForm({ ...form, assigned_user_id: val })}
              labelKey="name"
              valueKey="user_id"
              placeholder="Unassigned"
            />
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
              <Th col="device_id">ID</Th>
              <Th col="device_name">Name</Th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Serial</th>
              <th className="px-4 py-2">IP</th>
              <Th col="status">Status</Th>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Assigned User</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((device) => (
              <tr key={device.device_id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{device.device_id}</td>
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
                    onClick={() => setConfirmDeleteId(device.device_id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                  {search ? `No results for "${search}".` : 'No devices yet.'}
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
