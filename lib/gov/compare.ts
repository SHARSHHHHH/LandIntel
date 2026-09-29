/**
 * Small helper for the "above/below national average" comparison lines on
 * Area Intelligence stat cards. All baselines are the well-known published
 * Census of India 2011 topline figures (see NATIONAL_2011 in lib/gov/db.ts).
 */
export function compareToNational(value: number | null, baseline: number, unit: string, label = "national 2011 average"): string | null {
  if (value === null || Number.isNaN(value)) return null;
  const delta = value - baseline;
  const rounded = Math.abs(Math.round(delta * 10) / 10);
  if (rounded < 0.05) return `In line with the ${label} (${baseline}${unit})`;
  const direction = delta > 0 ? "above" : "below";
  return `${rounded}${unit} ${direction} the ${label} (${baseline}${unit})`;
}
