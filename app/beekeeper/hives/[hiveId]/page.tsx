import { notFound } from "next/navigation";
import { Crown, MapPin, CalendarCheck, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SensorMonitoring } from "@/components/hive/sensor-monitoring";
import { HealthScoreCard } from "@/components/hive/health-score-card";
import { YieldPredictionCard } from "@/components/hive/yield-prediction-card";
import { formatDate } from "@/lib/utils";
import { getHiveHealth, getHiveById, getHiveYieldPrediction, getSensorReadings } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function HiveDetailPage({ params }: PageProps<"/beekeeper/hives/[hiveId]">) {
  const { hiveId } = await params;
  const hive = await getHiveById(hiveId);
  if (!hive) notFound();

  const [readings, health, prediction] = await Promise.all([
    getSensorReadings(hiveId, 24),
    getHiveHealth(hiveId),
    getHiveYieldPrediction(hiveId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{hive.hiveCode}</p>
          <h1 className="font-display text-2xl">{hive.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {hive.location}
          </p>
        </div>
        <Badge variant={hive.status === "HEALTHY" ? "success" : hive.status === "ATTENTION" ? "warning" : "destructive"}>
          {hive.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarCheck className="size-3.5" /> Installed</p>
            <p className="mt-1 text-sm font-semibold">{formatDate(hive.installationDate)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Crown className="size-3.5" /> Queen</p>
            <p className="mt-1 text-sm font-semibold">{hive.queenAge} mo · {hive.queenStatus}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Activity className="size-3.5" /> Colony strength</p>
            <p className="mt-1 text-sm font-semibold">{hive.colonyStrength}%</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarCheck className="size-3.5" /> Last inspection</p>
            <p className="mt-1 text-sm font-semibold">{hive.lastInspection ? formatDate(hive.lastInspection) : "—"}</p>
          </div>
        </CardContent>
      </Card>

      <SensorMonitoring hiveId={hiveId} initialReadings={readings} />

      {health && prediction && (
        <div className="grid gap-6 lg:grid-cols-2">
          <HealthScoreCard health={health} />
          <YieldPredictionCard prediction={prediction} />
        </div>
      )}
    </div>
  );
}
