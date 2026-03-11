import React from 'react'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { PageLayout } from '../../components/pageLayout'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getInvoiceNames } from '../../services/invoiceService'
import { useState, useEffect } from 'react'

import Button from '../../components/ui/Button'
import AddSpreadsheetModal from '../../components/modals/AddSpreadsheetModal'
import { getSpreadsheets } from '../../services/spreadsheetsService'

export const SalesInvoicePage = () => {
  const queryClient = useQueryClient();
  const { data: invoiceNames = [] } = useQuery({ queryKey: ['invoiceNames'], queryFn: getInvoiceNames })
  const [activeInvoiceId, setActiveInvoiceId] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { data: spreadsheets = [] } = useQuery({ queryKey: ['spreadsheets'], queryFn: getSpreadsheets })
  const [activeSheetId, setActiveSheetId] = useState(null)

  useEffect(() => {
    if (!activeInvoiceId && invoiceNames && invoiceNames.length > 0) {
      setActiveInvoiceId(invoiceNames[0].id)
    }
  }, [invoiceNames, activeInvoiceId])

  useEffect(() => {
    const sheetsForInvoice = spreadsheets.filter(s => (s.invoiceName && s.invoiceName.id === activeInvoiceId) || s.invoiceNameId === activeInvoiceId || s.invoice_name_id === activeInvoiceId)
    if (sheetsForInvoice && sheetsForInvoice.length > 0) {
      setActiveSheetId(sheetsForInvoice[0].id)
    } else {
      setActiveSheetId(null)
    }
  }, [activeInvoiceId, spreadsheets])

  const activeSheet = spreadsheets.find(s => s.id === activeSheetId) || null
  
  return (
    <PageLayout>
      <div className="mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-700">SALES INVOICE</h1>
            <p className="mt-1 text-lg text-slate-500">Manage and view all issued invoices, including client details, service descriptions, and payment information.</p>
          </div>

          {invoiceNames && invoiceNames.length > 0 ? (
            <>
              <div className="inline-flex items-center gap-2 bg-slate-100/80 rounded-xl p-1">
                {invoiceNames.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => setActiveInvoiceId(inv.id)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 ${activeInvoiceId === inv.id ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    {inv.name}
                  </button>
                ))}
              </div>

              <div className=" rounded-lg border border-slate-200 bg-white min-h-[50vh] p-6 shadow-sm">
                {invoiceNames.filter(x => x.id === activeInvoiceId).map((sel) => (
                  <div key={sel.id}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-700">{sel.name}</h2>
                        {/* div for tab or spreadsheet sheetTabName */}
                      <div className="inline-flex items-center gap-2 bg-slate-100/80 rounded-xl p-1">
                        {spreadsheets
                          .filter(s => (s.invoiceName && s.invoiceName.id === sel.id) || s.invoiceNameId === sel.id || s.invoice_name_id === sel.id)
                          .map((sh) => (
                            <button
                              key={sh.id}
                              onClick={() => setActiveSheetId(sh.id)}
                              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 ${activeSheetId === sh.id ? 'bg-[#d8ea46] text-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                              {sh.sheetTabName}
                            </button>
                          ))}
                          <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>Add Spreadsheet Tab</Button>
                      </div>
                      </div>
                    </div>

                    <div className="border-t pt-6 text-center text-slate-400">
                      {/* placeholder for templates list */}
                      <ReceiptLongOutlinedIcon sx={{ fontSize: 48 }} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-semibold">No Templates Created{activeSheet ? ` for ${activeSheet.sheetTabName}` : ''}</p>
                      <p className="max-w-lg mx-auto text-sm mt-2">Get started by creating your first template to organize your data. Define custom fields and structure your information exactly the way you need it.</p>
                      {activeSheetId ? (
                        <div className='mt-4'>
                          <Button variant="primary" size="md">Create Table Template</Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <AddSpreadsheetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                invoiceNameId={activeInvoiceId}
                onSuccess={async () => { await queryClient.invalidateQueries({ queryKey: ['invoiceNames', 'spreadsheets'] }) }}
              />
            </>
          ) : (
            <section className="flex min-h-[70vh] items-center justify-center">
              <div className="flex w-full max-w-md flex-col items-center text-center">
                <div className="relative mb-4 text-slate-300">
                  <ReceiptLongOutlinedIcon sx={{ fontSize: 56 }} />
                  <AddCircleOutlineIcon
                    sx={{ fontSize: 24 }}
                    className="absolute -bottom-1 -right-2 rounded-full bg-white"
                  />
                </div>

                <p className="mb-2 text-sm font-semibold text-slate-700">No Sales Invoice Yet</p>
              </div>
            </section>
          )}
      </div>
    </PageLayout>
  )
}
