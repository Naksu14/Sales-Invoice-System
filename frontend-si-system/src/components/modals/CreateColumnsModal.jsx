import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
// using simple inline close glyph instead of MUI icon for a lighter bundle
import Button from '../ui/Button'
import { createColumn } from '../../services/columnTableService'
import { useQueryClient } from '@tanstack/react-query'

export default function CreateColumnsModal({ isOpen, onClose, spreadsheetId, onSuccess }) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setRows([{ columnName: '', dbFieldName: '', columnOrder: '', isRequired: false }])
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const addRow = () => setRows(r => [...r, { columnName: '', dbFieldName: '', columnOrder: '', isRequired: false }])
  const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx))
  const updateRow = (idx, key, value) => setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: value } : row))
  const toDbFieldName = (value = '') => value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

  const handleSubmit = async (e) => {
    e && e.preventDefault()
    setError('')
    if (!spreadsheetId) return setError('Spreadsheet not selected')

    // validate rows
    for (const [i, row] of rows.entries()) {
      if (!row.columnName || !row.dbFieldName) return setError(`Row ${i + 1}: columnName and dbFieldName are required`)
    }

    const payload = rows.map(r => ({
      spreadsheetId,
      columnName: r.columnName.trim(),
      dbFieldName: r.dbFieldName.trim(),
      columnOrder: r.columnOrder !== '' ? Number(r.columnOrder) : undefined,
      isRequired: !!r.isRequired,
    }))

    setLoading(true)
    try {
      await createColumn(payload)
      queryClient.invalidateQueries({ queryKey: ['columns'] })
      queryClient.invalidateQueries({ queryKey: ['spreadsheets'] })
      onSuccess && onSuccess()
      onClose()
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to create columns')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-5xl rounded-lg bg-white p-6 shadow-lg text-left">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Create Columns</h3>
            <p className="text-sm text-slate-500">Add one or more columns for this spreadsheet</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100">
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-4 rounded-md border px-3 py-2"
                  placeholder="Column Name"
                  value={row.columnName}
                  onChange={(e) => {
                    const nextColumnName = e.target.value
                    const previousSuggestedDbField = toDbFieldName(row.columnName)
                    const nextSuggestedDbField = toDbFieldName(nextColumnName)

                    updateRow(idx, 'columnName', nextColumnName)

                    // Keep auto suggestion in sync unless the user already customized DB field name.
                    if (!row.dbFieldName || row.dbFieldName === previousSuggestedDbField) {
                      updateRow(idx, 'dbFieldName', nextSuggestedDbField)
                    }
                  }}
                />
                <input className="col-span-3 rounded-md border px-3 py-2 disabled:bg-slate-100" disabled placeholder="DB Field Name" value={row.dbFieldName} onChange={(e) => updateRow(idx, 'dbFieldName', e.target.value)} />
                <input
                  className="col-span-3 rounded-md border px-3 py-2"
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="Order (optional)"
                  value={row.columnOrder}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '').slice(0, 2)
                    updateRow(idx, 'columnOrder', numericValue)
                  }}
                />
                <label className="col-span-1 flex items-center gap-2">
                  <input type="checkbox" checked={row.isRequired} onChange={(e) => updateRow(idx, 'isRequired', e.target.checked)} />
                  <span className="text-sm">Required</span>
                </label>
                <div className="col-span-1 flex justify-center">
                  <button type="button" onClick={() => removeRow(idx)} className="p-1 rounded-md hover:bg-rose-50" title="Remove row">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3-8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}

          <div className="flex items-center justify-between">
            <button type="button" onClick={addRow} className="text-sm text-slate-600 hover:bg-slate-200 p-2 rounded-md border border-slate-300">
              + Add row
            </button>
            <div className="flex gap-3">
              <Button variant="secondary" size="md" type="button" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
