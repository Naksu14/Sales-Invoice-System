import React from 'react'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { PageLayout } from '../../components/pageLayout'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getInvoiceNames } from '../../services/invoiceService'
import { useState, useEffect } from 'react'
import Button from '../../components/ui/Button'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddSpreadsheetModal from '../../components/modals/AddSpreadsheetModal'
import CreateColumnsModal from '../../components/modals/CreateColumnsModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import ManageColumnsModal from '../../components/modals/ManageColumnsModal'
import { getSpreadsheets } from '../../services/spreadsheetsService'
import { getColumns, deleteColumn } from '../../services/columnTableService'
import EditColumnModal from '../../components/modals/EditColumnModal'
import GenerateRowModal from '../../components/modals/GenerateRowModal'
import ImportRecordsModal from '../../components/modals/ImportRecordsModal'
import EditRecordModal from '../../components/modals/EditRecordModal'
import { getSiRecordsBySheet, deleteSiRecord } from '../../services/siRecordsService'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { PageLoadingError } from '../../components/ui/PageLoadingError'

export const SalesInvoicePage = () => {
  const queryClient = useQueryClient();
  const { data: invoiceNames = [], isLoading: loadingInvoices, error: invoicesError } = useQuery({ queryKey: ['invoiceNames'], queryFn: getInvoiceNames })
  const [activeInvoiceId, setActiveInvoiceId] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCreateColumnsOpen, setIsCreateColumnsOpen] = useState(false)
  const { data: spreadsheets = [], isLoading: loadingSheets, error: sheetsError } = useQuery({ queryKey: ['spreadsheets'], queryFn: getSpreadsheets })
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
  const { data: columns = [] } = useQuery({
    queryKey: ['columns', activeSheetId],
    queryFn: () => getColumns(activeSheetId),
    enabled: !!activeSheetId,
    staleTime: 1000 * 60,
  })
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState(null)
  const [colDeleteOpen, setColDeleteOpen] = useState(false)
  const [colDeleteTarget, setColDeleteTarget] = useState(null)
  const [isManageColsOpen, setIsManageColsOpen] = useState(false)
  const [isGenerateRowOpen, setIsGenerateRowOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isEditRecordOpen, setIsEditRecordOpen] = useState(false)
  const [editRecordTarget, setEditRecordTarget] = useState(null)
  const [recordDeleteOpen, setRecordDeleteOpen] = useState(false)
  const [recordDeleteTarget, setRecordDeleteTarget] = useState(null)

  const { data: siRecords = [] } = useQuery({
    queryKey: ['si-records', activeSheetId],
    queryFn: () => getSiRecordsBySheet(activeSheetId),
    enabled: !!activeSheetId,
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [dateCreatedSortOrder, setDateCreatedSortOrder] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')

  const getCreatedTimestamp = (record) => {
    const rawValue =
      record.createdAt

    const timestamp = rawValue ? new Date(rawValue).getTime() : 0
    return Number.isNaN(timestamp) ? 0 : timestamp
  }

  const filteredRecords = siRecords.filter((record) => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return true

    const valuesFromColumns = columns.map((c) => {
      const key = c.dbFieldName || c.columnName
      return record.data?.[key]
    })

    const searchableText = [
      record.id,
      record.createdAt,
      ...valuesFromColumns,
    ]
      .filter((v) => v !== undefined && v !== null)
      .join(' ')
      .toLowerCase()

    return searchableText.includes(q)
  })

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const timeA = getCreatedTimestamp(a)
    const timeB = getCreatedTimestamp(b)

    if (timeA === timeB) {
      return Number(a.id || 0) - Number(b.id || 0)
    }

    return dateCreatedSortOrder === 'asc' ? timeA - timeB : timeB - timeA
  })

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / rowsPerPage))
  const paginatedRecords = sortedRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeSheetId, activeInvoiceId])

  useEffect(() => {
    setCurrentPage(1)
  }, [dateCreatedSortOrder])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }
  
  const buildExportData = () => {
    const headers = columns.map((c) => c.columnName)
    const rows = siRecords.map((rec) => {
      const obj = {}
      columns.forEach((c) => {
        const key = c.dbFieldName || c.columnName
        obj[c.columnName] = rec.data?.[key] ?? ''
      })
      obj['Created At'] = rec.createdAt ?? ''
      obj['ID'] = rec.id ?? ''
      return obj
    })

    return { headers, rows }
  }

  const exportToExcel = () => {
    if (!activeInvoiceId || !activeSheetId) return
    const activeInvoice = invoiceNames.find((i) => i.id === activeInvoiceId) || {}
    const { headers, rows } = buildExportData()

    const ws = XLSX.utils.json_to_sheet(rows, { header: [...headers, 'Created At', 'ID'] })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, activeSheet?.sheetTabName || 'Sheet1')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${activeInvoice.name || 'Invoice'}.xlsx`)
  }

  const exportToCSV = () => {
    if (!activeInvoiceId || !activeSheetId) return
    const activeInvoice = invoiceNames.find((i) => i.id === activeInvoiceId) || {}
    const { headers, rows } = buildExportData()

    const ws = XLSX.utils.json_to_sheet(rows, { header: [...headers, 'Created At', 'ID'] })
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${activeInvoice.name || 'Invoice'} - ${activeSheet?.sheetTabName || 'Sheet'}.csv`)
  }

  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const openExport = Boolean(exportAnchorEl)
  const handleExportClick = (e) => setExportAnchorEl(e.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)
  
  return (
    <PageLayout>
      <div className="mx-auto space-y-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-700">SALES INVOICE</h1>
            <p className="mt-1 text-lg text-slate-500">Manage and view all issued invoices, including client details, service descriptions, and payment information.</p>
          </div>

          {(invoicesError || sheetsError) && (
            <PageLoadingError 
              error="Failed to load sales invoice data. Please check your connection and try again."
            />
          )}

          {loadingInvoices || loadingSheets ? (
            <SkeletonLoader type="card" count={1} />
          ) : invoiceNames && invoiceNames.length > 0 ? (
            <>
              <div className='w-full flex justify-between'>
                <div className="inline-flex items-center gap-2 bg-white shadow-sm rounded-xl p-1">
                  {invoiceNames.map((inv) => (
                    <Tooltip key={inv.id} title={`Switch to ${inv.name}`}>
                      <button
                        onClick={() => setActiveInvoiceId(inv.id)}
                        className={`cursor-pointer disabled:cursor-not-allowed rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 ${activeInvoiceId === inv.id ? 'bg-[#0b2a32] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                      >
                        {inv.name}
                      </button>
                    </Tooltip>
                  ))}
                  
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)} tooltip="Add Spreadsheet Tab">Add Sheet</Button>
                  <Button variant="secondary" size="md" onClick={() => setIsManageColsOpen(true)} tooltip="Manage Columns">Manage Columns</Button>
                </div>
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
                              <Tooltip key={sh.id} title={sh.sheetTabName}>
                                <button
                                  onClick={() => setActiveSheetId(sh.id)}
                                  className={`cursor-pointer disabled:cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${activeSheetId === sh.id ? 'bg-[#ACBFA4] text-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                  {sh.sheetTabName}<span className="ml-1 text-xs text-slate-600">{sh.id === activeSheetId ? ` (${siRecords.length})` : ''}</span>
                                </button>
                              </Tooltip>
                            ))}
                        </div>
                      </div>

                      <div>
                        {activeSheetId && columns && columns.length > 0 && (
                          <div className="hidden sm:inline-flex items-center gap-2 mr-2">
                            <select
                              value={dateCreatedSortOrder}
                              onChange={(e) => setDateCreatedSortOrder(e.target.value)}
                              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                              <option value="asc">Old Created</option>
                              <option value="desc">New Created</option>
                            </select>
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search records..."
                              className="w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                            <Button variant="primary" leftIcon={<AddCircleOutlineIcon fontSize="small" />} size="md" onClick={() => setIsGenerateRowOpen(true)}  tooltip="Create Invoice">Create Invoice</Button>
                            <Button
                              variant="secondary"
                              size="md"
                              leftIcon={<FileUploadIcon fontSize="small" />}
                              onClick={() => setIsImportOpen(true)}
                              tooltip="Import Excel or CSV"
                              className='font-semibold'
                            >
                              Import
                            </Button>
                            <div>
                              <Tooltip title="Export">
                                <div className="inline-flex">
                                  <button
                                    type="button"
                                    onClick={handleExportClick}
                                    className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100/80 hover:border-slate-400 hover:text-slate-900"
                                  >
                                    <FileUploadIcon fontSize="small" />
                                    Export
                                  </button>
                                </div>
                              </Tooltip>
                              <Menu
                                anchorEl={exportAnchorEl}
                                open={openExport}
                                onClose={handleExportClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                              >
                                <MenuItem onClick={() => { exportToExcel(); handleExportClose(); }}>Export XLSX</MenuItem>
                                <MenuItem onClick={() => { exportToCSV(); handleExportClose(); }}>Export CSV</MenuItem>
                              </Menu>
                            </div>
                        </div>
                        )}
                      </div>
                    </div>

                    {/* show table header when columns exist else show placeholder */}
                    {columns && columns.length > 0 ? (
                      <div className="border-t border-slate-200 text-left">
                        <div className="overflow-x-auto">
                          <table className="w-full border-separate border-spacing-y-0">
                            <thead>
                              <tr className="bg-slate-100 text-left text-md text-slate-600">
                                {columns.map((c) => (
                                  <th key={c.id} className="px-4 py-3 font-semibold border-x border-slate-200">
                                    <div className="flex items-center gap-2">
                                      <span>{c.columnName}</span>
                                    </div>
                                  </th>
                                ))}
                                <th className="px-4 py-2 font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {siRecords.length === 0 ? (
                                <tr>
                                  <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-slate-400">No records yet. Click "Create Invoice" to add one.</td>
                                </tr>
                              ) : (
                                paginatedRecords.map((record) => (
                                  <tr key={record.id} className="text-sm text-slate-600">
                                    {columns.map((c) => {
                                      const key = c.dbFieldName || c.columnName
                                      return (
                                        <td key={c.id} className="border-b border-slate-200 px-4 py-4">
                                          {(() => {
                                            const rawVal = record.data?.[key]
                                            if (rawVal === undefined || rawVal === null || rawVal === '') return <span className="text-slate-300">—</span>

                                            const val = String(rawVal)
                                            const lower = val.trim().toLowerCase()
                                            const isStatus = (c.dbFieldName && c.dbFieldName.toLowerCase().includes('status')) || (c.columnName && c.columnName.toLowerCase().includes('status'))

                                            if (isStatus) {
                                              let bg = 'bg-slate-100'
                                              let text = 'text-slate-700'

                                              if (lower === 'paid') {
                                                bg = 'bg-green-100'
                                                text = 'text-green-800'
                                              } else if (lower === 'active') {
                                                bg = 'bg-teal-100'
                                                text = 'text-teal-800'
                                              } else if (lower === 'unpaid') {
                                                bg = 'bg-amber-100'
                                                text = 'text-amber-800'
                                              } else if (lower === 'cancelled' || lower === 'canceled') {
                                                bg = 'bg-rose-100'
                                                text = 'text-rose-800'
                                              }

                                              return (
                                                <span className={`${bg} ${text} inline-flex items-center rounded-full px-2 py-0.5 text-sm`}>
                                                  {val}
                                                </span>
                                              )
                                            }

                                            return val
                                          })()}
                                        </td>
                                      )
                                    })}
                                    <td className="border-b border-slate-200 px-4 py-4">
                                      <div className="flex items-center gap-2 justify-end">
                                        <Tooltip title="Edit">
                                          <button className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200" onClick={() => { setEditRecordTarget(record); setIsEditRecordOpen(true) }}>
                                            <EditIcon sx={{ fontSize: 18 }} />
                                          </button>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                          <button className="rounded-md bg-slate-100 p-1.5 text-rose-600 hover:bg-rose-50" onClick={() => { setRecordDeleteTarget(record); setRecordDeleteOpen(true) }}>
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                          </button>
                                        </Tooltip>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        {siRecords.length > 0 ? (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="rounded-md border border-slate-300 px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100"
                              >
                                Previous
                              </button>
                              <span>{currentPage} of {totalPages}</span>
                              <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-md border border-slate-300 px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100"
                              >
                                Next
                              </button>
                            </div>

                            <div className="inline-flex items-center gap-2">
                              <span>Show :</span>
                              <select
                                value={rowsPerPage}
                                onChange={handleRowsPerPageChange}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                              >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                              </select>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="border-t border-slate-200 pt-6 text-center text-slate-400">
                        {/* placeholder for templates list */}
                        <ReceiptLongOutlinedIcon sx={{ fontSize: 48 }} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-semibold">No Templates Created{activeSheet ? ` for ${activeSheet.sheetTabName}` : ''}</p>
                        <p className="max-w-lg mx-auto text-sm mt-2">Get started by creating your first template to organize your data. Define custom fields and structure your information exactly the way you need it.</p>
                        {activeSheetId ? (
                          <div className='mt-4'>
                            <Button variant="primary"  size="md" onClick={() => setIsCreateColumnsOpen(true)} tooltip="Create Table Template">Create Table Template</Button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <AddSpreadsheetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                invoiceNameId={activeInvoiceId}
                onSuccess={async () => { await queryClient.invalidateQueries({ queryKey: ['invoiceNames', 'spreadsheets'] }) }}
              />
              <CreateColumnsModal
                isOpen={isCreateColumnsOpen}
                onClose={() => setIsCreateColumnsOpen(false)}
                spreadsheetId={activeSheetId}
                onSuccess={async () => { await queryClient.invalidateQueries({ queryKey: ['columns', 'spreadsheets'] }) }}
              />
              <EditColumnModal
                isOpen={isEditColumnOpen}
                onClose={() => { setIsEditColumnOpen(false); setSelectedColumn(null) }}
                initialData={selectedColumn}
                onSuccess={async () => { await queryClient.invalidateQueries({ queryKey: ['columns', activeSheetId] }); setIsEditColumnOpen(false); setSelectedColumn(null) }}
              />
              <ManageColumnsModal
                isOpen={isManageColsOpen}
                onClose={() => setIsManageColsOpen(false)}
                spreadsheetId={activeSheetId}
                spreadsheetName={activeSheet?.sheetTabName}
              />
              <GenerateRowModal
                isOpen={isGenerateRowOpen}
                onClose={() => setIsGenerateRowOpen(false)}
                spreadsheetId={activeSheetId}
                tableName={activeSheet?.sheetTabName || 'this table'}
                onSubmit={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['si-records', activeSheetId] })
                }}
              />
              <ImportRecordsModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                spreadsheetId={activeSheetId}
                sheetName={activeSheet?.sheetTabName || 'this table'}
                columns={columns}
                onSuccess={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['si-records', activeSheetId] })
                }}
              />
              <EditRecordModal
                isOpen={isEditRecordOpen}
                onClose={() => { setIsEditRecordOpen(false); setEditRecordTarget(null) }}
                record={editRecordTarget}
                spreadsheetId={activeSheetId}
                onSuccess={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['si-records', activeSheetId] })
                  setIsEditRecordOpen(false)
                  setEditRecordTarget(null)
                }}
              />
              <ConfirmModal
                isOpen={recordDeleteOpen}
                title="Delete Record"
                message="Are you sure you want to delete this record? This action cannot be undone."
                onConfirm={async () => {
                  try {
                    await deleteSiRecord(recordDeleteTarget.id)
                    await queryClient.invalidateQueries({ queryKey: ['si-records', activeSheetId] })
                  } catch (err) {
                    console.error('Failed to delete record', err)
                  } finally {
                    setRecordDeleteOpen(false)
                    setRecordDeleteTarget(null)
                  }
                }}
                onCancel={() => { setRecordDeleteOpen(false); setRecordDeleteTarget(null) }}
                confirmText="Delete"
                cancelText="Cancel"
              />
              <ConfirmModal
                isOpen={colDeleteOpen}
                title="Delete Column"
                message="Are you sure you want to delete this column? This action cannot be undone."
                onConfirm={async () => {
                  try {
                    await deleteColumn(colDeleteTarget.id)
                    await queryClient.invalidateQueries({ queryKey: ['columns', activeSheetId] })
                  } catch (err) {
                    console.error('Failed to delete column', err)
                  } finally {
                    setColDeleteOpen(false)
                    setColDeleteTarget(null)
                  }
                }}
                onCancel={() => { setColDeleteOpen(false); setColDeleteTarget(null) }}
                confirmText="Delete"
                cancelText="Cancel"
                requireConfirmationInput={true}
                confirmationPhrase={colDeleteTarget ? `Delete this column ${colDeleteTarget.columnName}` : 'delete this column'}
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
