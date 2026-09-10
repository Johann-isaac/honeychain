import Link from "next/link";
import { BadgeCheck, Clock, MapPin, ShieldCheck, ShieldX, Thermometer, Droplets, Scale, Activity, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoneycombLogo } from "@/components/honeycomb-logo";
import { BlockchainProof } from "@/components/blockchain/blockchain-proof";
import { TraceabilityTimeline } from "@/components/consumer/traceability-timeline";
import { formatDate } from "@/lib/utils";
import { getPublicVerification } from "@/lib/db";

export default async function VerifyPage({ params }: PageProps<"/verify/[batchId]">) {
  const { batchId } = await params;
  const result = await getPublicVerification(batchId);

  return (
    <div className="min-h-screen bg-honeycomb">
      <header className="flex items-center justify-between border-b border-border bg-card/80 px-5 py-4 backdrop-blur sm:px-8">
        <Link href="/consumer" className="flex items-center gap-2">
          <HoneycombLogo className="size-7" />
          <span className="font-display text-lg">HoneyChain</span>
        </Link>
        <Link href="/consumer" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Verify another batch
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        {!result.found ? (
          <NotFoundState batchId={batchId} />
        ) : (
          <VerifiedContent result={result} />
        )}
      </main>
    </div>
  );
}

function NotFoundState({ batchId }: { batchId: string }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <ShieldX className="size-10 text-destructive" />
        <h1 className="font-display text-xl">Batch Not Found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t verify this batch. Please check the Batch ID or scan the QR code again.
        </p>
        <p className="font-mono text-xs text-muted-foreground">Searched for: {batchId}</p>
        <Link href="/consumer" className="mt-2 text-sm font-medium text-honey-dark underline underline-offset-2">
          Try another Batch ID
        </Link>
      </CardContent>
    </Card>
  );
}

type VerificationResult = Extract<Awaited<ReturnType<typeof getPublicVerification>>, { found: true }>;

function VerifiedContent({ result }: { result: VerificationResult }) {
  const { batch, hive, beekeeper, blockchain, timeline, isVerified } = result;

  const statusMeta = isVerified
    ? { label: "Honey Verified ✓", icon: ShieldCheck, tone: "success" as const, sub: "This batch is fully verified on the HoneyChain ledger." }
    : batch.status === "REGISTRATION_FAILED"
      ? { label: "Verification Failed", icon: ShieldX, tone: "destructive" as const, sub: "This batch could not be registered on the blockchain and is not verified." }
      : { label: "Verification In Progress", icon: Clock, tone: "warning" as const, sub: "This batch is still being registered on the blockchain." };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <statusMeta.icon
          className={`mx-auto size-12 ${statusMeta.tone === "success" ? "text-success" : statusMeta.tone === "destructive" ? "text-destructive" : "text-warning"}`}
        />
        <h1 className="mt-3 font-display text-2xl">{statusMeta.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{statusMeta.sub}</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs text-muted-foreground">HoneyChain Verified Batch</p>
            <p className="font-mono text-lg font-semibold">{batch.batchCode}</p>
          </div>
          <Badge variant={statusMeta.tone}>{isVerified ? "🟢 VERIFIED" : statusMeta.tone === "destructive" ? "🔴 NOT VERIFIED" : "🟡 PENDING"}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-honey-dark" /> From the Hive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Beekeeper</p>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Field label="Beekeeper ID" value={beekeeper.beekeeperCode} />
              <Field label="Name" value={beekeeper.name} />
              <Field label="Region" value={beekeeper.region} />
              <Field label="Status" value={beekeeper.registrationStatus} />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Hive</p>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Field label="Hive ID" value={hive.hiveCode} />
              <Field label="Name" value={hive.name} />
              <Field label="Region" value={hive.region} />
              <Field label="Harvest Date" value={formatDate(batch.harvestDate)} />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Hive Conditions at Harvest</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ConditionTile icon={Thermometer} value={`${hive.harvestConditions.temperature}°C`} label="Temperature" />
              <ConditionTile icon={Droplets} value={`${hive.harvestConditions.humidity}%`} label="Humidity" />
              <ConditionTile icon={Scale} value={`${hive.harvestConditions.hiveWeight} kg`} label="Hive Weight" />
              <ConditionTile icon={Activity} value={hive.harvestConditions.beeActivity} label="Bee Activity" />
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent p-3 text-sm">
              <Sparkles className="size-4 text-honey-dark" />
              AI Health Score at harvest: <b>{hive.harvestConditions.aiHealthScore} / 100</b>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-4 text-honey-dark" /> Honey Batch Data
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Batch ID" value={batch.batchCode} />
          <Field label="Quantity at Harvest" value={`${batch.quantity} kg`} />
          <Field label="Honey Type" value={batch.honeyType} />
          <Field label="Floral Source" value={batch.floralSource} />
          <Field label="Processing Method" value={batch.extractionMethod} />
          <Field label="Storage Conditions" value={`${batch.storageTemperature}°C · ${batch.storageLocation}`} />
        </CardContent>
      </Card>

      <BlockchainProof record={blockchain} />

      <TraceabilityTimeline events={timeline} />
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

function ConditionTile({ icon: Icon, value, label }: { icon: typeof Thermometer; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-muted p-3 text-center">
      <Icon className="mx-auto size-4 text-nature" />
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
