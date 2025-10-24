/**
 * Date helper utilities for job filtering
 * Using date-fns for better date manipulation
 */

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  format,
} from "date-fns";

/**
 * Get the start and end date for the current week (Sunday - Saturday)
 */
export function getThisWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();

  const start = startOfWeek(now, { weekStartsOn: 0 }); // 0 = Sunday
  const end = endOfWeek(now, { weekStartsOn: 0 });

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

/**
 * Get the start and end date for last week (Sunday - Saturday)
 */
export function getLastWeekRange(): { startDate: string; endDate: string } {
  const lastWeek = subWeeks(new Date(), 1);

  const start = startOfWeek(lastWeek, { weekStartsOn: 0 });
  const end = endOfWeek(lastWeek, { weekStartsOn: 0 });

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

/**
 * Get the start and end date for the current month
 */
export function getThisMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();

  const start = startOfMonth(now);
  const end = endOfMonth(now);

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

/**
 * Format date to readable string (e.g., "Jan 15, 2024")
 */
export function formatDate(dateString: string): string {
  return format(new Date(dateString), "MMM d, yyyy");
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
