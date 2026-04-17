"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TimeseriesPoint } from "@/types/monitoring-types";

function toChartRows(points: TimeseriesPoint[]) {
  return points.map((p) => ({
    ...p,
    label: formatTick(p.timestamp),
    v: typeof p.value === "number" ? p.value : Number(p.value) || 0,
  }));
}

function formatTick(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

interface MonitoringTimeseriesChartProps {
  title: string;
  description?: string;
  data: TimeseriesPoint[] | undefined;
  /** y-axis number formatter */
  valueFormatter?: (n: number) => string;
  /** stroke color for the line */
  stroke?: string;
  emptyMessage?: string;
}

export function MonitoringTimeseriesChart({
  title,
  description,
  data,
  valueFormatter = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 }),
  stroke = "hsl(var(--primary))",
  emptyMessage = "No time-series data for this period.",
}: MonitoringTimeseriesChartProps) {
  const rows = data?.length ? toChartRows(data) : [];

  if (!rows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-10">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                width={48}
                tickFormatter={(v) => valueFormatter(Number(v))}
              />
              <Tooltip
                formatter={(val: number | undefined) => [
                  valueFormatter(Number(val)),
                  title,
                ]}
                labelFormatter={(label) => String(label)}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={2}
                dot={false}
                isAnimationActive={rows.length < 200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
