/**
 * Format a number as currency (USD)
 */
export const formatCurrency = (value: number, minimumFractionDigits: number = 2): string => {
  // Handle undefined, null, NaN, or invalid values
  const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Format a number as a percentage
 */
export const formatPercent = (value: number, decimals: number = 2): string => {
  // Handle undefined, null, NaN, or invalid values
  const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(decimals)}%`;
};

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export const formatLargeNumber = (value: number): string => {
  const absValue = Math.abs(value);
  
  if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  
  return value.toFixed(0);
};

/**
 * Format a date string
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return '-';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format a date string with time
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return '-';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Get color class based on profit/loss value
 */
export const getProfitLossColor = (value: number): string => {
  if (value > 0) return 'text-brand-success';
  if (value < 0) return 'text-brand-danger';
  return 'text-gray-500';
};

/**
 * Get background color class based on profit/loss value
 */
export const getProfitLossBgColor = (value: number): string => {
  if (value > 0) return 'bg-brand-success/10';
  if (value < 0) return 'bg-brand-danger/10';
  return 'bg-gray-500/10';
};

/**
 * Format a ticker symbol (uppercase)
 */
export const formatTicker = (ticker: string): string => {
  return ticker.toUpperCase();
};

/**
 * Truncate text to a maximum length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

