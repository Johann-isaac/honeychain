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
        <CartesianGrid strokeDasharray="3 3" stroke="#8884" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={30} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={38}
          domain={["dataMin - 2", "dataMax + 2"]}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e8dcc4",
            fontSize: 12,
            background: "var(--color-card)",
            color: "var(--color-foreground)",
          }}
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
