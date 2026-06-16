import { useEffect, useRef, useState } from 'react'
import apiClient from '../api/client'

// Hamburger (☰) dropdown menu with Add New, Import from Excel, and Export actions.
// Replaces the old inline ExcelImport button; import result/errors show below the button.
function ActionsMenu({ onAddNew, importUrl, onImported, exportUrl, exportFilename }) {
  const [open, setOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)
  const menuRef = useRef(null)
  const fileInputRef = useRef(null)

  // Close dropdown when clicking outside.
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAddNew = () => {
    setOpen(false)
    onAddNew()
  }

  const handleImportClick = () => {
    setOpen(false)
    setImportResult(null)
    setImportError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    setImporting(true)

    apiClient
      .post(importUrl, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => {
        setImportResult(res.data)
        onImported()
      })
      .catch((err) => setImportError(err.response?.data?.error || err.message))
      .finally(() => {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
  }

  const handleExport = () => {
    setOpen(false)
    apiClient
      .get(exportUrl, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = exportFilename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      })
      .catch(() => {})
  }

  return (
    <div className="relative text-sm" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex flex-col justify-center gap-1 w-8 h-8 items-center rounded hover:bg-slate-100 p-1.5"
        aria-label="Actions menu"
      >
        <span className="block w-full h-0.5 bg-slate-700 rounded" />
        <span className="block w-full h-0.5 bg-slate-700 rounded" />
        <span className="block w-full h-0.5 bg-slate-700 rounded" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
          <button
            onClick={handleAddNew}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Add New
          </button>
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import from Excel'}
          </button>
          <button
            onClick={handleExport}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Export
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="hidden"
      />

      {importError && (
        <p className="absolute right-0 mt-1 w-56 text-xs text-red-600 bg-white border border-red-200 rounded p-2 shadow z-10">
          {importError}
        </p>
      )}

      {importResult && (
        <div className="absolute right-0 mt-1 w-56 text-xs text-slate-600 bg-white border border-slate-200 rounded p-2 shadow z-10">
          <p>Imported {importResult.imported}, skipped {importResult.skipped}.</p>
          {importResult.errors.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer">View details</summary>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                {importResult.errors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.reason}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default ActionsMenu
