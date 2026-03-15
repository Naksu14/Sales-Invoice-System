import React, { useEffect, useMemo, useState } from 'react'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import PaidIcon from '@mui/icons-material/Paid'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { PageLayout } from '../../components/pageLayout'
import Button from '../../components/ui/Button'
import Tooltip from '@mui/material/Tooltip'
import { useQuery } from '@tanstack/react-query'
import { getInvoiceNames } from '../../services/invoiceService'
import { getSpreadsheets } from '../../services/spreadsheetsService'
import { getSiRecordsBySheet } from '../../services/siRecordsService'

const monthlyData = [120, 68, 103, 106, 45]
const venturesData = [45, 83, 78, 50, 112]
const monthLabels = ['January', 'February', 'March', 'April', 'May']

const pieData = [
  { id: 0, value: 38, label: 'Virtual Office', color: '#316e7e' },
  { id: 1, value: 27, label: 'Meeting Rooms', color: '#ccd83e' },
  { id: 2, value: 20, label: 'Walk-in', color: '#dce3b1' },
  { id: 3, value: 15, label: 'Others', color: '#a9c0a2' },
]

export const DashboardPage = () => {
  const { data: invoiceNames = [] } = useQuery({ queryKey: ['invoiceNames'], queryFn: getInvoiceNames })
  const { data: spreadsheets = [] } = useQuery({ queryKey: ['spreadsheets'], queryFn: getSpreadsheets })

  const [activeInvoiceId, setActiveInvoiceId] = useState(null)
  const [activeSheetId, setActiveSheetId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    if (!activeInvoiceId && invoiceNames.length > 0) {
      setActiveInvoiceId(invoiceNames[0].id)
    }
  }, [activeInvoiceId, invoiceNames])

  const sheetsForActiveInvoice = useMemo(
    () => spreadsheets.filter((s) => (s.invoiceName && s.invoiceName.id === activeInvoiceId) || s.invoiceNameId === activeInvoiceId || s.invoice_name_id === activeInvoiceId),
    [activeInvoiceId, spreadsheets]
  )

  useEffect(() => {
    if (sheetsForActiveInvoice.length === 0) {
      setActiveSheetId(null)
      return
    }

    const hasCurrent = sheetsForActiveInvoice.some((s) => s.id === activeSheetId)
    if (!hasCurrent) {
      setActiveSheetId(sheetsForActiveInvoice[0].id)
    }
  }, [activeSheetId, sheetsForActiveInvoice])

  const { data: siRecords = [] } = useQuery({
    queryKey: ['si-records', activeSheetId],
    queryFn: () => getSiRecordsBySheet(activeSheetId),
    enabled: !!activeSheetId,
  })

  const toLocalDateTime = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString()
  }

  const getInputUser = (record) => {
    const data = record?.data || {}
    return (
      data.inputUser ||
      data.input_user ||
      data.createdBy ||
      data.created_by ||
      data.encoder ||
      data.user ||
      '-'
    )
  }

  const getPreview = (record) => {
    const data = record?.data || {}
    const values = Object.values(data).filter((v) => v !== undefined && v !== null && `${v}`.trim() !== '')
    if (values.length === 0) return '-'
    return values.slice(0, 2).join(' | ')
  }

  const recentRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    const filtered = siRecords.filter((r) => {
      if (!q) return true
      const blob = [
        r.id,
        r.createdAt,
        r.created_at,
        getInputUser(r),
        ...Object.values(r.data || {}),
      ]
        .filter((v) => v !== undefined && v !== null)
        .join(' ')
        .toLowerCase()

      return blob.includes(q)
    })

    return [...filtered]
      .sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime())
  }, [searchTerm, siRecords])

  const totalPages = Math.max(1, Math.ceil(recentRecords.length / rowsPerPage))
  const paginatedRecentRecords = recentRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeInvoiceId, activeSheetId, searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  return (
    <PageLayout>
      <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-700">DASHBOARD</h1>
              <p className="mt-1 text-lg text-slate-500">Financial overview and analytics</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Tooltip title="Export current table as CSV">
                <button
                  type="button"
                  className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100/80 hover:border-slate-400 hover:text-slate-900"
                >
                  <FileUploadIcon fontSize="small" />
                  Export
                </button>
              </Tooltip>
              <Button leftIcon={<NoteAddIcon fontSize="small" />} tooltip="Create a new invoice">
                Create Invoice
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-md bg-[#315266] p-4 text-[#e8ec97] shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold leading-tight">Total Sales</p>
                    <div className="rounded-md bg-white/15 p-2 text-xl text-white">
                      ₱
                    </div>
                  </div>
                  <p className="mt-4 text-5xl font-bold text-[#e7e98a]">25,000</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-200">
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    12% More than yesterday
                  </p>
                </div>

                <div className="rounded-md bg-[#d5e25a] p-4 text-[#202320] shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold leading-tight">Receipts This Month</p>
                    <div className="rounded-md bg-black/10 p-2 text-[#222625]">
                      <ReceiptLongIcon fontSize="small" />
                    </div>
                  </div>
                  <p className="mt-4 text-5xl font-bold">58</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-700">
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    12% More than yesterday
                  </p>
                </div>

                <div className="rounded-md bg-[#0b2a32] p-4 text-[#d7e47a] shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold leading-tight">Total Receipts Acknowledged</p>
                    <div className="rounded-md bg-white/15 p-2 text-[#d7e47a]">
                      <TaskAltIcon fontSize="small" />
                    </div>
                  </div>
                  <p className="mt-4 text-5xl font-bold">22</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-300">
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    12% More than yesterday
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">REVENUE OVERVIEW</h2>
                  <select className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600">
                    <option>Month</option>
                    <option>Quarter</option>
                  </select>
                </div>

                <BarChart
                  height={260}
                  series={[
                    { data: monthlyData, label: 'Shirefolk Incorporation', color: '#cedf50', borderRadius: 8 },
                    { data: venturesData, label: 'Shirefolk Ventures', color: '#0b2a32', borderRadius: 8 },
                  ]}
                  xAxis={[{ data: monthLabels, scaleType: 'band' }]}
                  margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
                  grid={{ horizontal: true }}
                />
              </div>

              <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">RECENT SERVICE INVOICES</h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={activeInvoiceId || ''}
                      onChange={(e) => setActiveInvoiceId(Number(e.target.value))}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600"
                    >
                      {invoiceNames.length === 0 ? <option value="">No Invoice Names</option> : null}
                      {invoiceNames.map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.name}</option>
                      ))}
                    </select>
                    <select
                      value={activeSheetId || ''}
                      onChange={(e) => setActiveSheetId(Number(e.target.value))}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600"
                    >
                      {sheetsForActiveInvoice.length === 0 ? <option value="">No Tabs</option> : null}
                      {sheetsForActiveInvoice.map((sheet) => (
                        <option key={sheet.id} value={sheet.id}>{sheet.sheetTabName}</option>
                      ))}
                    </select>
                    <div className="flex items-center rounded-md border border-slate-300 bg-white px-2 py-1.5">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search"
                        className="w-32 border-0 bg-transparent text-sm outline-none"
                      />
                      <SearchIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-0">
                    <thead>
                      <tr className="bg-slate-100 text-left text-sm text-slate-600">
                        <th className="rounded-l-md px-4 py-2 font-semibold">Record ID</th>
                        <th className="px-4 py-2 font-semibold">Date Created</th>
                        <th className="px-4 py-2 font-semibold">Input User</th>
                        <th className="px-4 py-2 font-semibold">Tab Name</th>
                        <th className="px-4 py-2 font-semibold">Preview</th>
                        <th className="rounded-r-md px-4 py-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border-b border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                            No recent SI records found for this filter.
                          </td>
                        </tr>
                      ) : paginatedRecentRecords.map((record) => (
                        <tr key={record.id} className="text-sm text-slate-600">
                          <td className="border-b border-slate-200 px-4 py-4">{record.id}</td>
                          <td className="border-b border-slate-200 px-4 py-4">{toLocalDateTime(record.createdAt || record.created_at)}</td>
                          <td className="border-b border-slate-200 px-4 py-4">{getInputUser(record)}</td>
                          <td className="border-b border-slate-200 px-4 py-4">{record.spreadsheet?.sheetTabName || sheetsForActiveInvoice.find((s) => s.id === activeSheetId)?.sheetTabName || '-'}</td>
                          <td className="border-b border-slate-200 px-4 py-4 max-w-[260px] truncate" title={getPreview(record)}>{getPreview(record)}</td>
                          <td className="border-b border-slate-200 px-4 py-4">
                            <Tooltip title="View Invoice Details">
                            <button
                              type="button"
                              className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                              onClick={() => console.log('viewRecord', record.id)}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </button>
                            </Tooltip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {recentRecords.length > 0 ? (
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
            </div>

            <div className="rounded-md border min-h-[300px] border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="text-center text-sm font-bold text-slate-600">REVENUE BY SERVICE TYPE</h2>
              <div className="mt-2 flex justify-center">
                <PieChart
                  height={390}
                  series={[
                    {
                      data: pieData,
                      innerRadius: 40,
                      outerRadius: 70,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  slotProps={{ legend: { hidden: true } }}
                />
              </div>

              <div className="rounded-md border border-slate-300 px-2 py-1 text-center text-xs text-slate-600">
                Shirefolk Ventures
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                {pieData.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    </PageLayout>
  )
}
