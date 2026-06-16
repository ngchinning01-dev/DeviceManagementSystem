import { useRef, useState } from 'react'
import apiClient from '../api/client'

// Reusable "Import from Excel" control: uploads an .xlsx file to importUrl and
// shows a summary of how many rows were imported/skipped (with per-row reasons).
function ExcelImport({ importUrl, onImported, label = 'Import from Excel' }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setError(null)
    setResult(null)

    apiClient
      .post(importUrl, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => {
        setResult(res.data)
        onImported()
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
  }

  return (
    <div className="text-sm">
      <label className="inline-block bg-slate-200 text-slate-700 rounded px-4 py-1.5 cursor-pointer hover:bg-slate-300">
        {uploading ? 'Uploading...' : label}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="mt-2 text-red-600">{error}</p>}

      {result && (
        <div className="mt-2 text-slate-600">
          <p>
            Imported {result.imported}, skipped {result.skipped}.
          </p>
          {result.errors.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer">View details</summary>
              <ul className="list-disc pl-5">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default ExcelImport
