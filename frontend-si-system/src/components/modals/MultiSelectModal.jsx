import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'

export default function MultiSelectModal({
  isOpen,
  onClose,
  onSave,
  options = [],
  initialSelected = [],
  title = 'Select Options',
}) {
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    if (isOpen) {
      // Ensure initialSelected is an array before creating the Set
      const initial = Array.isArray(initialSelected) ? initialSelected : []
      setSelected(new Set(initial))
    }
  }, [isOpen, initialSelected])

  if (!isOpen) return null

  const handleToggle = (option) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(option)) {
        next.delete(option)
      } else {
        next.add(option)
      }
      return next
    })
  }

  const handleSave = () => {
    onSave(Array.from(selected))
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg text-left">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-slate-500">Select one or more services.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800" type="button">
            <CloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-auto p-1">
          {options.map((option) => (
            <label
              key={option}
              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                selected.has(option)
                  ? 'bg-blue-100 border border-blue-400'
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={() => handleToggle(option)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-800">{option}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" type="button" onClick={handleSave}>Save Selections</Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
