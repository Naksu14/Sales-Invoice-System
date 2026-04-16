/**
 * Utility functions for formatting data for Google Sheets export
 */

/**
 * Format a date value to MM/DD/YYYY format
 */
export function formatDate(value: any): string {
  if (!value) return '';

  let date: Date;

  if (typeof value === 'string') {
    // Handle ISO date strings or other formats
    date = new Date(value);
  } else if (typeof value === 'number') {
    // Handle timestamps
    date = new Date(value);
  } else if (value instanceof Date) {
    date = value;
  } else {
    return String(value);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return String(value);
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

/**
 * Format a number with accounting format: "1,000.00"
 */
export function formatAccountingNumber(value: any): string {
  if (value === null || value === undefined || value === '') return '';

  const num = parseFloat(String(value).replace(/,/g, ''));

  if (isNaN(num)) {
    return String(value);
  }

  // Format with comma separators and two decimal places
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatted;
}

/**
 * Check if a column name indicates it should be formatted as an accounting number
 */
export function isAccountingColumn(columnName: string): boolean {
  const lowerName = (columnName || '').toLowerCase();
  const accountingKeywords = [
    'amount',
    'or amount',
    'ar amount',
    'withholding tax',
    'withholding',
    'tax',
    'total',
    'subtotal',
    'price',
    'rate',
    'fee',
  ];

  return accountingKeywords.some((keyword) => lowerName.includes(keyword));
}

/**
 * Format a value based on the data type and column name
 */
export function formatValueForSheet(
  value: any,
  dataType: string,
  columnName: string,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const type = (dataType || 'text').toLowerCase();

  // Handle date type
  if (type === 'date') {
    return formatDate(value);
  }

  // Handle number type with accounting format for specific columns
  if (type === 'number') {
    if (isAccountingColumn(columnName)) {
      return formatAccountingNumber(value);
    }
    return String(value);
  }

  // Check if column name indicates accounting format even if type is text
  if (isAccountingColumn(columnName)) {
    return formatAccountingNumber(value);
  }

  return String(value);
}

/**
 * Normalize a value before saving to the database.
 * Accounting columns are stored as fixed 2-decimal strings so trailing zeros are preserved.
 */
export function normalizeValueForStorage(
  value: any,
  dataType: string,
  columnName: string,
): any {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  const type = (dataType || 'text').toLowerCase();

  if (type === 'number' && isAccountingColumn(columnName)) {
    return formatAccountingNumber(value);
  }

  if (isAccountingColumn(columnName)) {
    return formatAccountingNumber(value);
  }

  return value;
}
