import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import apiClient from '../api/client'
import ActionsMenu from '../components/ActionsMenu'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import ConfirmDialog from '../components/ConfirmDialog'

const emptyForm = { maintenance_id: '', device_id: '', issue: '', solution: '', date: '' }

function Maintenance() {
  const [records, setRecords] = useState([])
  const [devices, setDevices] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [searchParams, setSearchParams] = useSearchParams()

  const deviceFilter = searchParams.get('device_id')
  const openFilter = searchParams.get('open')

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

  useEffect(() => {
    loadRecords()
    apiClient.get('/devices').then((res) => setDevices(res.data)).catch(() => {})
  }, [deviceFilter, openFilter])

  useEffect(() => {
    if (deviceFilter) {
      setForm((f) => ({ ...f, device_id: deviceFilter }))
    }
  }, [deviceFilter])

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    apiClient
      .post('/maintenance', {
        maintenance_id: form.maintenance_id.trim() || undefined,
        device_id: form.device_id || null,
        issue: form.issue,
        solution: form.solution,
        date: form.date,
      })
      .then(() => {
        setForm(emptyForm)
        setModalOpen(false)
        loadRecords()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    apiClient
      .delete(`/maintenance/${id}`)
      .then(loadRecords)
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const q = search.toLowerCase().trim()
  const filtered = records.filter(
    (r) =>
      !q ||
      (r.device_name ?? '').toLowerCase().includes(q) ||
      r.issue.toLowerCase().includes(q) ||
      (r.solution ?? '').toLowerCase().includes(q)
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
        <h2 className="text-xl font-semibold text-slate-800">Maintenance</h2>
        <ActionsMenu
          onAddNew={() => {
            setForm(deviceFilter ? { ...emptyForm, device_id: deviceFilter } : emptyForm)
            setModalOpen(true)
          }}
          importUrl="/maintenance/import"
          onImported={loadRecords}
          exportUrl="/maintenance/export"
          exportFilename="maintenance.xlsx"
        />
      </div>

      <input
        type="search"
        placeholder="Search maintenance records..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 border border-slate-300 rounded px-3 py-1.5 text-sm w-full max-w-sm bg-white"
      />

      {(deviceFilter || openFilter) && (
        <p className="text-sm text-slate-600 mb-4 bg-slate-100 rounded px-3 py-2">
          Showing
          {openFilter && ' open'} maintenance records
          {deviceFilter &&
            ` for "${devices.find((d) => d.device_id === deviceFilter)?.device_name ?? deviceFilter}"`}
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

      <Modal isOpen={modalOpen} onClose={handleCancel} title="Log Maintenance Record">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              ID <span className="text-slate-400">(optional — auto-generated if blank)</span>
            </label>
            <input
              value={form.maintenance_id}
              onChange={(e) => setForm({ ...form, maintenance_id: e.target.value })}
              placeholder="e.g. MR001"
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Device</label>
            <SearchableSelect
              key={`device-${modalOpen}`}
              options={devices}
              value={form.device_id}
              onChange={(val) => setForm({ ...form, device_id: val })}
              labelKey="device_name"
              valueKey="device_id"
              placeholder="Select device"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Issue</label>
            <input
              required
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Solution</label>
            <input
              value={form.solution}
              onChange={(e) => setForm({ ...form, solution: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
            >
              Add Record
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
              <Th col="maintenance_id">ID</Th>
              <th className="px-4 py-2">Device</th>
              <th className="px-4 py-2">Issue</th>
              <th className="px-4 py-2">Solution</th>
              <Th col="date">Date</Th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((record) => (
              <tr key={record.maintenance_id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{record.maintenance_id}</td>
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
                    onClick={() => setConfirmDeleteId(record.maintenance_id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {search ? `No results for "${search}".` : 'No maintenance records yet.'}
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
