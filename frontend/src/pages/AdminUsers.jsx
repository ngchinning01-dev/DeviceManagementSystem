import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import AdminForm, { emptyAdminForm } from '../components/AdminForm'

// Admin-only page for creating accounts and managing their is_admin flag and
// read/add/edit/delete permissions. Operates on Admin (login accounts), not
// the unrelated employee "Users" resource shown on the /users page.
function AdminUsers() {
  const { admin: currentAdmin } = useAuth()
  const [admins, setAdmins] = useState([])
  const [form, setForm] = useState(emptyAdminForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [resetPasswordId, setResetPasswordId] = useState(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [error, setError] = useState(null)

  const loadAdmins = () => {
    apiClient
      .get('/admins')
      .then((res) => setAdmins(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  useEffect(loadAdmins, [])

  const adminCount = admins.filter((a) => a.is_admin).length

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    const permissions = {
      is_admin: form.is_admin,
      can_read: form.can_read,
      can_add: form.can_add,
      can_edit: form.can_edit,
      can_delete: form.can_delete,
    }
    const req = editingId
      ? apiClient.put(`/admins/${editingId}`, permissions)
      : apiClient.post('/admins', { username: form.username, password: form.password, ...permissions })

    req
      .then(() => {
        setForm(emptyAdminForm)
        setEditingId(null)
        setModalOpen(false)
        loadAdmins()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const handleEdit = (a) => {
    setEditingId(a.id)
    setForm({
      username: a.username,
      password: '',
      is_admin: a.is_admin,
      can_read: a.can_read,
      can_add: a.can_add,
      can_edit: a.can_edit,
      can_delete: a.can_delete,
    })
    setModalOpen(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm(emptyAdminForm)
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    apiClient
      .delete(`/admins/${id}`)
      .then(() => {
        if (editingId === id) handleCancel()
        loadAdmins()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const handleResetPassword = () => {
    apiClient
      .post(`/admins/${resetPasswordId}/reset-password`, { new_password: resetPasswordValue })
      .then(() => {
        setResetPasswordId(null)
        setResetPasswordValue('')
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const Check = ({ value }) => (
    <span className={value ? 'text-green-600' : 'text-slate-300'}>{value ? '✓' : '—'}</span>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Manage Access</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create accounts and control who can read, add, edit, or delete records, and who can manage access.
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyAdminForm); setEditingId(null); setModalOpen(true) }}
          className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700 whitespace-nowrap"
        >
          Add New
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null) }}
        message="Are you sure you want to delete this account? This action cannot be undone."
      />

      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editingId ? 'Edit Account' : 'Add Account'}
      >
        <AdminForm
          form={form}
          setForm={setForm}
          editingId={editingId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          disableIsAdmin={
            editingId != null &&
            form.is_admin &&
            adminCount <= 1 &&
            admins.find((a) => a.id === editingId)?.is_admin
          }
        />
      </Modal>

      <Modal
        isOpen={resetPasswordId !== null}
        onClose={() => { setResetPasswordId(null); setResetPasswordValue('') }}
        title="Reset Password"
      >
        <div className="mb-4">
          <label className="block text-xs text-slate-500 mb-1">New Password</label>
          <input
            autoFocus
            type="password"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => { setResetPasswordId(null); setResetPasswordValue('') }}
            className="bg-slate-200 text-slate-700 text-sm rounded px-4 py-1.5 hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetPasswordValue.length < 6}
            className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Password
          </button>
        </div>
      </Modal>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2 text-center">Admin</th>
              <th className="px-4 py-2 text-center">Read</th>
              <th className="px-4 py-2 text-center">Add</th>
              <th className="px-4 py-2 text-center">Edit</th>
              <th className="px-4 py-2 text-center">Delete</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isSelf = a.id === currentAdmin?.id
              const isLastAdmin = a.is_admin && adminCount <= 1
              return (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {a.username}
                    {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                  </td>
                  <td className="px-4 py-2 text-center"><Check value={a.is_admin} /></td>
                  <td className="px-4 py-2 text-center"><Check value={a.can_read} /></td>
                  <td className="px-4 py-2 text-center"><Check value={a.can_add} /></td>
                  <td className="px-4 py-2 text-center"><Check value={a.can_edit} /></td>
                  <td className="px-4 py-2 text-center"><Check value={a.can_delete} /></td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <button
                      onClick={() => handleEdit(a)}
                      className="text-slate-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setResetPasswordId(a.id)}
                      className="text-slate-600 hover:underline text-xs"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(a.id)}
                      disabled={isSelf || isLastAdmin}
                      title={isSelf ? "You can't delete your own account" : isLastAdmin ? 'Cannot delete the last remaining admin' : undefined}
                      className="text-red-600 hover:underline text-xs disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
            {admins.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsers
