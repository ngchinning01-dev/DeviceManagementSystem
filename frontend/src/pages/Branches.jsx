import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import ActionsMenu from '../components/ActionsMenu'
import Modal from '../components/Modal'

const emptyForm = { branch_id: '', branch_name: '', location: '' }

function Branches() {
  const [branches, setBranches] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('branch_id')
  const [sortDir, setSortDir] = useState('asc')

  const loadBranches = () => {
    apiClient
      .get('/branches')
      .then((res) => setBranches(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(loadBranches, [])

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const req = editingId
      ? apiClient.put(`/branches/${editingId}`, { branch_name: form.branch_name, location: form.location })
      : apiClient.post('/branches', {
          branch_id: form.branch_id.trim() || undefined,
          branch_name: form.branch_name,
          location: form.location,
        })

    req
      .then(() => {
        setForm(emptyForm)
        setEditingId(null)
        setModalOpen(false)
        loadBranches()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const handleEdit = (branch) => {
    setEditingId(branch.branch_id)
    setForm({ branch_id: branch.branch_id, branch_name: branch.branch_name, location: branch.location ?? '' })
    setModalOpen(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    apiClient
      .delete(`/branches/${id}`)
      .then(() => {
        if (editingId === id) handleCancel()
        loadBranches()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const q = search.toLowerCase().trim()
  const filtered = branches.filter(
    (b) => !q || b.branch_name.toLowerCase().includes(q) || (b.location ?? '').toLowerCase().includes(q)
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
        <h2 className="text-xl font-semibold text-slate-800">Branches</h2>
        <ActionsMenu
          onAddNew={() => { setForm(emptyForm); setEditingId(null); setModalOpen(true) }}
          importUrl="/branches/import"
          onImported={loadBranches}
          exportUrl="/branches/export"
          exportFilename="branches.xlsx"
        />
      </div>

      <input
        type="search"
        placeholder="Search branches..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 border border-slate-300 rounded px-3 py-1.5 text-sm w-full max-w-sm bg-white"
      />

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editingId ? 'Edit Branch' : 'Add Branch'}
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
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              disabled={!!editingId}
              placeholder={editingId ? '' : 'e.g. BR1001'}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Branch Name</label>
            <input
              required
              value={form.branch_name}
              onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Location</label>
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
            >
              {editingId ? 'Save Changes' : 'Add Branch'}
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

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <Th col="branch_id">ID</Th>
              <Th col="branch_name">Name</Th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((branch) => (
              <tr key={branch.branch_id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{branch.branch_id}</td>
                <td className="px-4 py-2">
                  <Link to={`/branches/${branch.branch_id}`} className="text-slate-700 hover:underline">
                    {branch.branch_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{branch.location}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="text-slate-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(branch.branch_id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  {search ? `No results for "${search}".` : 'No branches yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Branches
