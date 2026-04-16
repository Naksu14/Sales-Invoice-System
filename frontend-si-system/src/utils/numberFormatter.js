/**
 * Checks if a column name indicates it should be formatted as a currency/amount field
 */
export const isAmountColumn = (columnName) => {
  const lowerName = (columnName || '').toLowerCase();
  const amountKeywords = [
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

  return amountKeywords.some((keyword) => lowerName.includes(keyword));
};

/**
 * Format a number to 2 decimal places
 * Handles both user input and display
 */
export const formatTo2Decimals = (value) => {
  if (value === '' || value === null || value === undefined) return '';

  // Remove any existing commas or spaces
  const cleanValue = String(value).replace(/,/g, '').trim();

  // Parse to number
  const num = parseFloat(cleanValue);

  if (isNaN(num)) {
    return cleanValue; // Return as-is if not a valid number
  }

  // Return formatted with 2 decimals
  return num.toFixed(2);
};

/**
 * Format for display with thousands separator and 2 decimals
 */
export const formatDisplayNumber = (value) => {
  if (value === '' || value === null || value === undefined) return '';

  const cleanValue = String(value).replace(/,/g, '').trim();
  const num = parseFloat(cleanValue);

  if (isNaN(num)) {
    return cleanValue;
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
