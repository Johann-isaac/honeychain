import Link from "next/link";
import { Hexagon, ShieldCheck, AlertTriangle, Droplet, CalendarClock, Package, ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { HiveCard } from "@/components/hive/hive-card";
import { AlertItem } from "@/components/hive/alert-item";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_BEEKEEPER_ID,
  getAlertsForBeekeeper,
  getBeekeeperById,
  getBeekeeperDashboard,
  getHiveYieldPrediction,
  getHivesByBeekeeper,
  getLatestSensorReading,
} from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function BeekeeperDashboard() {
  const beekeeper = getBeekeeperById(DEFAULT_BEEKEEPER_ID)!;
  const kpis = getBeekeeperDashboard(DEFAULT_BEEKEEPER_ID);
  const hives = getHivesByBeekeeper(DEFAULT_BEEKEEPER_ID);
  const alerts = getAlertsForBeekeeper(DEFAULT_BEEKEEPER_ID).slice(0, 3);
  const firstName = beekeeper.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Beekeeper ID: <span className="font-medium text-foreground">{beekeeper.beekeeperCode}</span> · {beekeeper.region}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Hives" value={kpis.totalHives} icon={Hexagon} />
        <KpiCard label="Healthy Hives" value={kpis.healthyHives} icon={ShieldCheck} tone="success" />
        <KpiCard label="Attention Required" value={kpis.attentionHives} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Est. Honey Yield" value={kpis.estimatedYieldKg} suffix=" kg" decimals={1} icon={Droplet} />
        <KpiCard label="Next Expected Harvest" value={kpis.nextHarvestDays} suffix=" Days" icon={CalendarClock} />
        <KpiCard label="Active Honey Batches" value={kpis.activeBatches} icon={Package} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Your Bee Hives</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/beekeeper/hives">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hives.slice(0, 3).map((hive) => (
            <HiveCard
              key={hive.id}
              hive={hive}
              reading={getLatestSensorReading(hive.id)}
              estimatedYieldKg={getHiveYieldPrediction(hive.id)?.predictedYieldKg}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Alerts &amp; Recommendations</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/beekeeper/alerts">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="space-y-3">
          {alerts.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No active alerts. All monitored hives are within expected ranges.
            </p>
          )}
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} hive={hives.find((h) => h.id === alert.hiveId)} readOnly />
          ))}
        </div>
      </section>
    </div>
  );
}
