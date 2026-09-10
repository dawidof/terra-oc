/**
 * Single source of truth for chart styling. Values reference CSS custom
 * properties so every chart follows the design tokens in globals.css.
 */

import type { CSSProperties } from "react";

export const CHART_CATEGORIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** Brand accent, for single-series charts that should read as "primary". */
export const CHART_BRAND = "var(--chart-1)";

/** Neutral series colour, for single-series charts that should recede. */
export const CHART_NEUTRAL = "var(--chart-2)";

export function chartColor(index: number): string {
  return CHART_CATEGORIES[index % CHART_CATEGORIES.length];
}

export const CHART_GRID_STROKE = "var(--border)";

export const CHART_AXIS_TICK = {
  fontSize: 12,
  fill: "var(--muted-foreground)",
} as const;

export const CHART_AXIS_LINE = {
  stroke: "var(--border)",
} as const;

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow-md)",
  fontSize: "12px",
  padding: "8px 10px",
};

export const CHART_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "var(--foreground)",
  fontWeight: 500,
  marginBottom: 2,
};

export const CHART_TOOLTIP_ITEM_STYLE: CSSProperties = {
  color: "var(--muted-foreground)",
};

export const CHART_LEGEND_STYLE: CSSProperties = {
  fontSize: "12px",
  color: "var(--muted-foreground)",
};
