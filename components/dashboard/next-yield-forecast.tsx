import Link from "next/link";
import { TrendingUp, CalendarClock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, daysUntil } from "@/lib/utils";
import type { YieldForecast } from "@/types";

export function NextYieldForecast({ forecast }: { forecast: YieldForecast }) {
  const { nextHarvest } = forecast;

  return (
    <Card className="border-nature/30 bg-nature/5">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-nature" /> Next Expected Yield
        </CardTitle>
        <Link href="/beekeeper/yield" className="flex items-center gap-1 text-xs font-medium text-nature hover:underline">
          Full forecast <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-4xl">
              {forecast.totalPredictedKg} <span className="text-lg text-muted-foreground">kg</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Predicted across all {forecast.perHive.length} hives at next harvest</p>
          </div>
          <div className="rounded-xl bg-card px-3 py-2 text-center">
            <p className="text-lg font-semibold">{forecast.averageConfidence}%</p>
            <p className="text-[10px] text-muted-foreground">Avg. confidence</p>
          </div>
        </div>

        {nextHarvest && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-card p-3 text-sm">
            <CalendarClock className="size-4 shrink-0 text-nature" />
            <span>
              Nearest harvest: <b>{nextHarvest.hiveCode} · {nextHarvest.hiveName}</b> — {nextHarvest.predictedYieldKg} kg expected{" "}
              {formatDate(nextHarvest.expectedHarvestDate)} ({daysUntil(nextHarvest.expectedHarvestDate)}d)
            </span>
          </div>
        )}

        {forecast.perHive.length > 0 && (
          <div className="mt-4 space-y-2">
            {forecast.perHive.slice(0, 4).map((h) => (
              <div key={h.hiveId} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 font-medium text-foreground">{h.hiveCode} · {h.hiveName}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-nature"
                    style={{ width: `${Math.min(100, (h.predictedYieldKg / (forecast.perHive[0]?.predictedYieldKg || 1)) * 100)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-muted-foreground">{h.predictedYieldKg} kg</span>
                <span className="w-20 shrink-0 text-right text-muted-foreground">{formatDate(h.expectedHarvestDate)}</span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-[10px] uppercase tracking-wide text-muted-foreground">
          AI-assisted prediction · not a guaranteed yield
        </p>
      </CardContent>
    </Card>
  );
}
