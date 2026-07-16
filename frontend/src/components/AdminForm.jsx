// Add/Edit form for admin login accounts: username+password (add only) plus
// the is_admin flag and per-action (read/add/edit/delete) permission checkboxes.
export const emptyAdminForm = {
  username: '',
  password: '',
  is_admin: false,
  can_read: false,
  can_add: false,
  can_edit: false,
  can_delete: false,
}

const PERMISSION_FIELDS = [
  { key: 'can_read', label: 'Read' },
  { key: 'can_add', label: 'Add' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
]

function AdminForm({ form, setForm, editingId, onSubmit, onCancel, submitLabel, disableIsAdmin }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          Username{' '}
          {editingId && <span className="text-slate-400">(cannot be changed)</span>}
        </label>
        <input
          required
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          disabled={!!editingId}
          className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      {!editingId && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_admin}
            disabled={disableIsAdmin}
            onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
            className="cursor-pointer disabled:cursor-not-allowed"
          />
          Admin (can access Manage Access and edit other accounts)
        </label>
        {disableIsAdmin && (
          <p className="text-xs text-slate-400 mt-1">
            This is the last remaining admin account, so admin status can't be removed.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-2">Permissions</label>
        <div className="flex gap-4">
          {PERMISSION_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="cursor-pointer"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
        >
          {submitLabel ?? (editingId ? 'Save Changes' : 'Add Account')}
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

export default AdminForm
