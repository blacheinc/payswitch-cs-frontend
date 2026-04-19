/**
 * Display helpers for monitoring dashboards.
 * API returns mostly 0–100 percentages (suffixed `_pct`); keep this simple.
 */

export function formatPct(
  value: number | null | undefined,
  fractionDigits = 1,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const v = value >= 0 && value <= 1 ? value * 100 : value;
  return `${v.toFixed(fractionDigits)}%`;
}

/** Back-compat alias used by older callers. */
export const formatPercent = formatPct;

export function toDisplayPercent(
  value: number | null | undefined,
): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value >= 0 && value <= 1) return value * 100;
  return value;
}

export function formatMs(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return value;
  }
}

export function formatRelative(value?: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const diffMs = Date.now() - d.getTime();
    const abs = Math.abs(diffMs);
    const seconds = Math.round(abs / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60)
      return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } catch {
    return value;
  }
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
