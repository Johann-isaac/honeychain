import Link from "next/link";
import { Hexagon, ShieldCheck, AlertTriangle, Droplet, CalendarClock, Package, ArrowRight, Plus, BellOff } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { HiveCard } from "@/components/hive/hive-card";
import { AlertItem } from "@/components/hive/alert-item";
import { NextYieldForecast } from "@/components/dashboard/next-yield-forecast";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentBeekeeperId } from "@/lib/auth";
import {
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
  const beekeeperId = await getCurrentBeekeeperId();
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
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description={
          <>
            {beekeeper.beekeeperCode} · {beekeeper.region} — here is how your apiary is doing today.
          </>
        }
        actions={
          <Button asChild>
            <Link href="/beekeeper/batches/new">
              <Plus className="size-4" /> New batch
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Hives" value={kpis.totalHives} icon={Hexagon} />
        <KpiCard label="Healthy Hives" value={kpis.healthyHives} icon={ShieldCheck} tone="success" />
        <KpiCard label="Attention Required" value={kpis.attentionHives} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Est. Honey Yield" value={kpis.estimatedYieldKg} suffix=" kg" decimals={1} icon={Droplet} />
        <KpiCard label="Next Harvest" value={kpis.nextHarvestDays} suffix=" days" icon={CalendarClock} />
        <KpiCard label="Honey Batches" value={kpis.totalBatches} icon={Package} />
      </div>

      {hives.length > 0 && (
        <div className="mt-8">
          <NextYieldForecast forecast={forecast} />
        </div>
      )}

      <section className="mt-10">
        <SectionHeader
          title="Your bee hives"
          href={hives.length > 0 ? "/beekeeper/hives" : undefined}
          linkLabel="View all hives"
        />
        {topHives.length === 0 ? (
          <EmptyState
            icon={Hexagon}
            title="No hives registered yet"
            description="Register a hive to get its Hive ID for the ESP32 firmware and start collecting sensor data."
            action={
              <Button asChild>
                <Link href="/beekeeper/hives/new">
                  <Plus className="size-4" /> Register your first hive
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topHives.map(({ hive, reading, estimatedYieldKg }) => (
              <HiveCard key={hive.id} hive={hive} reading={reading} estimatedYieldKg={estimatedYieldKg} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHeader title="Alerts & recommendations" href="/beekeeper/alerts" linkLabel="View all alerts" />
        {alerts.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No active alerts"
            description="All monitored hives are reporting within their expected ranges."
          />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} hive={hives.find((h) => h.id === alert.hiveId)} readOnly />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      {href && (
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>
            {linkLabel} <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}
