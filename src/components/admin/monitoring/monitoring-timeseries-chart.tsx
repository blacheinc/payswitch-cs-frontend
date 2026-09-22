"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
  formatter?: (value: number) => string;
  yAxisId?: "left" | "right";
}

interface MonitoringChartProps<T extends object> {
  title: string;
  description?: string;
  data: T[] | undefined;
  xKey: keyof T & string;
  series: ChartSeries[];
  emptyMessage?: string;
  height?: number;
  /** Slot rendered in the card header, e.g. a period selector. */
  headerAction?: React.ReactNode;
}

// Tokens are hex, not HSL triplets — hsl() around them is an invalid colour.
const DEFAULT_COLORS = [
  "var(--primary)",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
];

function formatXLabel(value: unknown): string {
  if (typeof value !== "string") return String(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  // Shorter tick — adapt to daily vs sub-daily buckets.
  const hours = d.getUTCHours();
  const mins = d.getUTCMinutes();
  const showTime = !(hours === 0 && mins === 0);
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    ...(showTime
      ? { hour: "2-digit", minute: "2-digit" }
      : {}),
  }).format(d);
}

export function MonitoringChart<T extends object>({
  title,
  description,
  data,
  xKey,
  series,
  emptyMessage = "No data for this period.",
  height = 240,
  headerAction,
}: MonitoringChartProps<T>) {
  const rows = data?.length
    ? data.map((d) => ({
        ...d,
        __label: formatXLabel((d as Record<string, unknown>)[xKey]),
      }))
    : [];

  const hasRight = series.some((s) => s.yAxisId === "right");

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="pl-0 sm:pl-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            {emptyMessage}
          </p>
        ) : (
          <div className="w-full min-w-0" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rows}
                margin={{ top: 8, right: hasRight ? 8 : 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="__label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  width={44}
                />
                {hasRight && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    width={44}
                  />
                )}
                <Tooltip
                  // Recharts defaults to a white panel. Item colours come
                  // from each series, so only the container is themed.
                  contentStyle={{
                    fontSize: 12,
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--popover-foreground)",
                    boxShadow: "0 4px 12px rgb(0 0 0 / 0.15)",
                  }}
                  labelStyle={{
                    color: "var(--muted-foreground)",
                    marginBottom: 4,
                  }}
                  cursor={{ stroke: "var(--border)" }}
                  formatter={(value, name) => {
                    const n = Number(value ?? 0);
                    const key = String(name);
                    const s = series.find(
                      (x) => x.key === key || x.label === key,
                    );
                    const formatted = s?.formatter
                      ? s.formatter(n)
                      : n.toLocaleString();
                    return [formatted, s?.label ?? key];
                  }}
                />
                {series.length > 1 && (
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="circle"
                    iconSize={8}
                  />
                )}
                {series.map((s, idx) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    yAxisId={s.yAxisId ?? "left"}
                    isAnimationActive={rows.length < 200}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
