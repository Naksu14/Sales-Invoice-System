import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import PaidIcon from '@mui/icons-material/Paid'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { pdf } from '@react-pdf/renderer'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { PageLayout } from '../../components/pageLayout'
import Button from '../../components/ui/Button'
import Tooltip from '@mui/material/Tooltip'
import { useQuery } from '@tanstack/react-query'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { PageLoadingError } from '../../components/ui/PageLoadingError'
import { getInvoiceNames } from '../../services/invoiceService'
import { getSpreadsheets } from '../../services/spreadsheetsService'
import { getSiRecordsBySheet } from '../../services/siRecordsService'
import { getColumns } from '../../services/columnTableService'
import { useNavigate } from 'react-router-dom'
import DashboardAnalyticsPdfDocument from './DashboardAnalyticsPdfDocument'

const EMPTY_ARRAY = []

const parseCurrencyAmount = (value) => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const normalized = String(value).replace(/[^\d.-]/g, '')
  if (!normalized) return 0

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value || 0)

const normalizeFieldName = (value) => value.toString().toLowerCase().replace(/[^a-z0-9]/g, '')

const parseDateInputLocal = (dateString) => {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const getDateFromRecord = (record, preferredDateKeys = []) => {
  const data = record?.data || {}

  for (const key of preferredDateKeys) {
    const value = data?.[key]
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) return date
    }
  }

  const fallbackKeys = Object.keys(data).filter((key) => normalizeFieldName(key).includes('date'))
  for (const key of fallbackKeys) {
    const value = data?.[key]
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) return date
    }
  }

  const createdAt = new Date(record?.createdAt || record?.created_at || 0)
  return Number.isNaN(createdAt.getTime()) ? null : createdAt
}

const getAmountFromRecord = (record, preferredAmountKeys = []) => {
  const data = record?.data || {}

  for (const key of preferredAmountKeys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return parseCurrencyAmount(data[key])
    }
  }

  const candidateEntries = Object.entries(data).filter(([key]) => {
    const normalized = normalizeFieldName(key)
    return normalized === 'oramount' || normalized === 'aramount'
  })

  if (candidateEntries.length > 0) {
    return parseCurrencyAmount(candidateEntries[0][1])
  }

  return 0
}

export const DashboardPage = () => {
  const { data: invoiceNames = EMPTY_ARRAY, isLoading: loadingInvoices, error: invoicesError } = useQuery({ queryKey: ['invoiceNames'], queryFn: getInvoiceNames })
  const { data: spreadsheets = EMPTY_ARRAY, isLoading: loadingSheets, error: sheetsError } = useQuery({ queryKey: ['spreadsheets'], queryFn: getSpreadsheets })

  const navigate = useNavigate()

  const [activeInvoiceId, setActiveInvoiceId] = useState(null)
  const [activeSheetId, setActiveSheetId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [serviceChartData, setServiceChartData] = useState([])
  const [serviceLoading, setServiceLoading] = useState(false)
  const [revenueMonthLabels, setRevenueMonthLabels] = useState([])
  const [revenueSeries, setRevenueSeries] = useState([])
  const [totalSalesAmount, setTotalSalesAmount] = useState(0)
  const [salesTodayAmount, setSalesTodayAmount] = useState(0)
  const [salesYesterdayAmount, setSalesYesterdayAmount] = useState(0)
  const [siThisMonthCount, setSiThisMonthCount] = useState(0)
  const [siTodayCount, setSiTodayCount] = useState(0)
  const [siYesterdayCount, setSiYesterdayCount] = useState(0)
  const [arTotalCount, setArTotalCount] = useState(0)
  const [arTodayCount, setArTodayCount] = useState(0)
  const [arYesterdayCount, setArYesterdayCount] = useState(0)
  const [viewRecordTarget, setViewRecordTarget] = useState(null)
  const [isColumnGuideOpen, setIsColumnGuideOpen] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [isExportDateFilterOpen, setIsExportDateFilterOpen] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [pendingExportFormat, setPendingExportFormat] = useState(null)
  const [dateValidationError, setDateValidationError] = useState('')
  const sheetsForActiveInvoice = useMemo(
    () => (activeInvoiceId == null
      ? spreadsheets
      : spreadsheets.filter((s) => (s.invoiceName && s.invoiceName.id === activeInvoiceId) || s.invoiceNameId === activeInvoiceId || s.invoice_name_id === activeInvoiceId)),
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

  useEffect(() => {
    let mounted = true
    const loadSiArCounts = async () => {
      const sheets = activeInvoiceId == null
        ? spreadsheets
        : spreadsheets.filter((s) => (s.invoiceName && s.invoiceName.id === activeInvoiceId) || s.invoiceNameId === activeInvoiceId || s.invoice_name_id === activeInvoiceId)
      if (!sheets || sheets.length === 0) {
        if (mounted) {
          setTotalSalesAmount(0)
          setSalesTodayAmount(0)
          setSalesYesterdayAmount(0)
          setSiThisMonthCount(0)
          setSiTodayCount(0)
          setSiYesterdayCount(0)
          setArTotalCount(0)
          setArTodayCount(0)
          setArYesterdayCount(0)
        }
        return
      }

      const siSheets = sheets.filter(s => (s.sheetTabName || '').toString().toLowerCase() === 'si')
      const arSheets = sheets.filter(s => (s.sheetTabName || '').toString().toLowerCase() === 'ar')

      const getPreferredAmountKey = (sheet, columns) => {
        const dbFieldNames = (columns || []).map((column) => (column.dbFieldName || column.db_field_name || '').toString().toLowerCase())
        const sheetTabName = (sheet.sheetTabName || '').toString().toLowerCase()

        if (sheetTabName === 'or' && dbFieldNames.includes('or_amount')) return 'or_amount'
        if (sheetTabName === 'ar' && dbFieldNames.includes('ar_amount')) return 'ar_amount'
        if (dbFieldNames.includes('or_amount')) return 'or_amount'
        if (dbFieldNames.includes('ar_amount')) return 'ar_amount'
        return null
      }

      const sumAmountsForDate = (records, amountKey, year, month, day) => records.reduce((sum, record) => {
        const createdAt = new Date(record.createdAt || record.created_at || 0)
        if (
          createdAt.getFullYear() !== year ||
          createdAt.getMonth() !== month ||
          createdAt.getDate() !== day
        ) {
          return sum
        }

        return sum + parseCurrencyAmount(record?.data?.[amountKey])
      }, 0)

      const sumAllAmounts = (records, amountKey) => records.reduce(
        (sum, record) => sum + parseCurrencyAmount(record?.data?.[amountKey]),
        0,
      )

      const fetchFor = async (sheetList) => {
        const promises = sheetList.map(sh => getSiRecordsBySheet(sh.id).catch(() => []))
        const results = await Promise.all(promises)
        return results.flat()
      }

      try {
        const [siRecordsAll, arRecordsAll] = await Promise.all([fetchFor(siSheets), fetchFor(arSheets)])

        const now = new Date()
        const todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate()
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        const yY = yesterday.getFullYear(), yM = yesterday.getMonth(), yD = yesterday.getDate()

        const sheetSales = await Promise.all(
          sheets.map(async (sheet) => {
            const [columns, records] = await Promise.all([
              getColumns(sheet.id).catch(() => []),
              getSiRecordsBySheet(sheet.id).catch(() => []),
            ])
            const amountKey = getPreferredAmountKey(sheet, columns)

            if (!amountKey) {
              return { total: 0, today: 0, yesterday: 0 }
            }

            return {
              total: sumAllAmounts(records, amountKey),
              today: sumAmountsForDate(records, amountKey, todayY, todayM, todayD),
              yesterday: sumAmountsForDate(records, amountKey, yY, yM, yD),
            }
          }),
        )

        const totalSales = sheetSales.reduce((sum, sheet) => sum + sheet.total, 0)
        const totalSalesToday = sheetSales.reduce((sum, sheet) => sum + sheet.today, 0)
        const totalSalesYesterday = sheetSales.reduce((sum, sheet) => sum + sheet.yesterday, 0)

        // SI: count records in current month
        const siThisMonth = siRecordsAll.filter(r => {
          const d = new Date(r.createdAt || r.created_at || 0)
          return d.getFullYear() === todayY && d.getMonth() === todayM
        }).length

        const siToday = siRecordsAll.filter(r => {
          const d = new Date(r.createdAt || r.created_at || 0)
          return d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD
        }).length

        const siYesterday = siRecordsAll.filter(r => {
          const d = new Date(r.createdAt || r.created_at || 0)
          return d.getFullYear() === yY && d.getMonth() === yM && d.getDate() === yD
        }).length

        // AR: total count and today/yesterday
        const arTotal = arRecordsAll.length
        const arToday = arRecordsAll.filter(r => {
          const d = new Date(r.createdAt || r.created_at || 0)
          return d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD
        }).length
        const arYesterday = arRecordsAll.filter(r => {
          const d = new Date(r.createdAt || r.created_at || 0)
          return d.getFullYear() === yY && d.getMonth() === yM && d.getDate() === yD
        }).length

        if (mounted) {
          setTotalSalesAmount(totalSales)
          setSalesTodayAmount(totalSalesToday)
          setSalesYesterdayAmount(totalSalesYesterday)
          setSiThisMonthCount(siThisMonth)
          setSiTodayCount(siToday)
          setSiYesterdayCount(siYesterday)
          setArTotalCount(arTotal)
          setArTodayCount(arToday)
          setArYesterdayCount(arYesterday)
        }
      } catch (err) {
        if (mounted) {
          setTotalSalesAmount(0)
          setSalesTodayAmount(0)
          setSalesYesterdayAmount(0)
          setSiThisMonthCount(0)
          setSiTodayCount(0)
          setSiYesterdayCount(0)
          setArTotalCount(0)
          setArTodayCount(0)
          setArYesterdayCount(0)
        }
      }
    }

    loadSiArCounts()
    return () => { mounted = false }
  }, [activeInvoiceId, spreadsheets])

  useEffect(() => {
    let mounted = true
    const loadServiceTypes = async () => {
      const sheets = activeInvoiceId == null
        ? spreadsheets
        : spreadsheets.filter((s) => (s.invoiceName && s.invoiceName.id === activeInvoiceId) || s.invoiceNameId === activeInvoiceId || s.invoice_name_id === activeInvoiceId)
      if (!sheets || sheets.length === 0) {
        if (mounted) {
          setServiceChartData((prev) => (prev.length === 0 ? prev : []))
        }
        return
      }

      setServiceLoading(true)
      try {
        const promises = sheets.map((sh) => getSiRecordsBySheet(sh.id).catch(() => []))
        const results = await Promise.all(promises)
        const allRecords = results.flat()

        const counts = {}
        const unknowns = []
        const inferred = []
        // labelMap left empty — inference from a static list removed
        const labelMap = {}

        // count ONLY explicit type_of_service fields; do NOT include inferred values in counts
        allRecords.forEach((rec) => {
          const data = rec?.data || {}
          const svcRaw = data.type_of_service || data.typeOfService || data.service_type || data.serviceType || ''
          const svc = svcRaw.toString().trim()

          if (svc) {
            counts[svc] = (counts[svc] || 0) + 1
          } else {
            // try to infer from description/invoice text for debugging, but don't count it
            const desc = (data.description || data.desc || data.details || data.invoice || '').toString().toLowerCase()
            let inferredValue = ''
            for (const key of Object.keys(labelMap)) {
              if (desc.includes(key)) {
                inferredValue = labelMap[key]
                break
              }
            }

            if (inferredValue) {
              inferred.push({ id: rec?.id, inferredValue, data })
            } else {
              unknowns.push({ id: rec?.id, data })
            }
          }
        })

        const colors = ['#316e7e', '#ccd83e', '#dce3b1', '#a9c0a2', '#f59e0b', '#ef4444', '#7c3aed', '#06b6d4']
        const chartArr = Object.keys(counts).map((k, idx) => ({ id: idx, value: counts[k], label: k, color: colors[idx % colors.length] }))

        // avoid unnecessary state updates that can cause re-renders
        if (mounted) {
          setServiceChartData((prev) => {
            const same = JSON.stringify(chartArr) === JSON.stringify(prev)
            return same ? prev : chartArr
          })
        }
      } catch (err) {
        if (mounted) setServiceChartData([])
      } finally {
        if (mounted) setServiceLoading(false)
      }
    }

    loadServiceTypes()
    return () => { mounted = false }
  }, [activeInvoiceId, spreadsheets])

  useEffect(() => {
    let mounted = true

    const loadMonthlyRevenue = async () => {
      const sheets = activeInvoiceId == null
        ? spreadsheets
        : spreadsheets.filter((s) => (s.invoiceName && s.invoiceName.id === activeInvoiceId) || s.invoiceNameId === activeInvoiceId || s.invoice_name_id === activeInvoiceId)

      if (!sheets || sheets.length === 0) {
        if (mounted) {
          setRevenueMonthLabels([])
          setRevenueSeries([])
        }
        return
      }

      try {
        const allMonthKeys = new Set()
        const invoiceMonthTotals = new Map()
        const invoicePalette = ['#315266', '#cedf50', '#0b2a32', '#7a8a2a', '#4b7a86', '#93a83b', '#2f4f56', '#b7c94a']

        const getInvoiceNameBySheet = (sheet) => {
          if (sheet?.invoiceName?.name) return sheet.invoiceName.name
          const directInvoiceId = sheet?.invoiceNameId ?? sheet?.invoice_name_id ?? sheet?.invoiceName?.id
          const matched = invoiceNames.find((inv) => inv.id === directInvoiceId)
          return matched?.name || 'Uncategorized Invoice'
        }

        await Promise.all(
          sheets.map(async (sheet) => {
            const [columns, records] = await Promise.all([
              getColumns(sheet.id).catch(() => []),
              getSiRecordsBySheet(sheet.id).catch(() => []),
            ])

            const invoiceName = getInvoiceNameBySheet(sheet)
            if (!invoiceMonthTotals.has(invoiceName)) {
              invoiceMonthTotals.set(invoiceName, new Map())
            }
            const invoiceMap = invoiceMonthTotals.get(invoiceName)

            const dateColumn = (columns || []).find((col) => {
              const dbField = normalizeFieldName(col.dbFieldName || col.db_field_name || '')
              const sheetField = normalizeFieldName(col.sheetColumnName || col.sheet_column_name || col.sheetHeader || '')
              return dbField === 'date' || sheetField === 'date'
            })

            const preferredDateKeys = [
              dateColumn?.dbFieldName,
              dateColumn?.db_field_name,
              dateColumn?.sheetColumnName,
              dateColumn?.sheet_column_name,
              'date',
            ].filter(Boolean)

            const amountColumns = (columns || []).filter((col) => {
              const dbField = normalizeFieldName(col.dbFieldName || col.db_field_name || '')
              const sheetField = normalizeFieldName(col.sheetColumnName || col.sheet_column_name || col.sheetHeader || '')
              return dbField === 'oramount' || dbField === 'aramount' || sheetField === 'oramount' || sheetField === 'aramount'
            })

            const preferredAmountKeys = [
              ...amountColumns.flatMap((col) => [
                col.dbFieldName,
                col.db_field_name,
                col.sheetColumnName,
                col.sheet_column_name,
              ]),
              'or_amount',
              'ar_amount',
              'orAmount',
              'arAmount',
              'OR Amount',
              'AR Amount',
            ].filter(Boolean)

            records.forEach((record) => {
              const date = getDateFromRecord(record, preferredDateKeys)
              if (!date) return

              const amount = getAmountFromRecord(record, preferredAmountKeys)
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              allMonthKeys.add(monthKey)
              invoiceMap.set(monthKey, (invoiceMap.get(monthKey) || 0) + amount)
            })
          }),
        )

        const sortedMonthKeys = [...allMonthKeys].sort((a, b) => {
          const aDate = new Date(`${a}-01T00:00:00`)
          const bDate = new Date(`${b}-01T00:00:00`)
          return aDate.getTime() - bDate.getTime()
        })

        const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })
        const labels = sortedMonthKeys.map((key) => {
          const [year, month] = key.split('-')
          return monthFormatter.format(new Date(Number(year), Number(month) - 1, 1))
        })

        const series = [...invoiceMonthTotals.entries()].map(([invoiceName, monthTotals], idx) => ({
          label: invoiceName,
          data: sortedMonthKeys.map((monthKey) => Number((monthTotals.get(monthKey) || 0).toFixed(2))),
          color: invoicePalette[idx % invoicePalette.length],
          borderRadius: 8,
          valueFormatter: (value) => formatCurrency(value),
        }))

        if (mounted) {
          setRevenueMonthLabels(labels)
          setRevenueSeries(series)
        }
      } catch (error) {
        if (mounted) {
          setRevenueMonthLabels([])
          setRevenueSeries([])
        }
      }
    }

    loadMonthlyRevenue()
    return () => { mounted = false }
  }, [activeInvoiceId, spreadsheets, invoiceNames])

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

    if (record?.inputUser) {
      // prefer relation returned by backend
      return record.inputUser.full_name || record.inputUser.user_id || '-'
    }

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

  const openViewRecordModal = (record) => {
    setViewRecordTarget(record)
  }

  const closeViewRecordModal = () => {
    setViewRecordTarget(null)
  }

  const viewRecordEntries = Object.entries(viewRecordTarget?.data || {})

  const buildExportData = (startDate = null, endDate = null) => {
    const hasDateFilter = !!(startDate || endDate)

    // Filter recent records table by selected date range (does not affect
    // the main dashboard summary/graphs so exported metrics stay aligned
    // with what is shown on the dashboard cards and charts).
    let filteredRecords = recentRecords
    if (hasDateFilter) {
      const startBoundary = startDate ? (parseDateInputLocal(startDate)?.getTime() ?? 0) : 0
      const endBoundary = endDate
        ? (parseDateInputLocal(endDate)?.getTime() ?? Infinity) + 86400000 - 1
        : Infinity

      filteredRecords = recentRecords.filter((record) => {
        const recordDate = new Date(record.createdAt || record.created_at || 0).getTime()
        return recordDate >= startBoundary && recordDate <= endBoundary
      })
    }

    const summaryRows = [
      { metric: 'Total Sales', rawValue: totalSalesAmount, value: formatCurrency(totalSalesAmount) },
      { metric: 'Sales Today', rawValue: salesTodayAmount, value: formatCurrency(salesTodayAmount) },
      { metric: 'Sales Yesterday', rawValue: salesYesterdayAmount, value: formatCurrency(salesYesterdayAmount) },
      { metric: 'Receipts This Month', rawValue: siThisMonthCount, value: String(siThisMonthCount) },
      { metric: 'Receipts Today', rawValue: siTodayCount, value: String(siTodayCount) },
      { metric: 'Receipts Yesterday', rawValue: siYesterdayCount, value: String(siYesterdayCount) },
      { metric: 'Acknowledged Receipts Total', rawValue: arTotalCount, value: String(arTotalCount) },
      { metric: 'Acknowledged Receipts Today', rawValue: arTodayCount, value: String(arTodayCount) },
      { metric: 'Acknowledged Receipts Yesterday', rawValue: arYesterdayCount, value: String(arYesterdayCount) },
    ]

    const monthlyRows = revenueMonthLabels.map((month, index) => {
      const invoiceValues = revenueSeries.reduce((acc, series) => {
        acc[series.label] = series.data[index] || 0
        return acc
      }, {})

      const total = Object.values(invoiceValues).reduce((sum, value) => sum + Number(value || 0), 0)
      return {
        month,
        ...invoiceValues,
        totalRevenueRaw: Number(total.toFixed(2)),
        totalRevenue: formatCurrency(total),
      }
    })

    const serviceRows = (serviceChartData.length > 0 ? serviceChartData : []).map((item) => ({
      serviceType: item.label,
      count: Number(item.value || 0),
      color: item.color,
    }))

    const recentRows = filteredRecords.map((record) => ({
      recordId: record.id,
      dateCreated: toLocalDateTime(record.createdAt || record.created_at),
      inputUser: getInputUser(record),
      tabName: record.spreadsheet?.sheetTabName || sheetsForActiveInvoice.find((s) => s.id === activeSheetId)?.sheetTabName || '-',
      preview: getPreview(record),
    }))

    return { summaryRows, monthlyRows, serviceRows, recentRows }
  }

  const getExportTimestamp = () => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    return `${yyyy}${mm}${dd}-${hh}${min}`
  }

  const handleExportExcel = () => {
    setPendingExportFormat('excel')
    setIsExportMenuOpen(false)
    setIsExportDateFilterOpen(true)
  }

  const handleExportPdfClick = () => {
    setPendingExportFormat('pdf')
    setIsExportMenuOpen(false)
    setIsExportDateFilterOpen(true)
  }

  const validateDateRange = (startDate, endDate) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Helper to parse date string in local timezone (not UTC)
    const parseLocalDate = (dateString) => parseDateInputLocal(dateString)

    // Check if start date is in the future
    if (startDate) {
      const start = parseLocalDate(startDate)
      if (start > today) {
        setDateValidationError('Start date cannot be in the future')
        return false
      }
    }

    // Check if end date is in the future
    if (endDate) {
      const end = parseLocalDate(endDate)
      if (end > today) {
        setDateValidationError('End date cannot be in the future')
        return false
      }
    }

    // Check if end date and start date relationship
    if (startDate && endDate) {
      const start = parseLocalDate(startDate)
      const end = parseLocalDate(endDate)
      if (end < start) {
        setDateValidationError('End date must be on or after start date')
        return false
      }
    }

    setDateValidationError('')
    return true
  }

  const proceedWithExport = async () => {
    if (pendingExportFormat === 'excel') {
      try {
        setIsExportingExcel(true)
        const { summaryRows, monthlyRows, serviceRows, recentRows } = buildExportData(filterStartDate, filterEndDate)

        const workbook = XLSX.utils.book_new()

        const summarySheet = XLSX.utils.aoa_to_sheet([
          ['Metric', 'Value'],
          ...summaryRows.map((row) => [row.metric, row.rawValue]),
        ])

        const monthlySheetRows = [
          ['Month', 'Total Revenue'],
          ...monthlyRows.map((row) => [row.month, row.totalRevenueRaw]),
        ]
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlySheetRows)

        const serviceSheet = XLSX.utils.aoa_to_sheet([
          ['Service Type', 'Count'],
          ...serviceRows.map((row) => [row.serviceType, row.count]),
        ])

        const recordsSheet = XLSX.utils.aoa_to_sheet([
          ['Record ID', 'Date Created', 'Input User', 'Tab Name', 'Preview'],
          ...recentRows.map((row) => [row.recordId, row.dateCreated, row.inputUser, row.tabName, row.preview]),
        ])

        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Revenue')
        XLSX.utils.book_append_sheet(workbook, serviceSheet, 'Service Types')
        XLSX.utils.book_append_sheet(workbook, recordsSheet, 'Recent Records')

        const file = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        saveAs(
          new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          `dashboard-analytics-${getExportTimestamp()}.xlsx`,
        )
      } catch (error) {
        console.error('Failed to export Excel analytics report', error)
      } finally {
        setIsExportingExcel(false)
        setIsExportDateFilterOpen(false)
        setFilterStartDate('')
        setFilterEndDate('')
        setPendingExportFormat(null)
      }
    } else if (pendingExportFormat === 'pdf') {
      try {
        setIsExportingPdf(true)
        const { summaryRows, monthlyRows, serviceRows, recentRows } = buildExportData(filterStartDate, filterEndDate)
        const generatedAt = new Date().toLocaleString()

        const blob = await pdf(
          <DashboardAnalyticsPdfDocument
            generatedAt={generatedAt}
            summaryRows={summaryRows}
            monthlyRows={monthlyRows}
            serviceRows={serviceRows}
            recentRows={recentRows}
          />,
        ).toBlob()

        saveAs(blob, `dashboard-analytics-${getExportTimestamp()}.pdf`)
      } catch (error) {
        console.error('Failed to export PDF analytics report', error)
      } finally {
        setIsExportingPdf(false)
        setIsExportDateFilterOpen(false)
        setFilterStartDate('')
        setFilterEndDate('')
        setPendingExportFormat(null)
      }
    }
  }

  const handleExportPdfDeprecated = () => {
    // This function is deprecated - use proceedWithExport instead
  }

  return (
    <PageLayout>
      <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-700">DASHBOARD</h1>
              <p className="mt-1 text-lg text-slate-500">Financial overview and analytics</p>
            </div>
            {loadingInvoices || loadingSheets ? (
              <div className="h-10 w-32 bg-slate-200 rounded-md animate-pulse" />
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
              <select
                value={activeInvoiceId || ''}
                onChange={(e) => setActiveInvoiceId(e.target.value === '' ? null : Number(e.target.value))}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600"
                aria-label="Filter by invoice name"
              >
                <option value="">All Invoices</option>
                {invoiceNames.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.name}</option>
                ))}
              </select>
              <div className="relative">
                <Tooltip title="Export dashboard analytics">
                  <button
                    type="button"
                    onClick={() => setIsExportMenuOpen((prev) => !prev)}
                    disabled={isExportingExcel || isExportingPdf}
                    className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100/80 hover:border-slate-400 hover:text-slate-900"
                  >
                    <FileUploadIcon fontSize="small" />
                    {isExportingExcel ? 'Exporting Excel...' : isExportingPdf ? 'Exporting PDF...' : 'Export'}
                    <ExpandMoreIcon sx={{ fontSize: 18 }} />
                  </button>
                </Tooltip>

                {isExportMenuOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Export as Excel
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdfClick}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Export as PDF
                    </button>
                  </div>
                ) : null}
              </div>
              <Button leftIcon={<NoteAddIcon fontSize="small" />} tooltip="Create a new invoice" onClick={() => navigate('/sales-invoice')}>
                Create Invoice
              </Button>
            </div>
          )}
          </div>

          {(invoicesError || sheetsError) && (
            <PageLoadingError 
              error="Failed to load dashboard data. Please check your connection and try again."
            />
          )}

          {loadingInvoices || loadingSheets ? (
            <div className="space-y-4">
              <SkeletonLoader type="grid" count={3} />
            </div>
          ) : (
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
                  <p className="mt-4 text-5xl font-bold text-[#e7e98a]">{formatCurrency(totalSalesAmount)}</p>
                </div>

                <div className="rounded-md bg-[#d5e25a] p-4 text-[#202320] shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold leading-tight">Receipts This Month</p>
                    <div className="rounded-md bg-black/10 p-2 text-[#222625]">
                      <ReceiptLongIcon fontSize="small" />
                    </div>
                  </div>
                  <p className="mt-4 text-5xl font-bold">{siThisMonthCount}</p>
                  <p className="mt-3 text-sm text-slate-700">
                    Today: <span className="font-semibold">{siTodayCount}</span>
                    <span className="mx-2">·</span>
                    {(() => {
                      const diff = siTodayCount - siYesterdayCount
                      if (diff > 0) return (<>
                        
                        <span className="text-emerald-400"><TrendingUpIcon sx={{ fontSize: 14 }} /> {diff} more than yesterday</span>
                      </>)
                      if (diff < 0) return (<>
                        
                        <span className="text-rose-400"><TrendingDownIcon sx={{ fontSize: 14 }} /> {Math.abs(diff)} less than yesterday</span>
                      </>)
                      return <span className="text-slate-400">No change vs yesterday</span>
                    })()}
                  </p>
                </div>

                <div className="rounded-md bg-[#0b2a32] p-4 text-[#d7e47a] shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold leading-tight">Total Receipts Acknowledged</p>
                    <div className="rounded-md bg-white/15 p-2 text-[#d7e47a]">
                      <TaskAltIcon fontSize="small" />
                    </div>
                  </div>
                  <p className="mt-4 text-5xl font-bold">{arTotalCount}</p>
                  <p className="mt-3 text-sm text-slate-300">
                    Today: <span className="font-semibold">{arTodayCount}</span>
                    <span className="mx-2">·</span>
                    {(() => {
                      const diff = arTodayCount - arYesterdayCount
                      if (diff > 0) return (<>
                        
                        <span className="text-emerald-300"><TrendingUpIcon sx={{ fontSize: 14 }} /> {diff} more than yesterday</span>
                      </>)
                      if (diff < 0) return (<>
                        
                        <span className="text-rose-300"><TrendingDownIcon sx={{ fontSize: 14 }} /> {Math.abs(diff)} less than yesterday</span>
                      </>)
                      return <span className="text-slate-300">No change vs yesterday</span>
                    })()}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">REVENUE OVERVIEW</h2>
                </div>

                <BarChart
                  height={260}
                  series={revenueSeries}
                  xAxis={[{ data: revenueMonthLabels, scaleType: 'band' }]}
                  yAxis={[{ valueFormatter: (value) => formatCurrency(value) }]}
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
                      onChange={(e) => setActiveInvoiceId(e.target.value === '' ? null : Number(e.target.value))}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600"
                    >
                      <option value="">All Invoices</option>
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
                              onClick={() => openViewRecordModal(record)}
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

            <div className="">
              <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                <h2 className="text-center text-sm font-bold text-slate-600 uppercase">Most Availed Services</h2>
              <div className="mt-2 flex justify-center">
                <PieChart
                  height={390}
                  series={[
                    {
                      data: serviceChartData,
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
                <select
                  value={activeInvoiceId || ''}
                  onChange={(e) => setActiveInvoiceId(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-transparent border-0 text-xs text-slate-600 text-center outline-none"
                >
                  <option value="">All Invoices</option>
                  {invoiceNames.map((inv) => (
                    <option key={inv.id} value={inv.id}>{inv.name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                {serviceChartData.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
                </div>
              
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsColumnGuideOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-[#315266] bg-[#315266] p-4 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#243f4f]"
                  aria-label="Open dashboard data setup guide"
                  title="Open Dashboard Data Setup Guide"
                >
                  Open Dashboard Data Setup Guide
                </button>
              </div>
            </div>
          </div>
          )}

      {isColumnGuideOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Dashboard Revenue Graph Column Guide</h3>
                    <p className="mt-1 text-sm text-slate-500">Use these exact column names so monthly revenue analytics can compute correctly.</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    className="rounded-md  text-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    onClick={() => setIsColumnGuideOpen(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  <p>
                    Required fields for revenue chart processing:
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li><span className="font-semibold">date</span> (or a Date column mapped to the record data)</li>
                    <li><span className="font-semibold">or_amount</span> and/or <span className="font-semibold">ar_amount</span></li>
                    <li><span className="font-semibold">type_of_services</span> for service-type analytics</li>
                    <li><span className="font-semibold">status</span> (recommended values: <span className="font-semibold">Active</span>, <span className="font-semibold">Paid</span>, <span className="font-semibold">Unpaid</span>, <span className="font-semibold">Cancelled</span>)</li>
                  </ul>

                  <p>
                    The dashboard groups records by month-year from <span className="font-semibold">date</span> and sums values from <span className="font-semibold">or_amount</span> or <span className="font-semibold">ar_amount</span>.
                  </p>
                  <p>
                    Keep <span className="font-semibold">status</span> consistent to support cancelled-transaction reporting and filtering.
                  </p>
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                    Make sure column names are consistent across sheets to avoid missing or incorrect bargraph/piecharts totals.
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="secondary" size="md" onClick={() => setIsColumnGuideOpen(false)}>Close</Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {isExportDateFilterOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Filter Report by Date Range</h3>
                  <button
                    type="button"
                    className="text-slate-500 text-3xl hover:text-slate-800"
                    onClick={() => {
                      setIsExportDateFilterOpen(false)
                      setFilterStartDate('')
                      setFilterEndDate('')
                      setPendingExportFormat(null)
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium text-slate-700">Start Date</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => {
                        setFilterStartDate(e.target.value)
                        validateDateRange(e.target.value, filterEndDate)
                      }}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium text-slate-700">End Date</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value)
                        validateDateRange(filterStartDate, e.target.value)
                      }}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>

                  {dateValidationError && (
                    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{dateValidationError}</p>
                  )}

                  <p className="text-xs text-slate-500">Leave dates empty to export all data without filtering.</p>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportDateFilterOpen(false)
                      setFilterStartDate('')
                      setFilterEndDate('')
                      setPendingExportFormat(null)
                      setDateValidationError('')
                    }}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={proceedWithExport}
                    disabled={isExportingExcel || isExportingPdf || dateValidationError !== ''}
                    className="rounded-md bg-[#0b2a32] px-4 py-2 text-sm text-white hover:bg-[#0a1f26] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExportingExcel ? 'Exporting Excel...' : isExportingPdf ? 'Exporting PDF...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {viewRecordTarget
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Invoice Record Details</h3>
                    <p className="text-sm text-slate-500">
                      Record #{viewRecordTarget.id} • {toLocalDateTime(viewRecordTarget.createdAt || viewRecordTarget.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    onClick={closeViewRecordModal}
                  >
                    ×
                  </button>
                </div>

                <div className="mb-3 flex items-start items-center gap-4">
                  <div className="text-sm text-slate-600"><span className="font-semibold">Input by:</span> {getInputUser(viewRecordTarget)}</div>
                </div>

                {viewRecordEntries.length === 0 ? (
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">No data fields in this record.</p>
                ) : (
                  <div className="max-h-[55vh] overflow-auto rounded-md border border-slate-200">
                    <table className="w-full border-separate border-spacing-y-0 text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-left text-slate-700">
                          <th className="px-4 py-2">Content</th>
                          <th className="px-4 py-2">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewRecordEntries.map(([key, value]) => (
                          <tr key={key} className="text-slate-700">
                            <td className="border-t border-slate-200 px-4 py-2 font-medium">{key}</td>
                            <td className="border-t border-slate-200 px-4 py-2 break-all">{value === null || value === undefined || value === '' ? '-' : String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button variant="secondary" size="md" onClick={closeViewRecordModal}>Close</Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      </div>
    </PageLayout>
  )
}
