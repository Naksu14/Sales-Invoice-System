import React, { useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import { createInvoiceName, updateInvoiceName } from '../../services/invoiceService'
import { useQueryClient } from '@tanstack/react-query'

export function InvoiceNameModal({ isOpen, onClose, initialData = null, mode = 'create', onSuccess, onError }) {
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && initialData) {
      setCompanyName(initialData.name || '')
      setDescription(initialData.description || '')
    } else {
      setCompanyName('')
      setDescription('')
      setError('')
    }
  }, [isOpen, initialData, mode])

  if (!isOpen) return null

  const handleCreate = async () => {
    setError('')
    if (!companyName.trim()) {
      setError('Company name is required.')
      return
    }

    setLoading(true)
    try {
      await createInvoiceName({ name: companyName.trim(), description: description.trim() })
      await queryClient.invalidateQueries({ queryKey: ['invoiceNames'] })
      setCompanyName('')
      setDescription('')
      onClose()
      onSuccess && onSuccess({ action: 'create', message: 'Invoice profile created.' })
    } catch (err) {
      const msg = err?.message || err?.error || 'Failed to create invoice profile.'
      setError(msg)
      onError && onError({ action: 'create', message: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!initialData?.id) {
      setError('Invalid invoice data.')
      return
    }
    setError('')
    if (!companyName.trim()) {
      setError('Company name is required.')
      return
    }

    setLoading(true)
    try {
      await updateInvoiceName(initialData.id, { name: companyName.trim(), description: description.trim() })
      await queryClient.invalidateQueries({ queryKey: ['invoiceNames'] })
      setCompanyName('')
      setDescription('')
      onClose()
      onSuccess && onSuccess({ action: 'update', message: 'Invoice profile updated.' })
    } catch (err) {
      const msg = err?.message || err?.error || 'Failed to update invoice profile.'
      setError(msg)
      onError && onError({ action: 'update', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg text-left">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Invoice Profile' : 'Add New Invoice Profile'}</h3>
            <p className="text-sm text-slate-500">{mode === 'edit' ? 'Update this business entity profile' : 'Create a new business entity profile for invoice management'}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (mode === 'edit') handleUpdate()
            else handleCreate()
          }}
        >
          <label className="block text-sm text-slate-700">Company Name:</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
            placeholder="Enter Company Name"
          />

          <label className="block text-sm text-slate-700">Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none min-h-[90px]"
            placeholder="Enter Description (Optional)"
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="mt-4 flex justify-end">
            <Button variant="secondary" size="md" className="mr-3" onClick={onClose} type="button">Cancel</Button>
            {mode === 'edit' ? (
              <Button variant="primary" size="md" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            ) : (
              <Button variant="primary" size="md" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default InvoiceNameModal
