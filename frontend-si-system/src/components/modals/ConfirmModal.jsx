import React, { useState, useEffect } from 'react'
import Button from '../ui/Button'
import { createPortal } from 'react-dom'

export default function ConfirmModal({
  isOpen,
  title = 'Confirm',
  message = 'Are you sure?',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  // when true, show an input asking the user to type `confirmationPhrase` exactly
  requireConfirmationInput = false,
  confirmationPhrase = ''
}) {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (!isOpen) setInputValue('')
  }, [isOpen])

  if (!isOpen) return null

  const isMatch = requireConfirmationInput ? inputValue.trim() === confirmationPhrase : true

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg text-left">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{message}</p>
        </div>

        {requireConfirmationInput && (
          <div className="mb-3">
            <p className="text-sm text-red-500">Type <span className="font-mono">"{confirmationPhrase}"</span> to confirm.</p>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="mt-2 w-full rounded-md border px-3 py-2"
              placeholder={`Type "${confirmationPhrase}"`}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" size="sm" onClick={onCancel} type="button">{cancelText}</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} type="button" disabled={!isMatch}>{confirmText}</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
