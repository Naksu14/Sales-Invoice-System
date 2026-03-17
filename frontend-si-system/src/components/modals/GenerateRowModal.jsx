import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import * as columnService from '../../services/columnTableService'
import { useQueryClient } from '@tanstack/react-query'
import { createSiRecord } from '../../services/siRecordsService'

const getColumnKey = (column) => column.dbFieldName || column.db_field_name || column.columnName
const getColumnDataType = (column) => column.dataType || column.data_type || 'text'
const getInputType = (column) => {
  const dataType = getColumnDataType(column)
  if (dataType === 'number') return 'number'
  if (dataType === 'date') return 'date'
  return 'text'
}
const normalizeValueForSubmit = (column, value) => {
  if (value === '' || value === null || value === undefined) return undefined
  const dataType = getColumnDataType(column)
  if (dataType === 'number') return Number(value)
  return value
}

export default function GenerateRowModal({ isOpen, onClose, spreadsheetId, onSubmit, tableName }) {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState('manual') // 'upload' | 'manual'
  const [file, setFile] = useState(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isOpen) {
      setValues({})
      setError('')
      setFile(null)
      setMode('manual')
      return
    }
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
        const key = getColumnKey(c)
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

    if (!spreadsheetId) {
      setError('No spreadsheet selected')
      return
    }

    // required field validation
    const missing = columns.filter((c) => {
      const key = getColumnKey(c)
      const value = values[key]
      if (!c.isRequired) return false
      if (value === null || value === undefined) return true
      return value.toString().trim() === ''
    })
    if (missing.length > 0) {
      setError(`Please fill required fields: ${missing.map(m => m.columnName).join(', ')}`)
      return
    }

    // build data JSON from dbFieldName keys with non-empty values only
    const data = {}
    columns.forEach(c => {
      const key = getColumnKey(c)
      const rawValue = values[key]
      const trimmedValue = rawValue?.toString().trim() ?? ''
      if (trimmedValue !== '') {
        data[key] = normalizeValueForSubmit(c, rawValue)
      }
    })

    setSaving(true)
    try {
      await createSiRecord({ sheetId: spreadsheetId, data })
      queryClient.invalidateQueries({ queryKey: ['si-records', spreadsheetId] })
      onSubmit?.(data)
      onClose()
    } catch (err) {
      console.error('submit failed', err)
      setError(err?.message || err?.error || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !saving) {
        e.preventDefault()
        handleSubmit()
      }
    }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-5xl min-h-[40vh] rounded-lg bg-white p-6 shadow-lg text-left flex flex-col justify-between" onKeyDown={handleKeyDown}>
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
            <div className="mt-4">
              <label className="flex flex-col items-center justify-center w-full h-52 md:h-64 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors px-6 text-center">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <div className="mb-3 text-slate-400" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M7.5 15l2.5-3 2.5 2 2-2.5L17 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="16.5" cy="8.5" r="1.5" fill="currentColor" />
                    <circle cx="18" cy="17" r="4" fill="currentColor" opacity="0.2" />
                    <path d="M18 15.8v2.4M16.8 17h2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="text-2xl font-semibold text-slate-900">Upload Receipt Image</div>
                <div className="mt-2 text-base text-slate-500">Click to browse or drag and drop PNG, JPG up to 10MB</div>
                {file && <div className="mt-4 text-sm font-medium text-slate-700">Selected: {file.name}</div>}
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-2 text-sm text-slate-500">Loading columns...</div>
          ) : columns.length === 0 ? (
            <div className="col-span-2 text-sm text-slate-500">No columns defined for this sheet.</div>
          ) : (
            columns.map(c => {
              const key = getColumnKey(c)
              return (
                <div key={c.id} className="flex flex-col">
                  <label className="text-lg text-slate-700">{c.columnName}<span className="text-red-500">{c.isRequired ? ' *' : ''}</span></label>
                  <input
                    type={getInputType(c)}
                    value={values[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-lg outline-none"
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
          <Button variant="primary" size="md" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Invoice'}</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
