import type { Metadata } from "next";
import { BellOff } from "lucide-react";
import { AlertItem } from "@/components/hive/alert-item";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { getAlertsForBeekeeper, getHivesByBeekeeper } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export const metadata: Metadata = { title: "Alerts" };

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const beekeeperId = await getCurrentBeekeeperId();
  const [alerts, hives] = await Promise.all([getAlertsForBeekeeper(beekeeperId), getHivesByBeekeeper(beekeeperId)]);

  return (
    <div>
      <PageHeader
        title="Alerts & recommendations"
        description="Flags raised by AI-assisted monitoring of your sensor data. Always confirm with a manual inspection before acting."
      />

      {alerts.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No active alerts"
          description="All monitored hives are reporting within their expected ranges."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} hive={hives.find((h) => h.id === alert.hiveId)} />
          ))}
        </div>
      )}
    </div>
  );
}
