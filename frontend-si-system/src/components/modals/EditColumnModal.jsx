import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import { updateColumn } from '../../services/columnTableService'
import { useQueryClient } from '@tanstack/react-query'

export default function EditColumnModal({ isOpen, onClose, initialData = null, onSuccess, onError }) {
  const [columnName, setColumnName] = useState('')
  const [dbFieldName, setDbFieldName] = useState('')
  const [columnOrder, setColumnOrder] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setColumnName(initialData?.columnName || '')
    setDbFieldName(initialData?.dbFieldName || initialData?.db_field_name || '')
    setColumnOrder(initialData?.columnOrder ?? initialData?.column_order ?? '')
    setIsRequired(initialData?.isRequired ?? initialData?.is_required ?? false)
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSave = async () => {
    setError('')
    if (!columnName.trim()) {
      setError('Column name is required.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        columnName: columnName.trim(),
        dbFieldName: dbFieldName.trim(),
        columnOrder: columnOrder === '' ? undefined : Number(columnOrder),
        isRequired: !!isRequired,
      }
      await updateColumn(initialData.id, payload)
      onClose()
      onSuccess && onSuccess()
    } catch (err) {
      const msg = err?.message || err?.error || 'Failed to update column.'
      setError(msg)
      onError && onError({ action: 'update', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg text-left">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Edit Column</h3>
            <p className="text-sm text-slate-500">Update column settings.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
        >
          <label className="block text-sm text-slate-700">Column Name:</label>
          <input
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
            placeholder="Column display name"
          />

          <label className="block text-sm text-slate-700">DB Field Name:</label>
          <input
            type="text"
            value={dbFieldName}
            onChange={(e) => setDbFieldName(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
            placeholder="Database field name (optional)"
          />

          <label className="block text-sm text-slate-700">Column Order:</label>
          <input
            type="number"
            value={columnOrder}
            onChange={(e) => setColumnOrder(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
            placeholder="Order (number)"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
            <span>Required</span>
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="mt-4 flex justify-end">
            <Button variant="secondary" size="md" className="mr-3" onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" size="md" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
