import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TIMEZONE = "UTC";

export function getCompanyLocalTime(timestamp: string | Date): Date {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const tzTimeStr = date.toLocaleString("en-US", { timeZone: TIMEZONE });
  return new Date(tzTimeStr);
}

export function formatCompanyTime(timestamp: string | Date, withSeconds = false): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString("en-US", { 
    timeZone: TIMEZONE, 
    hour: '2-digit', 
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined
  });
}

export function formatCompanyDate(timestamp: string | Date, longFormat = false): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  if (longFormat) {
    return date.toLocaleDateString("en-US", { 
      timeZone: TIMEZONE, 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  return getCompanyLocalTime(date).toDateString();
}
