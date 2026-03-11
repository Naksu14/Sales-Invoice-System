import React from 'react'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { PageLayout } from '../../components/pageLayout'
import Button from '../../components/ui/Button'
import Tooltip from '@mui/material/Tooltip'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import InvoiceNameModal from '../../components/modals/InvoiceNameModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { getInvoiceNames, deleteInvoiceName } from '../../services/invoiceService'

export const InvoiceProfilePage = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedInvoice, setSelectedInvoice] = React.useState(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmTarget, setConfirmTarget] = React.useState(null)

  const { data: invoiceNames } = useQuery({
    queryKey: ['invoiceNames'],
    queryFn: getInvoiceNames
  });

  const handleDelete = async (item) => {
    // open confirm modal with the selected invoice object
    setConfirmTarget(item)
    setConfirmOpen(true)
  }

  const performDelete = async () => {
    const id = confirmTarget?.id
    setConfirmOpen(false)
    setConfirmTarget(null)
    try {
      await deleteInvoiceName(id)
      await queryClient.invalidateQueries({ queryKey: ['invoiceNames'] })
    } catch (err) {
      console.error('Failed to delete', err)
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-700">INVOICE PROFILE</h1>
              <p className="mt-1 text-lg text-slate-500">Manage and view all issued invoices, including client details, service descriptions, and payment information.</p>
            </div>
            <div>
              {invoiceNames && invoiceNames.length > 0 && (
                <Button variant="primary" size="md" onClick={() => { setSelectedInvoice(null); setIsModalOpen(true) }} tooltip="Add a new invoice">
                  <AddCircleOutlineIcon sx={{ fontSize: 16 }} className='mr-2'/>
                  Add New Invoice
                </Button>
              )}
            </div>
          </div>

          {/* If there are invoice profiles show them as cards, otherwise show placeholder */}
          {invoiceNames && invoiceNames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {invoiceNames.map((item) => (
                <div key={item.id} className="rounded-sm bg-white p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 right-0 top-0 h-2 bg-[#d8ea46] rounded-t-md" />

                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-md bg-slate-100 p-3 text-slate-700">
                        <ReceiptLongOutlinedIcon sx={{ fontSize: 22 }} />
                      </div>

                      <div>
                        <h3 className="text-md font-bold uppercase decoration-sky-600 decoration-2">{item.name}</h3>
                        {item.description ? (
                          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                        ) : (
                          <p className="mt-2 text-sm text-slate-400">&nbsp;</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tooltip title="Edit">
                        <button
                          className="text-slate-300 hover:text-slate-800"
                          onClick={() => { setSelectedInvoice(item); setIsModalOpen(true) }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <button
                          className="text-rose-300 hover:text-rose-700"
                          onClick={() => handleDelete(item)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <section className="flex min-h-[40vh] items-center justify-center">
              <div className="flex w-full max-w-md flex-col items-center text-center">
                <div className="relative mb-4 text-slate-300">
                  <ReceiptLongOutlinedIcon sx={{ fontSize: 56 }} />
                  <AddCircleOutlineIcon
                    sx={{ fontSize: 24 }}
                    className="absolute -bottom-1 -right-2 rounded-full bg-white"
                  />
                </div>

                <p className="mb-2 text-sm font-semibold text-slate-700">No Sales Invoice Yet</p>
                <p className="max-w-xs text-sm leading-6 text-slate-500">
                  Start generating revenue by creating your first sales invoice. Track payments,
                  manage client billing, and keep your financial records organized.
                </p>

                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => { setSelectedInvoice(null); setIsModalOpen(true) }}
                    tooltip="Create a new invoice"
                  >
                    <AddCircleOutlineIcon sx={{ fontSize: 16 }} className='mr-2'/>
                    Create Invoice
                  </Button>
                </div>
              </div>
            </section>
          )}
          {/* Modal rendered once so it's available in both states */}
          <InvoiceNameModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setSelectedInvoice(null) }}
            initialData={selectedInvoice}
            mode={selectedInvoice ? 'edit' : 'create'}
          />

          <ConfirmModal
            isOpen={confirmOpen}
            title="Delete Invoice Profile"
            message="Are you sure you want to delete this invoice profile? This action cannot be undone."
            onConfirm={performDelete}
            onCancel={() => { setConfirmOpen(false); setConfirmTarget(null) }}
            confirmText="Delete"
            cancelText="Cancel"
            requireConfirmationInput={true}
            confirmationPhrase={confirmTarget ? `Delete this data ${confirmTarget.name}` : 'delete this data'}
          />
      </div>
    </PageLayout>
  )
}
