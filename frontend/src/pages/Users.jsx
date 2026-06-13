import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const emptyForm = { name: '', email: '', department: '' }

// Users page: lists users and provides a form to create, edit, and delete them.
function Users() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)

  // Fetch the user list from the API.
  const loadUsers = () => {
    apiClient
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(loadUsers, [])

  // Create a new user, or save changes if editing an existing one.
  const handleSubmit = (e) => {
    e.preventDefault()
    const request = editingId
      ? apiClient.put(`/users/${editingId}`, form)
      : apiClient.post('/users', form)

    request
      .then(() => {
        setForm(emptyForm)
        setEditingId(null)
        loadUsers()
      })
      .catch((err) => setError(err.message))
  }

  // Populate the form with an existing user's data for editing.
  const handleEdit = (user) => {
    setEditingId(user.user_id)
    setForm({ name: user.name, email: user.email, department: user.department ?? '' })
  }

  // Exit edit mode and reset the form.
  const handleCancel = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  // Delete a user and refresh the list.
  const handleDelete = (id) => {
    apiClient
      .delete(`/users/${id}`)
      .then(() => {
        if (editingId === id) handleCancel()
        loadUsers()
      })
      .catch((err) => setError(err.message))
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Users</h2>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-wrap gap-2 items-end bg-white p-4 rounded-lg shadow-sm"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Department</label>
          <input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
        >
          {editingId ? 'Save Changes' : 'Add User'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={handleCancel}
            className="bg-slate-200 text-slate-700 text-sm rounded px-4 py-1.5 hover:bg-slate-300"
          >
            Cancel
          </button>
        )}
      </form>

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
            {users.map((user) => (
              <tr key={user.user_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{user.user_id}</td>
                <td className="px-4 py-2">{user.name}</td>
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
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No users yet.
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
