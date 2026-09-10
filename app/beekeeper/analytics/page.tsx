import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDefaultBeekeeperId, getHiveHealth, getHivesByBeekeeper } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function HiveAnalyticsPage() {
  const beekeeperId = await getDefaultBeekeeperId();
  const hives = await getHivesByBeekeeper(beekeeperId);
  const entries = await Promise.all(hives.map(async (hive) => ({ hive, health: await getHiveHealth(hive.id) })));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Hive Analytics</h1>
        <p className="text-sm text-muted-foreground">AI-assisted health scoring across every monitored hive.</p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No hives registered yet. Add your first hive from the My Hives page.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(({ hive, health }) => {
            if (!health) return null;
            return (
              <Link key={hive.id} href={`/beekeeper/hives/${hive.id}`}>
                <Card className="h-full transition-transform hover:-translate-y-0.5 hover:border-honey/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{hive.hiveCode}</p>
                        <p className="font-semibold">{hive.name}</p>
                      </div>
                      <Badge variant={health.riskLevel === "LOW" ? "success" : health.riskLevel === "MODERATE" ? "warning" : "destructive"}>
                        <Sparkles className="size-3" /> {health.healthScore}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      {(Object.entries(health.breakdown) as [string, number][]).slice(0, 3).map(([k, v]) => (
                        <div key={k}>
                          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                            <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                            <span>{v}%</span>
                          </div>
                          <Progress value={v} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
