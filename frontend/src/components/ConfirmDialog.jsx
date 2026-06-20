import Modal from './Modal'

function ConfirmDialog({ isOpen, onClose, onConfirm, message = 'Are you sure you want to delete this? This action cannot be undone.' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete">
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="bg-slate-200 text-slate-700 text-sm rounded px-4 py-1.5 hover:bg-slate-300"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="bg-red-600 text-white text-sm rounded px-4 py-1.5 hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
