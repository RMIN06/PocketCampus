// lib/format.ts
// Currency and date formatting helpers. All money is Pakistani Rupees (PKR).

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format a number as Pakistani Rupees.
 * @param amount - The amount in rupees
 * @returns Formatted currency string, e.g. "Rs 1,250" or "Rs 1,250.50"
 */
export function formatCurrency(amount: number, currency: string = "PKR"): string {
  if (currency !== "PKR") {
    // Fall back to generic locale formatting for any non-PKR value
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return CURRENCY_FORMATTER.format(amount);
}

/**
 * Format a signed amount for balance-style display.
 * @returns e.g. "+Rs 42.50", "-Rs 42.50", or "Rs 0"
 */
export function formatBalance(amount: number, currency: string = "PKR"): string {
  const abs = Math.abs(amount);
  const formatted = formatCurrency(abs, currency);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format a positive/negative amount for balance display.
 * @param dateStr - ISO date string
 * @returns e.g. "Today", "Yesterday", "Aug 15"
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an ISO date string as a full date.
 * @param dateStr - ISO date string
 * @returns e.g. "August 15, 2026"
 */
export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get the current month in YYYY-MM format.
 * @returns e.g. "2026-09"
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Format a YYYY-MM month string as a display label.
 * @param monthStr - e.g. "2026-09"
 * @returns e.g. "September 2026"
 */
export function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Shift a YYYY-MM string by a number of months.
 * @param monthStr - e.g. "2026-09"
 * @param delta - Number of months to shift (can be negative)
 * @returns e.g. "2026-10" (for delta=1)
 */
export function shiftMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Format a distance in metres as a friendly label.
 * @returns e.g. "350 m" or "1.2 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}