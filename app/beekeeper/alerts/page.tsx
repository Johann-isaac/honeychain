import { AlertItem } from "@/components/hive/alert-item";
import { getDefaultBeekeeperId, getAlertsForBeekeeper, getHivesByBeekeeper } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const beekeeperId = await getDefaultBeekeeperId();
  const [alerts, hives] = await Promise.all([getAlertsForBeekeeper(beekeeperId), getHivesByBeekeeper(beekeeperId)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Alerts &amp; Recommendations</h1>
        <p className="text-sm text-muted-foreground">AI-assisted monitoring flags — always confirm with a manual inspection.</p>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No active alerts. All monitored hives are within expected ranges.
          </p>
        ) : (
          alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} hive={hives.find((h) => h.id === alert.hiveId)} />
          ))
        )}
      </div>
    </div>
  );
}
