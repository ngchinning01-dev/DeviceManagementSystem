// Add/Edit form for devices: identity fields, status, branch/assigned-user
// pickers (via SearchableSelect), and purchase/warranty/cost fields.
import SearchableSelect from './SearchableSelect'

export const emptyDeviceForm = {
  device_id: '',
  device_name: '',
  device_type: '',
  serial_number: '',
  ip_address: '',
  status: 'Active',
  branch_id: '',
  assigned_user_id: '',
  purchase_date: '',
  warranty_expiry: '',
  cost: '',
}

function DeviceForm({ form, setForm, editingId, branches, users, onSubmit, onCancel, submitLabel, isOpen }) {
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
          value={form.device_id}
          onChange={(e) => setForm({ ...form, device_id: e.target.value })}
          disabled={!!editingId}
          placeholder={editingId ? '' : 'e.g. DV001'}
          className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Name</label>
          <input
            required
            value={form.device_name}
            onChange={(e) => setForm({ ...form, device_name: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Type</label>
          <input
            required
            value={form.device_type}
            onChange={(e) => setForm({ ...form, device_type: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Serial Number</label>
          <input
            value={form.serial_number}
            onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">IP Address</label>
          <input
            value={form.ip_address}
            onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          >
            <option>Active</option>
            <option>Inactive</option>
            <option>Under Maintenance</option>
            <option>Retired</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Branch</label>
          <SearchableSelect
            key={`branch-${isOpen}`}
            options={branches}
            value={form.branch_id}
            onChange={(val) => setForm({ ...form, branch_id: val })}
            labelKey="branch_name"
            valueKey="branch_id"
            placeholder="Select branch"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Purchase Date</label>
          <input
            type="date"
            value={form.purchase_date}
            onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Warranty Expiry</label>
          <input
            type="date"
            value={form.warranty_expiry}
            onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Cost ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Assigned User</label>
        <SearchableSelect
          key={`user-${isOpen}`}
          options={users}
          value={form.assigned_user_id}
          onChange={(val) => setForm({ ...form, assigned_user_id: val })}
          labelKey="name"
          valueKey="user_id"
          placeholder="Unassigned"
        />
      </div>
      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          className="bg-slate-800 text-white text-sm rounded px-4 py-1.5 hover:bg-slate-700"
        >
          {submitLabel ?? (editingId ? 'Save Changes' : 'Add Device')}
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

export default DeviceForm
