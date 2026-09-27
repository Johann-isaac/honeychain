"use client";

import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  unit?: string;
}

export function SensorChart({
  data,
  xKey,
  series,
  type = "line",
  height = 240,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: SeriesConfig[];
  type?: "line" | "area";
  height?: number;
}) {
  const Chart = type === "area" ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={38}
          domain={["dataMin - 2", "dataMax + 2"]}
        />
        <Tooltip
          cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
          // Themed through tokens rather than fixed hex values, so the
          // tooltip stays readable in dark mode.
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            fontSize: 12,
            background: "var(--color-card)",
            color: "var(--color-foreground)",
          }}
          labelStyle={{ color: "var(--color-muted-foreground)", marginBottom: 4 }}
        />
        {series.map((s) =>
          type === "area" ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.unit ? `${s.label} (${s.unit})` : s.label}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.18}
              strokeWidth={2}
              dot={false}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.unit ? `${s.label} (${s.unit})` : s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
