/**
 * Date Utility Functions
 * Helper functions for date operations and calculations
 */

import { differenceInDays, subDays, startOfDay, format } from 'date-fns';

/**
 * Calculate days since a given date
 */
export function daysSince(date: Date | null | undefined): number {
  if (!date) return Infinity;
  return differenceInDays(new Date(), new Date(date));
}

/**
 * Get date N days ago from today
 */
export function daysAgo(days: number): Date {
  return startOfDay(subDays(new Date(), days));
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Never';
  return format(new Date(date), 'MMM d, yyyy');
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'Never';

  const days = daysSince(date);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Get date range for time period
 */
export function getDateRange(period: '7d' | '30d' | '90d' | 'custom', customStart?: Date, customEnd?: Date) {
  const end = startOfDay(new Date());

  if (period === 'custom' && customStart && customEnd) {
    return {
      start: startOfDay(customStart),
      end: startOfDay(customEnd),
    };
  }

  const daysMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const start = daysAgo(daysMap[period] || 30);

  return { start, end };
}

/**
 * Normalize date to start of day in UTC
 */
export function normalizeDate(date: Date): Date {
  return startOfDay(new Date(date));
}

/**
 * Check if date is within range
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const normalized = normalizeDate(date);
  return normalized >= start && normalized <= end;
}
