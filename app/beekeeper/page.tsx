import Link from "next/link";
import { Hexagon, ShieldCheck, AlertTriangle, Droplet, CalendarClock, Package, ArrowRight, Plus } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { HiveCard } from "@/components/hive/hive-card";
import { AlertItem } from "@/components/hive/alert-item";
import { NextYieldForecast } from "@/components/dashboard/next-yield-forecast";
import { Button } from "@/components/ui/button";
import {
  getDefaultBeekeeperId,
  getAlertsForBeekeeper,
  getBeekeeperById,
  getBeekeeperDashboard,
  getBeekeeperYieldForecast,
  getHiveYieldPrediction,
  getHivesByBeekeeper,
  getLatestSensorReading,
} from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function BeekeeperDashboard() {
  const beekeeperId = await getDefaultBeekeeperId();
  const beekeeper = (await getBeekeeperById(beekeeperId))!;
  const [kpis, forecast, hives, allAlerts] = await Promise.all([
    getBeekeeperDashboard(beekeeperId),
    getBeekeeperYieldForecast(beekeeperId),
    getHivesByBeekeeper(beekeeperId),
    getAlertsForBeekeeper(beekeeperId),
  ]);
  const alerts = allAlerts.slice(0, 3);

  const topHives = await Promise.all(
    hives.slice(0, 3).map(async (hive) => ({
      hive,
      reading: await getLatestSensorReading(hive.id),
      estimatedYieldKg: (await getHiveYieldPrediction(hive.id))?.predictedYieldKg,
    }))
  );

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
        <KpiCard label="Total Honey Batches" value={kpis.totalBatches} icon={Package} />
      </div>

      {hives.length > 0 && <NextYieldForecast forecast={forecast} />}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Your Bee Hives</h2>
          {hives.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/beekeeper/hives">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
        {topHives.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No hives registered yet.</p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/beekeeper/hives/new">
                <Plus className="size-4" /> Register your first hive
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topHives.map(({ hive, reading, estimatedYieldKg }) => (
              <HiveCard key={hive.id} hive={hive} reading={reading} estimatedYieldKg={estimatedYieldKg} />
            ))}
          </div>
        )}
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
