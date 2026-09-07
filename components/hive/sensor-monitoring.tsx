"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
    humidity: r.humidity,
    weight: r.weight,
    soundLevel: r.soundLevel,
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
  const vibrationEvents = readings.filter((r) => r.vibration).slice(-5).reverse();

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
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="sound">Sound Level</TabsTrigger>
            <TabsTrigger value="vibration">Vibration</TabsTrigger>
          </TabsList>

          <TabsContent value="temperature">
            <p className="mb-2 text-[11px] text-muted-foreground">DHT22 sensor</p>
            <SensorChart data={chartData} xKey="t" series={[{ key: "temperature", label: "Temperature", color: "#d99a2b", unit: "°C" }]} />
          </TabsContent>
          <TabsContent value="humidity">
            <p className="mb-2 text-[11px] text-muted-foreground">DHT22 sensor</p>
            <SensorChart data={chartData} xKey="t" series={[{ key: "humidity", label: "Humidity", color: "#4f7942", unit: "%" }]} />
          </TabsContent>
          <TabsContent value="weight">
            <p className="mb-2 text-[11px] text-muted-foreground">Load cell + HX711</p>
            <SensorChart data={chartData} xKey="t" series={[{ key: "weight", label: "Weight", color: "#8a5a2b", unit: "kg" }]} />
          </TabsContent>
          <TabsContent value="sound">
            <p className="mb-2 text-[11px] text-muted-foreground">Analog microphone</p>
            <SensorChart type="area" data={chartData} xKey="t" series={[{ key: "soundLevel", label: "Sound Level", color: "#b0472e", unit: "raw" }]} />
          </TabsContent>
          <TabsContent value="vibration">
            <p className="mb-2 text-[11px] text-muted-foreground">Digital vibration sensor</p>
            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-center justify-between rounded-xl bg-muted p-3">
                <span className="text-sm text-muted-foreground">Current status</span>
                {latest?.vibration ? (
                  <Badge variant="destructive">
                    <AlertTriangle className="size-3" /> Vibration Detected
                  </Badge>
                ) : (
                  <Badge variant="success">
                    <CheckCircle2 className="size-3" /> No Vibration
                  </Badge>
                )}
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Recent events ({readings.filter((r) => r.vibration).length} in this range)
                </p>
                {vibrationEvents.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    No vibration events recorded in this range.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {vibrationEvents.map((r) => (
                      <li key={r.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
                        <AlertTriangle className="size-3.5 text-destructive" />
                        {formatDateTime(r.timestamp)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
