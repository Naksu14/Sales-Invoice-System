import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import { updateSpreadsheet } from '../../services/spreadsheetsService'
import { useQueryClient } from '@tanstack/react-query'

export default function EditSheetModal({ isOpen, onClose, initialData = null, onSuccess, onError }) {
  const [sheetTabName, setSheetTabName] = useState('')
  const [spreadsheetUId, setSpreadsheetUId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setSheetTabName(initialData?.sheetTabName || '')
    setSpreadsheetUId(initialData?.spreadsheetUId || '')

  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSave = async () => {
    setError('')
    if (!sheetTabName.trim()) {
      setError('Sheet tab name is required.')
      return
    }
    setLoading(true)
    try {
      await updateSpreadsheet(initialData.id, { sheetTabName: sheetTabName.trim(), spreadsheetUId: spreadsheetUId.trim() })
      await queryClient.invalidateQueries({ queryKey: ['spreadsheets'] })
      onClose()
      onSuccess && onSuccess({ action: 'update', message: 'Sheet updated.' })
    } catch (err) {
      const msg = err?.message || 'Failed to update sheet.'
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
            <h3 className="text-lg font-semibold">Edit Sheet Tab Name</h3>
            <p className="text-sm text-slate-500">Update the sheet tab name for this spreadsheet.</p>
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
          <label className="block text-sm text-slate-700">Sheet Tab Name:</label>
          <input
            type="text"
            value={sheetTabName}
            onChange={(e) => setSheetTabName(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
            placeholder="Enter Sheet Tab Name"
          />
          <label className="block text-sm text-slate-700">Spread Sheet UID:</label>
          <input
            type="text"
            value={spreadsheetUId}
            onChange={(e) => setSpreadsheetUId(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
            placeholder="Enter Spreadsheet UID"
          />

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
