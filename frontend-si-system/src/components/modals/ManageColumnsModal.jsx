import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import Button from '../ui/Button'
import { getColumns, deleteColumn } from '../../services/columnTableService'
import { useQueryClient } from '@tanstack/react-query'
import EditColumnModal from './EditColumnModal'
import ConfirmModal from './ConfirmModal'
import CreateColumnsModal from './CreateColumnsModal'

export default function ManageColumnsModal({ isOpen, onClose, spreadsheetId, spreadsheetName }) {
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [delTarget, setDelTarget] = useState(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isOpen) return
    fetchColumns()
  }, [isOpen, spreadsheetId])

  const fetchColumns = async () => {
    if (!spreadsheetId) return
    setLoading(true)
    try {
      const cols = await getColumns(spreadsheetId)
      setColumns(cols || [])
    } catch (err) {
      console.error('Failed to load columns', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (col) => {
    setDelTarget(col)
    setDelOpen(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteColumn(delTarget.id)
      await fetchColumns()
      await queryClient.invalidateQueries({ queryKey: ['columns', spreadsheetId] })
    } catch (err) {
      console.error('Failed to delete column', err)
    } finally {
      setDelOpen(false)
      setDelTarget(null)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg text-left">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Manage Columns for {spreadsheetName || spreadsheetId}</h3>
            <p className="text-sm text-slate-500">Edit or remove columns for this spreadsheet tab.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : columns.length === 0 ? (
            <p className="text-sm text-slate-500">No columns found for this tab.</p>
          ) : (
            <div className="space-y-2">
              {columns.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{c.columnName}</div>
                    <div className="text-xs text-slate-500">DB: {c.dbFieldName || '-'} • Type: {c.dataType || c.data_type || 'text'} • Order: {c.columnOrder ?? '-'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setSelectedColumn(c); setIsEditOpen(true) }}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(c)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between">
          <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)}>+ Add Column</Button>
          <Button variant="secondary" size="md" onClick={onClose}>Close</Button>
        </div>

        <CreateColumnsModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          spreadsheetId={spreadsheetId}
          onSuccess={async () => {
            await fetchColumns()
            setIsCreateOpen(false)
            await queryClient.invalidateQueries({ queryKey: ['columns', spreadsheetId] })
          }}
        />

        <EditColumnModal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setSelectedColumn(null); fetchColumns(); }}
          initialData={selectedColumn}
          onSuccess={async () => { await fetchColumns(); setIsEditOpen(false); setSelectedColumn(null); await queryClient.invalidateQueries({ queryKey: ['columns', spreadsheetId] }) }}
        />

        <ConfirmModal
          isOpen={delOpen}
          title="Delete Column"
          message="Are you sure you want to delete this column? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => { setDelOpen(false); setDelTarget(null) }}
          confirmText="Delete"
          cancelText="Cancel"
          requireConfirmationInput={true}
          confirmationPhrase={delTarget ? `Delete this column ${delTarget.columnName}` : 'delete this column'}
        />
      </div>
    </div>,
    document.body
  )
}
