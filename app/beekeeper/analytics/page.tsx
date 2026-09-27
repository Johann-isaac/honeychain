import type { Metadata } from "next";
import Link from "next/link";
import { LineChart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { getHiveHealth, getHivesByBeekeeper } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export const metadata: Metadata = { title: "Hive Analytics" };

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function HiveAnalyticsPage() {
  const beekeeperId = await getCurrentBeekeeperId();
  const hives = await getHivesByBeekeeper(beekeeperId);
  const entries = await Promise.all(hives.map(async (hive) => ({ hive, health: await getHiveHealth(hive.id) })));

  return (
    <div>
      <PageHeader
        title="Hive analytics"
        description="AI-assisted health scoring across every monitored hive. Open a hive to see its full sensor history."
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="Nothing to analyse yet"
          description="Health scores appear once you have registered a hive and it has started reporting sensor data."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(({ hive, health }) => {
            if (!health) return null;
            return (
              <Link key={hive.id} href={`/beekeeper/hives/${hive.id}`} className="block">
                <Card className="hover-lift h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">{hive.hiveCode}</p>
                        <p className="truncate font-semibold">{hive.name}</p>
                      </div>
                      <Badge
                        variant={
                          health.riskLevel === "LOW" ? "success" : health.riskLevel === "MODERATE" ? "warning" : "destructive"
                        }
                      >
                        <Sparkles className="size-3" /> {health.healthScore}
                      </Badge>
                    </div>
                    <div className="mt-5 space-y-2.5">
                      {(Object.entries(health.breakdown) as [string, number][]).slice(0, 3).map(([k, v]) => (
                        <div key={k}>
                          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                            <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                            <span className="font-medium text-foreground">{v}%</span>
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
