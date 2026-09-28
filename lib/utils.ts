import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  });
}

export function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function daysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Device liveness
//
// A hive that has stopped reporting is the single most important thing this
// product can tell a beekeeper, so "how old is this reading" is shared logic
// rather than something each page decides for itself. Lives in utils (not
// aiHealthService) because client components need it too.
// ---------------------------------------------------------------------------

// A node on the default 5-minute send interval misses 12 sends before this
// trips, which is long enough to ride out a WiFi blip without crying wolf.
export const OFFLINE_AFTER_MINUTES = 60;

export function minutesSince(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}

/** True when a reading is too old to describe the hive's current state. */
export function isReadingStale(iso: string, now: number = Date.now()): boolean {
  return minutesSince(iso, now) >= OFFLINE_AFTER_MINUTES;
}

/** Compact "how long ago" for badges and captions: 4m, 3h, 6d. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const mins = minutesSince(iso, now);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
