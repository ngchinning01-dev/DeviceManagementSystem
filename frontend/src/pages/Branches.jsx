import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import ActionsMenu from '../components/ActionsMenu'
import Modal from '../components/Modal'

const emptyForm = { branch_name: '', location: '' }

// Branches page: lists branches with clickable names and provides add/edit/delete via
// a modal form opened from the ☰ actions menu or the Edit button in the table.
function Branches() {
  const [branches, setBranches] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const loadBranches = () => {
    apiClient
      .get('/branches')
      .then((res) => setBranches(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(loadBranches, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const req = editingId
      ? apiClient.put(`/branches/${editingId}`, form)
      : apiClient.post('/branches', form)

    req
      .then(() => {
        setForm(emptyForm)
        setEditingId(null)
        setModalOpen(false)
        loadBranches()
      })
      .catch((err) => setError(err.message))
  }

  const handleEdit = (branch) => {
    setEditingId(branch.branch_id)
    setForm({ branch_name: branch.branch_name, location: branch.location ?? '' })
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
      .catch((err) => setError(err.message))
  }

  const q = search.toLowerCase().trim()
  const filtered = branches.filter(
    (b) => !q || b.branch_name.toLowerCase().includes(q) || (b.location ?? '').toLowerCase().includes(q)
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
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((branch) => (
              <tr key={branch.branch_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{branch.branch_id}</td>
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
            {filtered.length === 0 && (
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
