// Add/Edit form for branches. ID field is editable only when adding (auto-generated
// if left blank) and locked once a branch exists, since IDs are primary keys.
export const emptyBranchForm = { branch_id: '', branch_name: '', location: '' }

function BranchForm({ form, setForm, editingId, onSubmit, onCancel, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
          {submitLabel ?? (editingId ? 'Save Changes' : 'Add Branch')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-slate-200 text-slate-700 text-sm rounded px-4 py-1.5 hover:bg-slate-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default BranchForm
