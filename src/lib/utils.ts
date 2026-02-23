import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Indian currency (₹1,23,456.00)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date as "20 Feb 2026"
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd MMM yyyy");
}

/**
 * Format date and time as "20 Feb 2026, 3:45 PM"
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd MMM yyyy, h:mm a");
}

/**
 * Generate unique donation ID: DON-20260220-1234
 */
export function generateDonationId(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `DON-${date}-${random}`;
}

/**
 * Generate unique expense ID: EXP-20260220-1234
 */
export function generateExpenseId(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `EXP-${date}-${random}`;
}

/**
 * Format phone number with +91 prefix
 */
export function formatPhone(phone: string): string {
  // Remove any existing +91 or country code
  const cleaned = phone.replace(/^\+91/, "").replace(/\D/g, "");

  // Add +91 prefix
  return `+91 ${cleaned}`;
}

/**
 * Validate Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(then);
}
