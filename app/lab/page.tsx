import Link from "next/link";
import { Inbox, CheckCircle2, ThumbsUp, ThumbsDown, Gauge, ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SamplesTable } from "@/components/lab/samples-table";
import { Button } from "@/components/ui/button";
import { getEnrichedLabSamples, getLabDashboard, labProfile } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function LabDashboard() {
  const kpis = getLabDashboard();
  const pending = getEnrichedLabSamples().filter((s) => s.status !== "COMPLETED").slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Laboratory Quality Control</h1>
        <p className="text-sm text-muted-foreground">
          Laboratory ID: <span className="font-medium text-foreground">{labProfile.laboratoryId}</span> · {labProfile.name}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Pending Samples" value={kpis.pendingSamples} icon={Inbox} tone="warning" />
        <KpiCard label="Tests Completed" value={kpis.testsCompleted} icon={CheckCircle2} />
        <KpiCard label="Passed" value={kpis.passed} icon={ThumbsUp} tone="success" />
        <KpiCard label="Failed" value={kpis.failed} icon={ThumbsDown} tone="destructive" />
        <KpiCard label="Avg Quality Score" value={kpis.avgQualityScore} suffix="%" decimals={1} icon={Gauge} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Pending Honey Samples</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/lab/samples">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <SamplesTable samples={pending} emptyLabel="No pending samples right now." />
      </section>
    </div>
  );
}
