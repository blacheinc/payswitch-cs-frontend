/**
 * Format monitoring API numeric fields for display.
 * OpenAPI does not pin whether rates are 0–1 fractions or 0–100; we handle both.
 */
export function toDisplayPercent(
  value: number | null | undefined,
): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value >= 0 && value <= 1) return value * 100;
  if (value > 1 && value <= 100) return value;
  return value;
}

export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 1,
): string {
  const v = toDisplayPercent(value);
  if (v == null) return "—";
  return `${v.toFixed(fractionDigits)}%`;
}

export function formatMs(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}ms`;
}
