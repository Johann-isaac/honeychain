import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown, MapPin, CalendarCheck, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SensorMonitoring } from "@/components/hive/sensor-monitoring";
import { HealthScoreCard } from "@/components/hive/health-score-card";
import { YieldPredictionCard } from "@/components/hive/yield-prediction-card";
import { AiInsightCard } from "@/components/hive/ai-insight-card";
import { CameraPreviewCard } from "@/components/hive/camera-preview-card";
import { formatDate } from "@/lib/utils";
import { getHiveHealth, getHiveById, getHiveYieldPrediction, getSensorReadings } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/beekeeper/hives/[hiveId]">): Promise<Metadata> {
  const { hiveId } = await params;
  const hive = await getHiveById(hiveId);
  return { title: hive ? `${hive.name} (${hive.hiveCode})` : "Hive" };
}

export default async function HiveDetailPage({ params }: PageProps<"/beekeeper/hives/[hiveId]">) {
  const { hiveId } = await params;
  const beekeeperId = await getCurrentBeekeeperId();
  const hive = await getHiveById(hiveId);
  if (!hive || hive.beekeeperId !== beekeeperId) notFound();

  const [readings, health, prediction] = await Promise.all([
    getSensorReadings(hiveId, 24),
    getHiveHealth(hiveId),
    getHiveYieldPrediction(hiveId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/beekeeper/hives"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to hives
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{hive.hiveCode}</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{hive.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {hive.location}
            </p>
          </div>
          <Badge variant={hive.status === "HEALTHY" ? "success" : hive.status === "ATTENTION" ? "warning" : "destructive"}>
            {statusLabel[hive.status]}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
          <Stat icon={CalendarCheck} label="Installed" value={formatDate(hive.installationDate)} />
          <Stat icon={Crown} label="Queen" value={`${hive.queenAge} mo · ${hive.queenStatus}`} />
          <Stat icon={Activity} label="Colony strength" value={`${hive.colonyStrength}%`} />
          <Stat
            icon={CalendarCheck}
            label="Last inspection"
            value={hive.lastInspection ? formatDate(hive.lastInspection) : "Not recorded"}
          />
        </CardContent>
      </Card>

      <SensorMonitoring hiveId={hiveId} initialReadings={readings} />

      <CameraPreviewCard hiveId={hiveId} initialSnapshotUrl={hive.latestSnapshotUrl} initialCapturedAt={hive.latestSnapshotAt} />

      {health && prediction && (
        <div className="grid gap-6 lg:grid-cols-2">
          <HealthScoreCard health={health} />
          <YieldPredictionCard prediction={prediction} />
        </div>
      )}

      <AiInsightCard hiveId={hiveId} initialInsight={hive.aiInsight} initialGeneratedAt={hive.aiInsightGeneratedAt} />
    </div>
  );
}

const statusLabel: Record<string, string> = {
  HEALTHY: "Healthy",
  ATTENTION: "Needs attention",
  CRITICAL: "Critical",
};

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
