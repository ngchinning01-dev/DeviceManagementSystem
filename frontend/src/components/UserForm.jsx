export const emptyUserForm = { user_id: '', name: '', email: '', department: '' }

function UserForm({ form, setForm, editingId, onSubmit, onCancel, submitLabel }) {
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
          value={form.user_id}
          onChange={(e) => setForm({ ...form, user_id: e.target.value })}
          disabled={!!editingId}
          placeholder={editingId ? '' : 'e.g. U001'}
          className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>
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
          {submitLabel ?? (editingId ? 'Save Changes' : 'Add User')}
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

export default UserForm
