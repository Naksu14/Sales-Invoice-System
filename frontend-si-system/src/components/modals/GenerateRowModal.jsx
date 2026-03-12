import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import * as columnService from '../../services/columnTableService'

export default function GenerateRowModal({ isOpen, onClose, spreadsheetId, onSubmit, tableName }) {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [mode, setMode] = useState('manual') // 'upload' | 'manual'
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    loadColumns()
  }, [isOpen, spreadsheetId])

  const loadColumns = async () => {
    if (!spreadsheetId) return
    setLoading(true)
    try {
      if (typeof columnService.getColumns !== 'function') {
        throw new TypeError('getColumns is not a function on columnService')
      }
      const cols = await columnService.getColumns(spreadsheetId)
      setColumns(cols || [])
      const initial = {}
      (cols || []).forEach(c => {
        const key = c.dbFieldName || c.db_field_name || c.columnName
        initial[key] = ''
      })
      setValues(initial)
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleChange = (key, v) => setValues(prev => ({ ...prev, [key]: v }))

  const handleSubmit = async () => {
    setError('')
    // basic required validation
    const missing = columns.filter(c => c.isRequired && !(values[c.dbFieldName || c.db_field_name || c.columnName] || '').toString().trim())
    if (missing.length > 0) {
      setError(`Please fill required fields: ${missing.map(m => m.columnName).join(', ')}`)
      return
    }

    try {
      await onSubmit?.(values)
      onClose()
    } catch (err) {
      console.error('submit failed', err)
      setError(err?.message || 'Failed to submit')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl min-h-[40vh] rounded-lg bg-white p-6 shadow-lg text-left flex flex-col justify-between">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Create New Invoice in {tableName}</h3>
            <p className="text-sm text-slate-500">Upload a receipt image for automatic data extraction, or fill the form manually.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
        </div>

        {/* Mode switch: Upload Receipt / Manual Form */}
        <div className="mb-4 text-center">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex items-center gap-3 px-6 py-2 rounded-lg text-sm ${mode === 'upload' ? 'bg-[#0b2a32] text-white' : 'text-slate-700'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
              <span>Upload Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex items-center gap-3 px-6 py-2 rounded-lg text-sm ${mode === 'manual' ? 'bg-[#0b2a32] text-white' : 'text-slate-700'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Manual Form</span>
            </button>
          </div>

          {mode === 'upload' && (
            <div className="mt-3">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-md cursor-pointer bg-white">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <div className="text-sm text-slate-600">Click to upload receipt (PNG, JPG, PDF)</div>
                {file && <div className="text-xs text-slate-500 mt-2">Selected: {file.name}</div>}
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loading ? (
            <div className="col-span-2 text-sm text-slate-500">Loading columns...</div>
          ) : columns.length === 0 ? (
            <div className="col-span-2 text-sm text-slate-500">No columns defined for this sheet.</div>
          ) : (
            columns.map(c => {
              const key = c.dbFieldName || c.db_field_name || c.columnName
              return (
                <div key={c.id} className="flex flex-col">
                  <label className="text-sm text-slate-700">{c.columnName}<span className="text-red-500">{c.isRequired ? ' *' : ''}</span></label>
                  <input
                    value={values[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
                    placeholder={c.columnName}
                  />
                </div>
              )
            })
          )}
        </div>

        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="md" className="mr-3" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={handleSubmit}>Save Invoice</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
