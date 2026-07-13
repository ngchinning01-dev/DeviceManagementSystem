import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import UserForm, { emptyUserForm } from '../components/UserForm'

// User detail page: shows a user's info and the devices assigned to them.
function UserDetail() {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [devices, setDevices] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(emptyUserForm)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const loadUser = () => {
    apiClient
      .get(`/users/${userId}`)
      .then((res) => setUser(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadUser()

    apiClient
      .get('/devices', { params: { assigned_user_id: userId } })
      .then((res) => setDevices(res.data))
      .catch((err) => setError(err.message))
  }, [userId])

  const handleEditOpen = () => {
    setForm({ user_id: user.user_id, name: user.name, email: user.email, department: user.department ?? '' })
    setEditOpen(true)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    apiClient
      .put(`/users/${userId}`, { name: form.name, email: form.email, department: form.department })
      .then(() => {
        setEditOpen(false)
        loadUser()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const handleDeleteConfirm = () => {
    apiClient
      .delete(`/users/${userId}`)
      .then(() => navigate('/users'))
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <Link to="/users" className="text-sm text-slate-500 hover:underline">
          ← Back to Users
        </Link>
        {user && (
          <div className="space-x-3">
            <button onClick={handleEditOpen} className="text-sm text-slate-600 hover:underline">
              Edit
            </button>
            <button onClick={() => setDeleteOpen(true)} className="text-sm text-red-600 hover:underline">
              Delete
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { handleDeleteConfirm(); setDeleteOpen(false) }}
      />

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit User"
      >
        <UserForm
          form={form}
          setForm={setForm}
          editingId={userId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditOpen(false)}
          submitLabel="Save Changes"
        />
      </Modal>

      {user && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold text-slate-800">{user.name}</h2>
          <p className="text-sm text-slate-500 mt-1">{user.email}</p>
          <p className="text-sm text-slate-500">{user.department}</p>
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Assigned Devices</h3>
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Branch</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr
                key={device.device_id}
                onClick={() => navigate(`/devices/${device.device_id}`)}
                className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
              >
                <td className="px-4 py-2">
                  <Link to={`/devices/${device.device_id}`} className="text-slate-700 hover:underline">
                    {device.device_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{device.device_type}</td>
                <td className="px-4 py-2">{device.status}</td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/branches/${device.branch_id}`} className="text-slate-700 hover:underline">
                    {device.branch_name}
                  </Link>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No devices assigned to this user.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserDetail
