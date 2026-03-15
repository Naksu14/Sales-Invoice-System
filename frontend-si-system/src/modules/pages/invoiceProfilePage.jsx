import React from 'react'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LinkIcon from '@mui/icons-material/Link'
import { PageLayout } from '../../components/pageLayout'
import Button from '../../components/ui/Button'
import Tooltip from '@mui/material/Tooltip'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import InvoiceNameModal from '../../components/modals/InvoiceNameModal'
import EditSheetModal from '../../components/modals/EditSheetModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { getInvoiceNames, deleteInvoiceName } from '../../services/invoiceService'
import { updateSpreadsheet, deleteSpreadsheet } from '../../services/spreadsheetsService'
import { getSpreadsheets } from '../../services/spreadsheetsService'

export const InvoiceProfilePage = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedInvoice, setSelectedInvoice] = React.useState(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmTarget, setConfirmTarget] = React.useState(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
  const [selectedSheet, setSelectedSheet] = React.useState(null)
  const [sheetDeleteOpen, setSheetDeleteOpen] = React.useState(false)
  const [sheetDeleteTarget, setSheetDeleteTarget] = React.useState(null)

  const { data: invoiceNames } = useQuery({
    queryKey: ['invoiceNames'],
    queryFn: getInvoiceNames
  });

  const { data: spreadsheets = [] } = useQuery({
    queryKey: ['spreadsheets'],
    queryFn: getSpreadsheets,
    staleTime: 1000 * 60,
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

  const performDeleteSheet = async () => {
    const id = sheetDeleteTarget?.id
    setSheetDeleteOpen(false)
    setSheetDeleteTarget(null)
    try {
      await deleteSpreadsheet(id)
      await queryClient.invalidateQueries({ queryKey: ['spreadsheets'] })
    } catch (err) {
      console.error('Failed to delete spreadsheet', err)
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-700">INVOICE PROFILE</h1>
              <p className="mt-1 text-lg text-slate-500">Manage and view all invoices type, spreadsheet link and tab name</p>
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
                  <div className="absolute left-0 right-0 top-0 h-2 bg-[#ACBFA4] rounded-t-md" />

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
                          className="text-slate-500 hover:text-slate-800"
                          onClick={() => { setSelectedInvoice(item); setIsModalOpen(true) }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <button
                          className="text-rose-500 hover:text-rose-700"
                          onClick={() => handleDelete(item)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <hr className="my-4 border-t border-slate-200" />
                  <div className="mt-6">
                      {/* Display associated spreadsheets */}
                      <p className="text-sm font-medium text-slate-700 mb-2">Associated Spreadsheets:</p>
                      <div className="flex flex-col gap-2">
                        {(spreadsheets || []).filter(s => (s.invoiceName && s.invoiceName.id === item.id) || s.invoiceNameId === item.id || s.invoice_name_id === item.id).map((sh) => (
                          <div key={sh.id} className="flex justify-between items-center gap-2 bg-slate-50 rounded-md px-3 py-2">
                            <p className="text-sm text-slate-600">{sh.sheetTabName}</p>
                            <div className="flex items-center gap-1">
                              <Tooltip title="Open spreadsheet">
                                <a
                                  href={`https://docs.google.com/spreadsheets/d/${sh.spreadsheetUId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                                >
                                  <LinkIcon fontSize="small" />
                                </a>
                              </Tooltip>

                              <button
                                type="button"
                                title="Edit sheet tab name"
                                className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                                onClick={() => {
                                  setSelectedSheet(sh)
                                  setIsEditSheetOpen(true)
                                }}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </button>

                              <button
                                type="button"
                                title="Delete spreadsheet"
                                className="p-1 rounded-md text-rose-500 hover:bg-rose-50"
                                onClick={() => {
                                  setSheetDeleteTarget(sh)
                                  setSheetDeleteOpen(true)
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </button>
                            </div>
                          </div>
                          // manage columns button could go here if we want it to be per spreadsheet instead of global
                        ))}
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

          <EditSheetModal
            isOpen={isEditSheetOpen}
            onClose={() => { setIsEditSheetOpen(false); setSelectedSheet(null) }}
            initialData={selectedSheet}
            onSuccess={() => {}}
          />

          <ConfirmModal
            isOpen={sheetDeleteOpen}
            title="Delete Spreadsheet"
            message="Are you sure you want to delete this spreadsheet? This action cannot be undone."
            onConfirm={performDeleteSheet}
            onCancel={() => { setSheetDeleteOpen(false); setSheetDeleteTarget(null) }}
            confirmText="Delete"
            cancelText="Cancel"
            requireConfirmationInput={true}
            confirmationPhrase={sheetDeleteTarget ? `Delete this sheet ${sheetDeleteTarget.sheetTabName}` : 'delete this sheet'}
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
