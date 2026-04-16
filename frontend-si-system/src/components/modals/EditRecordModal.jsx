import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import * as columnService from '../../services/columnTableService'
import { updateSiRecord } from '../../services/siRecordsService'
import { isAmountColumn, formatTo2Decimals } from '../../utils/numberFormatter'
import MultiSelectModal from './MultiSelectModal'

const getColumnKey = (column) => column.dbFieldName || column.db_field_name || column.columnName
const getColumnDataType = (column) => column.dataType || column.data_type || 'text'
const normalizeFieldName = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, '_')

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
    column.dropdown_options ||
    column.options ||
    column.optionValues ||
    column.option_values ||
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

  if (isTypeOfServiceColumn(column)) {
    return Array.isArray(value) ? value.join(', ') : value
  }

  const dataType = getColumnDataType(column).toLowerCase()
  if (dataType === 'number') return Number(value)
  return value
}

export default function EditRecordModal({ isOpen, onClose, record, spreadsheetId, onSuccess }) {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false)
  const [multiSelectColumn, setMultiSelectColumn] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setValues({})
      setError('')
      return
    }
    loadColumns()
  }, [isOpen, spreadsheetId])

  const loadColumns = async () => {
    if (!spreadsheetId) return
    setLoading(true)
    try {
      const cols = await columnService.getColumns(spreadsheetId)
      setColumns(cols || [])
      const initial = {}
      ;(cols || []).forEach((c) => {
        const key = getColumnKey(c)
        const initialValue = record?.data?.[key] ?? ''
        if (isTypeOfServiceColumn(c)) {
          initial[key] = typeof initialValue === 'string' ? initialValue.split(',').map(s => s.trim()).filter(Boolean) : []
        } else {
          initial[key] = initialValue
        }
      })
      setValues(initial)
    } catch (err) {
      setError('Failed to load columns')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !record) return null

  const handleChange = (key, v) => setValues((prev) => ({ ...prev, [key]: v }))

  const handleBlur = (key, column) => {
    // Format amount/tax columns to 2 decimals when user leaves the field
    if (isAmountColumn(column?.columnName)) {
      setValues((prev) => ({
        ...prev,
        [key]: prev[key] ? formatTo2Decimals(prev[key]) : prev[key]
      }))
    }
  }

  const handleSubmit = async () => {
    setError('')

    const missing = columns.filter(
      (c) => {
        const key = getColumnKey(c)
        const value = values[key]
        if (!c.isRequired) return false
        if (value === null || value === undefined) return true
        
        if (isTypeOfServiceColumn(c)) {
          return !Array.isArray(value) || value.length === 0
        }

        return value.toString().trim() === ''
      }
    )
    if (missing.length > 0) {
      setError(`Please fill required fields: ${missing.map((m) => m.columnName).join(', ')}`)
      return
    }

    const data = {}
    columns.forEach((c) => {
      const key = getColumnKey(c)
      const rawValue = values[key]
      const trimmedValue = rawValue?.toString().trim() ?? ''
      if (trimmedValue !== '') {
        data[key] = normalizeValueForSubmit(c, rawValue)
      }
    })

    setSaving(true)
    try {
      await updateSiRecord(record.id, { data })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to update record')
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
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg text-left flex flex-col gap-4" onKeyDown={handleKeyDown}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Edit Invoice Record</h3>
              <p className="text-sm text-slate-500">Update the fields below and save your changes.</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
              <CloseIcon />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loading ? (
              <div className="col-span-2 text-sm text-slate-500">Loading fields...</div>
            ) : columns.length === 0 ? (
              <div className="col-span-2 text-sm text-slate-500">No columns defined for this sheet.</div>
            ) : (
              columns.map((c) => {
                const key = getColumnKey(c)
                const inputType = getInputType(c)
                const dropdownOptions = inputType === 'dropdown' || inputType === 'multiselect' ? getDropdownOptions(c) : []

                if (inputType === 'multiselect') {
                  const selectedServices = values[key] || []
                  return (
                    <div key={c.id} className="flex flex-col">
                      <label className="text-sm text-slate-700">
                        {c.columnName}
                        {c.isRequired && <span className="text-red-500"> *</span>}
                      </label>
                      <div
                        onClick={() => openMultiSelect(c)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none bg-white cursor-pointer min-h-[38px] flex items-center flex-wrap gap-1"
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
                    <label className="text-sm text-slate-700">
                      {c.columnName}
                      {c.isRequired && <span className="text-red-500"> *</span>}
                    </label>
                    {inputType === 'dropdown' ? (
                      <select
                        value={values[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                      >
                        <option value="">Select {c.columnName}</option>
                        {dropdownOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={inputType}
                        value={values[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onBlur={() => handleBlur(key, c)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                        placeholder={c.columnName}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
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
