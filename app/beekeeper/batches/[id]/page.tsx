import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchStatusBadge } from "@/components/batch/batch-status-badge";
import { QrPanel } from "@/components/qr/qr-panel";
import { BlockchainProof } from "@/components/blockchain/blockchain-proof";
import { formatDate } from "@/lib/utils";
import { getBatchById, getBlockchainRecordsByBatch, getHiveById } from "@/lib/db";

export default async function BatchDetailPage({ params }: PageProps<"/beekeeper/batches/[id]">) {
  const { id } = await params;
  const batch = getBatchById(id);
  if (!batch) notFound();

  const hive = getHiveById(batch.hiveId);
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

      {batch.status === "REGISTRATION_FAILED" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Blockchain registration failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We couldn&apos;t register this batch on the blockchain. This is a demo network issue — try creating the batch again.
              </p>
            </div>
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
