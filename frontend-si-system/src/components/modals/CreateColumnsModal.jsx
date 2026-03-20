import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
// using simple inline close glyph instead of MUI icon for a lighter bundle
import Button from '../ui/Button'
import DropdownOptionsModal from './DropdownOptionsModal'
import { createColumn } from '../../services/columnTableService'
import { useQueryClient } from '@tanstack/react-query'

const DEFAULT_ROW = { columnName: '', dbFieldName: '', dataType: 'text', dropdownOptions: '', columnOrder: '', isRequired: false }
const DATA_TYPE_OPTIONS = ['text', 'number', 'date', 'dropdown']

export default function CreateColumnsModal({ isOpen, onClose, spreadsheetId, onSuccess }) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeOptionsRow, setActiveOptionsRow] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setRows([DEFAULT_ROW])
      setError('')
      setActiveOptionsRow(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const addRow = () => setRows(r => [...r, DEFAULT_ROW])
  const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx))
  const updateRow = (idx, key, value) => setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: value } : row))
  const getOptionCount = (rawValue = '') => rawValue
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean)
    .length
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
      if (!row.columnName || !row.dbFieldName || !row.dataType) {
        return setError(`Row ${i + 1}: columnName, dbFieldName, and dataType are required`)
      }
      if (row.dataType === 'dropdown' && !row.dropdownOptions?.trim()) {
        return setError(`Row ${i + 1}: dropdown options are required for dropdown data type`)
      }
    }

    const payload = rows.map(r => ({
      spreadsheetId,
      columnName: r.columnName.trim(),
      dbFieldName: r.dbFieldName.trim(),
      dataType: r.dataType,
      dropdownOptions: r.dataType === 'dropdown' ? r.dropdownOptions.trim() : undefined,
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
      <div className="w-full max-w-6xl rounded-lg bg-white p-6 shadow-lg text-left">
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
              <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Column #{idx + 1}</span>
                  <button type="button" onClick={() => removeRow(idx)} className="rounded-md px-2 py-1 text-xs text-rose-700 hover:bg-rose-50" title="Remove row">
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Column Name</label>
                    <input
                      className="w-full rounded-md border px-3 py-2"
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
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-slate-600">DB Field Name</label>
                    <input
                      className="w-full rounded-md border px-3 py-2 disabled:bg-slate-100"
                      disabled
                      placeholder="DB Field Name"
                      value={row.dbFieldName}
                      onChange={(e) => updateRow(idx, 'dbFieldName', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Data Type</label>
                    <select
                      className="w-full rounded-md border px-3 py-2 bg-white"
                      value={row.dataType}
                      onChange={(e) => {
                        const nextType = e.target.value
                        updateRow(idx, 'dataType', nextType)
                        if (nextType !== 'dropdown') {
                          updateRow(idx, 'dropdownOptions', '')
                        }
                      }}
                    >
                      {DATA_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Order</label>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="0"
                      value={row.columnOrder}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, '').slice(0, 2)
                        updateRow(idx, 'columnOrder', numericValue)
                      }}
                    />
                  </div>

                  <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={row.isRequired} onChange={(e) => updateRow(idx, 'isRequired', e.target.checked)} />
                    Required
                  </label>

                  <div className="md:col-span-12">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Dropdown Options</label>
                    <button
                      type="button"
                      className="w-full rounded-md border px-3 py-2 text-left text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
                      onClick={() => setActiveOptionsRow(idx)}
                      disabled={row.dataType !== 'dropdown'}
                      title="Open options list editor"
                    >
                      {row.dataType === 'dropdown'
                        ? `Manage options (${getOptionCount(row.dropdownOptions || '')})`
                        : 'Available when Data Type is Dropdown'}
                    </button>
                  </div>
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

        <DropdownOptionsModal
          isOpen={activeOptionsRow !== null}
          onClose={() => setActiveOptionsRow(null)}
          initialValue={activeOptionsRow !== null ? rows[activeOptionsRow]?.dropdownOptions || '' : ''}
          onSave={(items) => {
            if (activeOptionsRow === null) return
            updateRow(activeOptionsRow, 'dropdownOptions', items.join('\n'))
          }}
          title="Dropdown Options"
        />
      </div>
    </div>,
    document.body
  )
}
