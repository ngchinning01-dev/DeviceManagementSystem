import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import BranchForm, { emptyBranchForm } from '../components/BranchForm'

// Branch detail page: shows a branch's info and the devices located at it.
function BranchDetail() {
  const { branchId } = useParams()
  const [branch, setBranch] = useState(null)
  const [devices, setDevices] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(emptyBranchForm)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const loadBranch = () => {
    apiClient
      .get(`/branches/${branchId}`)
      .then((res) => setBranch(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadBranch()

    apiClient
      .get('/devices', { params: { branch_id: branchId } })
      .then((res) => setDevices(res.data))
      .catch((err) => setError(err.message))
  }, [branchId])

  const handleEditOpen = () => {
    setForm({ branch_id: branch.branch_id, branch_name: branch.branch_name, location: branch.location ?? '' })
    setEditOpen(true)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    apiClient
      .put(`/branches/${branchId}`, { branch_name: form.branch_name, location: form.location })
      .then(() => {
        setEditOpen(false)
        loadBranch()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  const handleDeleteConfirm = () => {
    apiClient
      .delete(`/branches/${branchId}`)
      .then(() => navigate('/branches'))
      .catch((err) => setError(err.response?.data?.error || err.message))
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <Link to="/branches" className="text-sm text-slate-500 hover:underline">
          ← Back to Branches
        </Link>
        {branch && (
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
        title="Edit Branch"
      >
        <BranchForm
          form={form}
          setForm={setForm}
          editingId={branchId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditOpen(false)}
          submitLabel="Save Changes"
        />
      </Modal>

      {branch && (
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold text-slate-800">{branch.branch_name}</h2>
          <p className="text-sm text-slate-500 mt-1">{branch.location}</p>
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2">Devices</h3>
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Assigned User</th>
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
                  {device.assigned_user_id ? (
                    <Link to={`/users/${device.assigned_user_id}`} className="text-slate-700 hover:underline">
                      {device.assigned_user_name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No devices at this branch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BranchDetail
