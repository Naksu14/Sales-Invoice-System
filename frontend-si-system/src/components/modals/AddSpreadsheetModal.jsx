import React, { useState, useEffect } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import { createSpreadsheet, getSpreadsheets } from '../../services/spreadsheetsService'
import { useQueryClient, useQuery } from '@tanstack/react-query'

export default function AddSpreadsheetModal({ isOpen, onClose, invoiceNameId, onSuccess }) {
  const queryClient = useQueryClient()
  const [spreadsheetUId, setSpreadsheetUId] = useState('')
  const [sheetTabName, setSheetTabName] = useState('Sheet1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSpreadsheetUId('')
      setSheetTabName('Sheet1')
      setError('')
    }
  }, [isOpen])

  // When modal opens, compute next available SheetN name for this invoice
  const { data: allSpreadsheets = [] } = useQuery({
    queryKey: ['spreadsheets'],
    queryFn: getSpreadsheets,
    enabled: !!isOpen,
    staleTime: 1000 * 60,
  })

  useEffect(() => {
    if (!isOpen) return
    if (!invoiceNameId) return

    const sheetsForInvoice = (allSpreadsheets || []).filter(s => s.invoiceName?.id === invoiceNameId || s.invoiceNameId === invoiceNameId)

    // find existing SheetN pattern (case-insensitive)
    let max = 0
    const re = /^Sheet(\d+)$/i
    for (const s of sheetsForInvoice) {
      const m = (s.sheetTabName || '').match(re)
      if (m) {
        const n = parseInt(m[1], 10)
        if (!isNaN(n) && n > max) max = n
      }
    }

    setSheetTabName(`Sheet${max + 1}`)
  }, [isOpen, invoiceNameId, allSpreadsheets])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e && e.preventDefault()
    setError('')
    if (!spreadsheetUId.trim()) return setError('Spreadsheet ID is required')
    if (!sheetTabName.trim()) return setError('Sheet tab name is required')

    setLoading(true)
    try {
      const payload = { invoiceNameId, spreadsheetUId: spreadsheetUId.trim(), sheetTabName: sheetTabName.trim() }
      await createSpreadsheet(payload)
      queryClient.invalidateQueries({ queryKey: ['spreadsheets'] })
      onSuccess && onSuccess()
      onClose()
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to create spreadsheet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg text-left">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Create New tab</h3>
            <p className="text-sm text-slate-500">Add a spreadsheet tab for this invoice profile</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm text-slate-700">Spreadsheet ID <span className="text-rose-600">*</span></label>
          <input name="spreadsheetId" required aria-required="true" autoFocus value={spreadsheetUId} onChange={(e) => setSpreadsheetUId(e.target.value)} placeholder="e.g., 1q23Jv..." className="w-full rounded-md border px-3 py-2" />

          <label className="block text-sm text-slate-700">Sheet Tab Name <span className="text-rose-600">*</span></label>
          <input name="sheetTabName" required aria-required="true" value={sheetTabName} onChange={(e) => setSheetTabName(e.target.value)} placeholder="e.g., Sheet1" className="w-full rounded-md border px-3 py-2" />

          {error && <div className="text-sm text-rose-600">{error}</div>}

          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" size="md" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="md" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
