import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DownloadIcon from '@mui/icons-material/Download'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Button from '../ui/Button'
import { createSiRecord } from '../../services/siRecordsService'

const getColumnKey = (column) => column.dbFieldName || column.db_field_name || column.columnName
const getColumnType = (column) => (column.dataType || column.data_type || 'text').toLowerCase()
const normalize = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '')

const getDropdownOptions = (column) => {
  const raw =
    column.dropdownOptions ||
    column.dropdown_options ||
    column.options ||
    column.optionValues ||
    column.option_values ||
    []

  if (Array.isArray(raw)) {
    return raw
      .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
      .filter(Boolean)
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
          .filter(Boolean)
      }
    } catch {
      // fallback to comma/newline parsing
    }

    return trimmed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const excelDateToIso = (serial) => {
  const utcDays = Math.floor(serial - 25569)
  const utcValue = utcDays * 86400
  const dateInfo = new Date(utcValue * 1000)
  if (Number.isNaN(dateInfo.getTime())) return null

  const year = dateInfo.getUTCFullYear()
  const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dateInfo.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const coerceByType = (rawValue, column) => {
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim()
  const type = getColumnType(column)

  if (!value) return { value: undefined }

  if (type === 'number') {
    const parsed = Number(String(value).replace(/,/g, ''))
    if (Number.isNaN(parsed)) {
      return { error: `${column.columnName} must be a number` }
    }
    return { value: parsed }
  }

  if (type === 'date') {
    if (typeof rawValue === 'number') {
      const isoDate = excelDateToIso(rawValue)
      if (!isoDate) return { error: `${column.columnName} must be a valid date` }
      return { value: isoDate }
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return { error: `${column.columnName} must be a valid date` }
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return { value: `${year}-${month}-${day}` }
  }

  if (type === 'dropdown' || type === 'select') {
    const options = getDropdownOptions(column)
    if (options.length > 0 && !options.some((opt) => opt.toLowerCase() === value.toLowerCase())) {
      return { error: `${column.columnName} must be one of: ${options.join(', ')}` }
    }
    return { value }
  }

  return { value }
}

export default function ImportRecordsModal({
  isOpen,
  onClose,
  spreadsheetId,
  sheetName,
  columns = [],
  onSuccess,
}) {
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState('')
  const [summary, setSummary] = useState(null)
  const [rowErrors, setRowErrors] = useState([])
  const [validRows, setValidRows] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const hasColumns = columns.length > 0
  const requiredColumns = useMemo(() => columns.filter((c) => c.isRequired), [columns])

  if (!isOpen) return null

  const resetState = () => {
    setFileName('')
    setFileError('')
    setSummary(null)
    setRowErrors([])
    setValidRows([])
    setIsProcessing(false)
    setIsImporting(false)
  }

  const closeModal = () => {
    if (isImporting) return
    resetState()
    onClose?.()
  }

  const buildTemplateRows = () => {
    const headers = columns.map((c) => c.columnName)
    const sample = columns.map((c) => {
      const type = getColumnType(c)
      if (type === 'date') return '2026-04-07'
      if (type === 'number') return '1000.0'
      if (type === 'dropdown' || type === 'select') {
        const options = getDropdownOptions(c)
        return options[0] || ''
      }
      return ''
    })

    return [headers, sample]
  }

  const downloadTemplateXlsx = () => {
    if (!hasColumns) return
    const rows = buildTemplateRows()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Template')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${sheetName || 'sheet'}-import-template.xlsx`,
    )
  }

  const downloadTemplateCsv = () => {
    if (!hasColumns) return
    const rows = buildTemplateRows()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const csv = XLSX.utils.sheet_to_csv(ws)
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${sheetName || 'sheet'}-import-template.csv`)
  }

  const parseFile = async (file) => {
    setFileError('')
    setSummary(null)
    setRowErrors([])
    setValidRows([])

    if (!file) return
    if (!spreadsheetId) {
      setFileError('No active sheet selected')
      return
    }
    if (!hasColumns) {
      setFileError('This sheet has no configured columns yet')
      return
    }

    setIsProcessing(true)
    setFileName(file.name)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      if (!worksheet) {
        setFileError('Unable to read worksheet from file')
        return
      }

      const rawRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
      })

      if (!rawRows || rawRows.length < 2) {
        setFileError('File must include a header row and at least one data row')
        return
      }

      const headerRow = rawRows[0].map((h) => String(h || '').trim())
      const headerMap = {}
      headerRow.forEach((header, index) => {
        headerMap[normalize(header)] = index
      })

      const missingRequiredHeaders = requiredColumns
        .filter((column) => {
          const candidates = [column.columnName, getColumnKey(column)]
          return !candidates.some((name) => headerMap[normalize(name)] !== undefined)
        })
        .map((column) => column.columnName)

      if (missingRequiredHeaders.length > 0) {
        setFileError(`Missing required columns: ${missingRequiredHeaders.join(', ')}`)
        return
      }

      const mappedColumns = columns.map((column) => {
        const candidates = [column.columnName, getColumnKey(column)]
        let headerIndex = -1
        for (const candidate of candidates) {
          const idx = headerMap[normalize(candidate)]
          if (idx !== undefined) {
            headerIndex = idx
            break
          }
        }
        return { column, headerIndex }
      })

      const parsedValidRows = []
      const parsedErrors = []

      for (let i = 1; i < rawRows.length; i += 1) {
        const sourceRow = rawRows[i]
        const rowNumber = i + 1
        const rowData = {}
        const rowProblems = []

        mappedColumns.forEach(({ column, headerIndex }) => {
          const key = getColumnKey(column)
          const rawValue = headerIndex >= 0 ? sourceRow[headerIndex] : ''
          const stringValue = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim()

          if (column.isRequired && !stringValue) {
            rowProblems.push(`${column.columnName} is required`)
            return
          }

          if (!stringValue) return

          const coerced = coerceByType(rawValue, column)
          if (coerced.error) {
            rowProblems.push(coerced.error)
            return
          }

          rowData[key] = coerced.value
        })

        if (Object.keys(rowData).length === 0 && rowProblems.length === 0) {
          continue
        }

        if (rowProblems.length > 0) {
          parsedErrors.push({ rowNumber, errors: rowProblems })
        } else {
          parsedValidRows.push({ rowNumber, data: rowData })
        }
      }

      setValidRows(parsedValidRows)
      setRowErrors(parsedErrors)
      setSummary({
        totalRows: Math.max(0, rawRows.length - 1),
        validRows: parsedValidRows.length,
        invalidRows: parsedErrors.length,
      })

      if (parsedValidRows.length === 0) {
        setFileError('No valid rows found to import')
      }
    } catch (err) {
      setFileError(err?.message || 'Failed to parse file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (validRows.length === 0 || !spreadsheetId) return

    setIsImporting(true)
    const apiErrors = []
    let inserted = 0

    try {
      const result = await Promise.allSettled(
        validRows.map((row) => createSiRecord({ sheetId: spreadsheetId, data: row.data })),
      )

      result.forEach((item, index) => {
        if (item.status === 'fulfilled') {
          inserted += 1
          return
        }

        const row = validRows[index]
        const reason = item.reason
        const message = reason?.message || reason?.error || 'Failed to insert row'
        apiErrors.push({ rowNumber: row.rowNumber, errors: [message] })
      })

      setRowErrors((prev) => [...prev, ...apiErrors])
      setSummary((prev) => ({
        ...(prev || { totalRows: validRows.length, validRows: validRows.length, invalidRows: 0 }),
        insertedRows: inserted,
        failedOnInsert: apiErrors.length,
      }))

      if (inserted > 0) {
        onSuccess?.({ inserted, failed: apiErrors.length })
      }

      if (inserted > 0 && apiErrors.length === 0) {
        closeModal()
      }
    } finally {
      setIsImporting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Import SI/AR Records</h3>
            <p className="text-sm text-slate-500">
              Upload Excel or CSV, validate against {sheetName || 'active sheet'} columns, then import valid rows.
            </p>
          </div>
          <button onClick={closeModal} className="text-slate-500 hover:text-slate-800" disabled={isImporting}>
            <CloseIcon />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<DownloadIcon fontSize="small" />}
            onClick={downloadTemplateXlsx}
            disabled={!hasColumns || isImporting}
          >
            Download Template (XLSX)
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<DownloadIcon fontSize="small" />}
            onClick={downloadTemplateCsv}
            disabled={!hasColumns || isImporting}
          >
            Download Template (CSV)
          </Button>

          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            <UploadFileIcon fontSize="small" />
            <span>{isProcessing ? 'Reading file...' : 'Choose File'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={isImporting || isProcessing}
              onChange={(e) => parseFile(e.target.files?.[0])}
            />
          </label>
        </div>

        {fileName && <p className="mb-2 text-sm text-slate-600">Selected file: {fileName}</p>}
        {fileError && <p className="mb-2 text-sm text-rose-600">{fileError}</p>}

        {summary && (
          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <div className="text-slate-500">Total</div>
              <div className="font-semibold text-slate-700">{summary.totalRows || 0}</div>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <div className="text-emerald-600">Valid</div>
              <div className="font-semibold text-emerald-700">{summary.validRows || 0}</div>
            </div>
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
              <div className="text-rose-600">Invalid</div>
              <div className="font-semibold text-rose-700">{summary.invalidRows || 0}</div>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
              <div className="text-blue-600">Inserted</div>
              <div className="font-semibold text-blue-700">{summary.insertedRows || 0}</div>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              <div className="text-amber-600">Insert Failed</div>
              <div className="font-semibold text-amber-700">{summary.failedOnInsert || 0}</div>
            </div>
          </div>
        )}

        <div className="max-h-64 overflow-auto rounded-md border border-slate-200">
          {rowErrors.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">No row errors.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Error Details</th>
                </tr>
              </thead>
              <tbody>
                {rowErrors.map((item, index) => (
                  <tr key={`${item.rowNumber}-${index}`} className="border-t border-slate-200 align-top">
                    <td className="px-3 py-2 font-medium text-slate-700">{item.rowNumber}</td>
                    <td className="px-3 py-2 text-rose-600">{item.errors.join(' | ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={closeModal} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleImport}
            disabled={isImporting || isProcessing || validRows.length === 0}
          >
            {isImporting ? 'Importing...' : `Import ${validRows.length || 0} Valid Rows`}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
