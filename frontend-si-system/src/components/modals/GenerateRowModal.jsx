import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import * as columnService from '../../services/columnTableService'
import { useQueryClient } from '@tanstack/react-query'
import { createSiRecord } from '../../services/siRecordsService'
import { isAmountColumn, formatTo2Decimals } from '../../utils/numberFormatter'
import MultiSelectModal from './MultiSelectModal'

const getColumnKey = (column) => column.dbFieldName || column.db_field_name || column.columnName
const getColumnDataType = (column) => column.dataType || column.data_type || 'text'
const normalizeFieldName = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, '_')
const isStatusColumn = (column) => {
  const key = normalizeFieldName(getColumnKey(column))
  const columnName = normalizeFieldName(column.columnName || '')
  return key === 'status' || columnName === 'status'
}
const isTypeOfServiceColumn = (column) => {
  const key = normalizeFieldName(getColumnKey(column))
  const columnName = normalizeFieldName(column.columnName || '')
  return key === 'type_of_service' || columnName === 'type_of_service'
}

const getInputType = (column) => {
  const dataType = getColumnDataType(column).toLowerCase()
  if (isTypeOfServiceColumn(column)) return 'multiselect'
  if (dataType === 'dropdown' || dataType === 'select') return 'dropdown'
  if (dataType === 'number') return 'number'
  if (dataType === 'date') return 'date'
  return 'text'
}
const getDropdownOptions = (column) => {
  const raw =
    column.dropdownOptions ||
    []

  if (Array.isArray(raw)) {
    return raw
      .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
      .filter(Boolean)
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
          .filter(Boolean)
      }
    } catch {
      // fallback to comma/newline parsing
    }

    return trimmed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}
const normalizeValueForSubmit = (column, value) => {
  if (value === '' || value === null || value === undefined) return undefined
  
  if (isTypeOfServiceColumn(column) && Array.isArray(value)) {
    return value.join(', ')
  }

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
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false)
  const [multiSelectColumn, setMultiSelectColumn] = useState(null)
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
        if (isTypeOfServiceColumn(c)) {
          initial[key] = []
        } else {
          initial[key] = ''
        }
      })
      setValues(initial)
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleChange = (key, v) => setValues(prev => ({ ...prev, [key]: v }))

  const handleBlur = (key, column) => {
    // Format amount/tax columns to 2 decimals when user leaves the field
    if (isAmountColumn(column?.columnName)) {
      setValues(prev => ({
        ...prev,
        [key]: prev[key] ? formatTo2Decimals(prev[key]) : prev[key]
      }))
    }
  }

  const handleSubmit = async () => {
    setError('')

    if (!spreadsheetId) {
      setError('No spreadsheet selected')
      return
    }

    const statusColumn = columns.find((column) => isStatusColumn(column))
    const statusKey = statusColumn ? getColumnKey(statusColumn) : null
    const statusValue = statusKey ? String(values[statusKey] ?? '').trim().toLowerCase() : ''
    const isCancelledStatus = statusValue === 'cancelled'

    // required field validation
    const missing = columns.filter((c) => {
      const key = getColumnKey(c)
      const value = values[key]
      if (isCancelledStatus && !isStatusColumn(c)) return false
      if (!c.isRequired) return false
      if (value === null || value === undefined) return true
      
      if (isTypeOfServiceColumn(c)) {
        return !Array.isArray(value) || value.length === 0
      }

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

  const openMultiSelect = (column) => {
    setMultiSelectColumn(column)
    setIsMultiSelectOpen(true)
  }

  const handleMultiSelectSave = (selectedOptions) => {
    if (multiSelectColumn) {
      const key = getColumnKey(multiSelectColumn)
      handleChange(key, selectedOptions)
    }
    setIsMultiSelectOpen(false)
    setMultiSelectColumn(null)
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
        <div className="w-full max-w-5xl min-h-[40vh] rounded-lg bg-white p-6 shadow-lg text-left flex flex-col justify-between" onKeyDown={handleKeyDown}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Create New Invoice in {tableName}</h3>
              <p className="text-sm text-slate-500">Upload a receipt image for automatic data extraction, or fill the form manually.</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
          </div>

          {/* ... existing code ... */}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {loading ? (
              <div className="col-span-2 text-sm text-slate-500">Loading columns...</div>
            ) : columns.length === 0 ? (
              <div className="col-span-2 text-sm text-slate-500">No columns defined for this sheet.</div>
            ) : (
              columns.map(c => {
                const key = getColumnKey(c)
                const inputType = getInputType(c)
                const dropdownOptions = inputType === 'dropdown' || inputType === 'multiselect' ? getDropdownOptions(c) : []
                
                if (inputType === 'multiselect') {
                  const selectedServices = values[key] || []
                  return (
                    <div key={c.id} className="flex flex-col">
                      <label className="text-lg text-slate-700">{c.columnName}<span className="text-red-500">{c.isRequired ? ' *' : ''}</span></label>
                      <div
                        onClick={() => openMultiSelect(c)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-lg outline-none bg-white cursor-pointer min-h-[44px] flex items-center flex-wrap gap-1"
                      >
                        {selectedServices.length > 0 ? (
                          selectedServices.map(service => (
                            <span key={service} className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full">
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">Select service(s)</span>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={c.id} className="flex flex-col">
                    <label className="text-lg text-slate-700">{c.columnName}<span className="text-red-500">{c.isRequired ? ' *' : ''}</span></label>
                    {inputType === 'dropdown' ? (
                      <select
                        value={values[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-lg outline-none bg-white"
                      >
                        <option value="">Select {c.columnName}</option>
                        {dropdownOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={inputType}
                        value={values[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onBlur={() => handleBlur(key, c)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-lg outline-none"
                        placeholder={c.columnName}
                      />
                    )}
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
      </div>
      {isMultiSelectOpen && multiSelectColumn && (
        <MultiSelectModal
          isOpen={isMultiSelectOpen}
          onClose={() => setIsMultiSelectOpen(false)}
          onSave={handleMultiSelectSave}
          options={getDropdownOptions(multiSelectColumn)}
          initialSelected={values[getColumnKey(multiSelectColumn)] || []}
          title={`Select Type(s) of Service`}
        />
      )}
    </>,
    document.body
  )
}
