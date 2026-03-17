import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import * as columnService from '../../services/columnTableService'
import { updateSiRecord } from '../../services/siRecordsService'

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

export default function EditRecordModal({ isOpen, onClose, record, spreadsheetId, onSuccess }) {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
        initial[key] = record?.data?.[key] ?? ''
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

  const handleSubmit = async () => {
    setError('')

    const missing = columns.filter(
      (c) => {
        const key = getColumnKey(c)
        const value = values[key]
        if (!c.isRequired) return false
        if (value === null || value === undefined) return true
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

  return createPortal(
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
              return (
                <div key={c.id} className="flex flex-col">
                  <label className="text-sm text-slate-700">
                    {c.columnName}
                    {c.isRequired && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    type={getInputType(c)}
                    value={values[key] ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder={c.columnName}
                  />
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
    </div>,
    document.body
  )
}
