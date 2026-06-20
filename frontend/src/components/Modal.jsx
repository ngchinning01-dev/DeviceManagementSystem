import { useEffect } from 'react'

// Generic modal overlay. Closes on ESC key or clicking outside the card.
function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto max-h-[90vh] p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
