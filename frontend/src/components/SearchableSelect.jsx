import { useEffect, useRef, useState } from 'react'

function SearchableSelect({ options, value, onChange, labelKey, valueKey, placeholder, required = false }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedOption = options.find((opt) => String(opt[valueKey]) === String(value))
  const filteredOptions = options.filter((opt) =>
    opt[labelKey].toLowerCase().includes(search.toLowerCase())
  )

  const select = (val) => {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full text-left flex justify-between items-center bg-white"
      >
        <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <span className="text-slate-400 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          readOnly
          value={value}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
        />
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded shadow-lg">
          <div className="p-1.5 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {!required && (
              <li>
                <button
                  type="button"
                  onClick={() => select('')}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 text-slate-400 ${value === '' ? 'bg-slate-100 font-medium' : ''}`}
                >
                  {placeholder}
                </button>
              </li>
            )}
            {filteredOptions.map((opt) => (
              <li key={opt[valueKey]}>
                <button
                  type="button"
                  onClick={() => select(String(opt[valueKey]))}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 ${String(opt[valueKey]) === String(value) ? 'bg-slate-100 font-medium' : ''}`}
                >
                  {opt[labelKey]}
                </button>
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
