"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SensorChart } from "@/components/charts/sensor-chart";
import { cn, formatDateTime } from "@/lib/utils";
import type { SensorReading } from "@/types";

const RANGES = [
  { key: "1h", label: "1H" },
  { key: "6h", label: "6H" },
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
] as const;

function toChartData(readings: SensorReading[], range: string) {
  const showDate = range === "7d" || range === "30d";
  return readings.map((r) => ({
    t: showDate ? new Date(r.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : new Date(r.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    temperature: r.temperature,
    externalTemperature: r.externalTemperature,
    humidity: r.humidity,
    weight: r.weight,
    sound: r.sound,
    activityScore: r.activityScore,
  }));
}

export function SensorMonitoring({ hiveId, initialReadings }: { hiveId: string; initialReadings: SensorReading[] }) {
  const [range, setRange] = React.useState<(typeof RANGES)[number]["key"]>("24h");
  const [readings, setReadings] = React.useState<SensorReading[]>(initialReadings);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch kicked off below
    setLoading(true);
    fetch(`/api/hives/${hiveId}/sensors?range=${range}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setReadings(data.readings ?? []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [hiveId, range]);

  const chartData = toChartData(readings, range);
  const latest = readings[readings.length - 1];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Real-Time Sensor Monitoring</CardTitle>
        <div className="flex rounded-full bg-muted p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                range === r.key ? "bg-card shadow-sm" : "text-muted-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="temperature">
          <TabsList className="flex-wrap">
            <TabsTrigger value="temperature">Temperature</TabsTrigger>
            <TabsTrigger value="humidity">Humidity</TabsTrigger>
            <TabsTrigger value="weight">Hive Weight</TabsTrigger>
            <TabsTrigger value="activity">Bee Activity</TabsTrigger>
            <TabsTrigger value="external">External Temp</TabsTrigger>
            <TabsTrigger value="battery">Battery</TabsTrigger>
          </TabsList>

          <TabsContent value="temperature">
            <SensorChart data={chartData} xKey="t" series={[{ key: "temperature", label: "Temperature", color: "#d99a2b", unit: "°C" }]} />
          </TabsContent>
          <TabsContent value="humidity">
            <SensorChart data={chartData} xKey="t" series={[{ key: "humidity", label: "Humidity", color: "#4f7942", unit: "%" }]} />
          </TabsContent>
          <TabsContent value="weight">
            <SensorChart data={chartData} xKey="t" series={[{ key: "weight", label: "Hive Weight", color: "#8a5a2b", unit: "kg" }]} />
          </TabsContent>
          <TabsContent value="activity">
            <SensorChart type="area" data={chartData} xKey="t" series={[{ key: "activityScore", label: "Activity / Sound", color: "#b0472e", unit: "idx" }]} />
          </TabsContent>
          <TabsContent value="external">
            <SensorChart data={chartData} xKey="t" series={[{ key: "externalTemperature", label: "External Temp", color: "#3b6ea5", unit: "°C" }]} />
          </TabsContent>
          <TabsContent value="battery">
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sensor battery</span>
                <span className="font-semibold">{latest?.battery ?? "—"}%</span>
              </div>
              <Progress value={latest?.battery ?? 0} indicatorClassName={latest && latest.battery < 20 ? "bg-destructive" : undefined} />
              <p className="text-xs text-muted-foreground">
                {latest && latest.battery < 20
                  ? "Battery is low — schedule a replacement at the next hive visit."
                  : "Battery level is healthy."}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        <p className="mt-4 text-right text-[11px] text-muted-foreground">
          {loading ? "Updating…" : latest ? `Last updated ${formatDateTime(latest.timestamp)}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
