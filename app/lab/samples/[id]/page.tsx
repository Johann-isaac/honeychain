import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestingWorkspace } from "@/components/lab/testing-workspace";
import { formatDate } from "@/lib/utils";
import {
  getBatchById,
  getBeekeeperById,
  getBlockchainRecordsByBatch,
  getHiveHealth,
  getHiveById,
  getLabReportBySample,
  getLabSampleById,
  getLabTestsBySample,
  getTestTemplates,
} from "@/lib/db";

export default async function SampleDetailPage({ params }: PageProps<"/lab/samples/[id]">) {
  const { id } = await params;
  const sample = getLabSampleById(id);
  if (!sample) notFound();

  const batch = getBatchById(sample.batchId);
  if (!batch) notFound();
  const hive = getHiveById(batch.hiveId);
  const beekeeper = getBeekeeperById(batch.beekeeperId);
  const health = hive ? getHiveHealth(hive.id) : undefined;
  const tests = getLabTestsBySample(id);
  const report = getLabReportBySample(id) ?? null;
  const blockchain = getBlockchainRecordsByBatch(batch.id)[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">Sample</p>
          <h1 className="font-display text-2xl">{batch.batchCode}</h1>
        </div>
        <Badge variant={sample.status === "COMPLETED" ? "success" : "warning"}>{sample.status.replace(/_/g, " ")}</Badge>
      </div>

      <Card className="border-nature/30 bg-nature/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="size-4 text-nature" /> Origin Data Submitted by Beekeeper
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Batch ID" value={batch.batchCode} />
          <Field label="Beekeeper ID" value={beekeeper?.beekeeperCode ?? "—"} />
          <Field label="Hive ID" value={hive?.hiveCode ?? "—"} />
          <Field label="Hive Location" value={hive?.location ?? "—"} />
          <Field label="Harvest Date" value={formatDate(batch.harvestDate)} />
          <Field label="Harvest Quantity" value={`${batch.quantity} kg`} />
          <Field label="Honey Type" value={batch.honeyType} />
          <Field label="Floral Source" value={batch.floralSource} />
          <Field label="AI Hive Health Score" value={health ? `${health.healthScore} / 100` : "—"} />
          <Field label="Env. Temperature" value={`${batch.envSnapshot.temperature}°C`} />
          <Field label="Env. Humidity" value={`${batch.envSnapshot.humidity}%`} />
          <Field label="Env. Hive Weight" value={`${batch.envSnapshot.hiveWeight} kg`} />
        </CardContent>
      </Card>

      <TestingWorkspace
        sampleId={sample.id}
        batchId={batch.id}
        batchCode={batch.batchCode}
        templates={getTestTemplates()}
        initialTests={tests}
        initialReport={report}
        initialBlockchain={blockchain}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
