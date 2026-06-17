import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import ActionsMenu from '../components/ActionsMenu'
import Modal from '../components/Modal'

const emptyForm = { name: '', email: '', department: '' }

// Users page: lists users with clickable names and provides add/edit/delete via
// a modal form opened from the ☰ actions menu or the Edit button in the table.
function Users() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const loadUsers = () => {
    apiClient
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(loadUsers, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const req = editingId
      ? apiClient.put(`/users/${editingId}`, form)
      : apiClient.post('/users', form)

    req
      .then(() => {
        setForm(emptyForm)
        setEditingId(null)
        setModalOpen(false)
        loadUsers()
      })
      .catch((err) => setError(err.message))
  }

  const handleEdit = (user) => {
    setEditingId(user.user_id)
    setForm({ name: user.name, email: user.email, department: user.department ?? '' })
    setModalOpen(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    apiClient
      .delete(`/users/${id}`)
      .then(() => {
        if (editingId === id) handleCancel()
        loadUsers()
      })
      .catch((err) => setError(err.message))
  }

  const q = search.toLowerCase().trim()
  const filtered = users.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department ?? '').toLowerCase().includes(q)
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Users</h2>
        <ActionsMenu
          onAddNew={() => { setForm(emptyForm); setEditingId(null); setModalOpen(true) }}
          importUrl="/users/import"
          onImported={loadUsers}
          exportUrl="/users/export"
          exportFilename="users.xlsx"
        />
      </div>

      <input
        type="search"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 border border-slate-300 rounded px-3 py-1.5 text-sm w-full max-w-sm bg-white"
      />

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editingId ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Department</label>
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
            >
              {editingId ? 'Save Changes' : 'Add User'}
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
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.user_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{user.user_id}</td>
                <td className="px-4 py-2">
                  <Link to={`/users/${user.user_id}`} className="text-slate-700 hover:underline">
                    {user.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.department}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-slate-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.user_id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  {search ? `No results for "${search}".` : 'No users yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users
