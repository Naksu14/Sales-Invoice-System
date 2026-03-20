import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'

const parseOptions = (rawValue) => {
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
      .filter(Boolean)
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
          .filter(Boolean)
      }
    } catch {
      // fall back to plain text parsing
    }

    return trimmed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export default function DropdownOptionsModal({
  isOpen,
  onClose,
  onSave,
  initialValue,
  title = 'Dropdown Options',
}) {
  const [items, setItems] = useState([''])

  useEffect(() => {
    if (!isOpen) return
    const parsed = parseOptions(initialValue)
    setItems(parsed.length ? parsed : [''])
  }, [isOpen, initialValue])

  if (!isOpen) return null

  const handleItemChange = (index, value) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? value : item)))
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, ''])
  }

  const handleRemoveItem = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, idx) => idx !== index)
      return next.length ? next : ['']
    })
  }

  const handleSave = () => {
    const cleaned = items.map((item) => item.trim()).filter(Boolean)
    onSave(cleaned)
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg text-left">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-slate-500">Add or remove values for this dropdown list.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800" type="button">
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-2 max-h-[45vh] overflow-auto pr-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
                placeholder={`Option ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="rounded-md border border-rose-200 px-2 py-2 text-xs text-rose-700 hover:bg-rose-50"
                title="Remove option"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddItem}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            + Add option
          </button>

          <div className="flex gap-2">
            <Button variant="secondary" size="md" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="md" type="button" onClick={handleSave}>Save Options</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
