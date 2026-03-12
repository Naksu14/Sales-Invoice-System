import React from 'react'
import { createPortal } from 'react-dom'

export const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Confirm Logout</h3>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to logout from your account?
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
