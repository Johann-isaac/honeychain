import Link from "next/link";
import { AlertTriangle, Droplets, MapPin, Mic, Scale, Thermometer, CalendarClock, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, daysUntil, formatRelativeTime, isReadingStale } from "@/lib/utils";
import type { Hive, SensorReading } from "@/types";

const statusMeta: Record<Hive["status"], { label: string; dot: string; variant: "success" | "warning" | "destructive" }> = {
  HEALTHY: { label: "Healthy", dot: "bg-success", variant: "success" },
  ATTENTION: { label: "Attention", dot: "bg-warning", variant: "warning" },
  CRITICAL: { label: "Critical", dot: "bg-destructive", variant: "destructive" },
};

export function HiveCard({
  hive,
  reading,
  estimatedYieldKg,
}: {
  hive: Hive;
  reading?: SensorReading;
  estimatedYieldKg?: number;
}) {
  const status = statusMeta[hive.status];

  // A hive that has gone quiet takes over the badge entirely. Showing
  // "Healthy" next to week-old numbers is the misleading case this exists
  // to prevent — the health status simply isn't known any more.
  const offline = reading ? isReadingStale(reading.timestamp) : false;

  return (
    <Link href={`/beekeeper/hives/${hive.id}`} className="block">
      <Card className={cn("hover-lift h-full", offline && "border-destructive/40")}>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{hive.hiveCode}</p>
            <h3 className="truncate text-base font-semibold">{hive.name}</h3>
          </div>
          {offline && reading ? (
            <Badge variant="destructive">
              <WifiOff className="size-3" /> Offline
            </Badge>
          ) : (
            <Badge variant={status.variant}>
              <span className={`size-1.5 rounded-full ${status.dot}`} /> {status.label}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {hive.location}
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="size-4 text-honey-dark" />
              <span>{reading ? `${reading.temperature}°C` : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="size-4 text-nature" />
              <span>{reading ? `${reading.humidity}%` : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-primary-dark" />
              <span>{reading ? `${reading.weight} kg` : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="size-4 text-destructive" />
              <span>{reading ? reading.soundLevel : "—"}</span>
            </div>
          </div>
          {reading?.vibration && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertTriangle className="size-3.5" /> Vibration detected
            </p>
          )}
          {offline && reading && (
            <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-xs font-medium text-destructive">
              <WifiOff className="size-3.5 shrink-0" />
              Last reported {formatRelativeTime(reading.timestamp)}
            </p>
          )}
          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span>Est. yield: <b className="text-foreground">{estimatedYieldKg?.toFixed(1) ?? "—"} kg</b></span>
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3.5" /> {daysUntil(hive.nextInspection)}d inspection
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
