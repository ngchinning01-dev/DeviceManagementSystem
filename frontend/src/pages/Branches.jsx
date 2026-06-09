import { useEffect, useState } from 'react'
import apiClient from '../api/client'

function Branches() {
  const [branches, setBranches] = useState([])
  const [form, setForm] = useState({ branch_name: '', location: '' })
  const [error, setError] = useState(null)

  const loadBranches = () => {
    apiClient
      .get('/branches')
      .then((res) => setBranches(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(loadBranches, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    apiClient
      .post('/branches', form)
      .then(() => {
        setForm({ branch_name: '', location: '' })
        loadBranches()
      })
      .catch((err) => setError(err.message))
  }

  const handleDelete = (id) => {
    apiClient
      .delete(`/branches/${id}`)
      .then(loadBranches)
      .catch((err) => setError(err.message))
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Branches</h2>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-wrap gap-2 items-end bg-white p-4 rounded-lg shadow-sm"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">Branch Name</label>
          <input
            required
            value={form.branch_name}
            onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Location</label>
          <input
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
        >
          Add Branch
        </button>
      </form>

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
            {branches.map((branch) => (
              <tr key={branch.branch_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{branch.branch_id}</td>
                <td className="px-4 py-2">{branch.branch_name}</td>
                <td className="px-4 py-2">{branch.location}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDelete(branch.branch_id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No branches yet.
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
