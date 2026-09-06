import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchStatusBadge } from "@/components/batch/batch-status-badge";
import { SendToLabButton } from "@/components/batch/send-to-lab-button";
import { QrPanel } from "@/components/qr/qr-panel";
import { BlockchainProof } from "@/components/blockchain/blockchain-proof";
import { formatDate } from "@/lib/utils";
import { getBatchById, getBlockchainRecordsByBatch, getHiveById, getLabReportByBatch, getLabSampleByBatchId } from "@/lib/db";

export default async function BatchDetailPage({ params }: PageProps<"/beekeeper/batches/[id]">) {
  const { id } = await params;
  const batch = getBatchById(id);
  if (!batch) notFound();

  const hive = getHiveById(batch.hiveId);
  const sample = getLabSampleByBatchId(batch.id);
  const report = getLabReportByBatch(batch.id);
  const blockchain = getBlockchainRecordsByBatch(batch.id)[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">Batch</p>
          <h1 className="font-display text-2xl">{batch.batchCode}</h1>
        </div>
        <BatchStatusBadge status={batch.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Info label="Hive" value={hive?.hiveCode ?? "—"} />
            <Info label="Harvest Date" value={formatDate(batch.harvestDate)} />
            <Info label="Quantity" value={`${batch.quantity} kg`} />
            <Info label="Honey Type" value={batch.honeyType} />
            <Info label="Floral Source" value={batch.floralSource} />
            <Info label="Extraction" value={batch.extractionMethod} />
            <Info label="Storage Temp" value={`${batch.storageTemperature}°C`} />
            <Info label="Storage Location" value={batch.storageLocation} />
            {batch.moisture !== undefined && <Info label="Moisture" value={`${batch.moisture}%`} />}
            {batch.ph !== undefined && <Info label="pH" value={`${batch.ph}`} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Environmental Snapshot at Harvest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Info label="Temperature" value={`${batch.envSnapshot.temperature}°C`} />
            <Info label="Humidity" value={`${batch.envSnapshot.humidity}%`} />
            <Info label="Hive Weight" value={`${batch.envSnapshot.hiveWeight} kg`} />
            <Info label="AI Health Score" value={`${batch.envSnapshot.aiHealthScore} / 100`} />
          </CardContent>
        </Card>
      </div>

      {batch.status === "DRAFT" && (
        <Card className="border-honey/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm">This batch has not been sent to the laboratory yet.</p>
            <SendToLabButton batchId={batch.id} />
          </CardContent>
        </Card>
      )}

      {sample && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Laboratory Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sample status: <span className="font-medium text-foreground">{sample.status.replace(/_/g, " ")}</span>
            {report && (
              <p className="mt-1">
                Result: <span className="font-medium text-foreground">{report.overallResult}</span> · Grade {report.qualityGrade} · Score {report.qualityScore}/100
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {batch.status === "BLOCKCHAIN_REGISTERED" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <BlockchainProof record={blockchain} />
          <QrPanel batchId={batch.id} batchCode={batch.batchCode} />
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
