import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Canonical timestamp format used everywhere in the app.
 * Example: "Apr 18, 2026, 2:30 PM"
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return format(d, "MMM d, yyyy, h:mm a");
}

// ─── Number & percentage helpers ────────────────────────────────────────────

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

/** API returns percents as 0–100 (with `_pct` suffix) or occasionally 0–1 fractions. */
export function toDisplayPercent(
  value: number | null | undefined,
): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value >= 0 && value <= 1) return value * 100;
  return value;
}

export function formatPct(
  value: number | null | undefined,
  fractionDigits = 1,
): string {
  const v = toDisplayPercent(value);
  if (v == null) return "—";
  return `${v.toFixed(fractionDigits)}%`;
}

/** Back-compat alias. */
export const formatPercent = formatPct;

export function formatMs(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

export function formatMetric(
  value: number | null | undefined,
  fractionDigits = 3,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(fractionDigits);
}

export function prettyModelType(value?: string | null): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
