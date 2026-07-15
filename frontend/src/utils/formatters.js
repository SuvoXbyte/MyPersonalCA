import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Format a number as Indian Rupee currency
 */
export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date string or Date object to a readable date
 */
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return format(parsed, fmt);
};

/**
 * Format a date as relative (e.g. "3 days ago", "in 5 days")
 */
export const formatRelativeDate = (date) => {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

/**
 * Get days difference from today (positive = future, negative = past)
 */
export const getDaysFromToday = (date) => {
  if (!date) return null;
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return Math.round((parsed - today) / (1000 * 60 * 60 * 24));
};

/**
 * Format a month string (YYYY-MM) to a display name
 */
export const formatMonth = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy');
};

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = () => {
  return format(new Date(), 'yyyy-MM');
};
