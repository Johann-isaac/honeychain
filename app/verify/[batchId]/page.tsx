import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock, MapPin, ShieldCheck, ShieldX, Thermometer, Droplets, Scale, Activity, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BlockchainProof } from "@/components/blockchain/blockchain-proof";
import { TraceabilityTimeline } from "@/components/consumer/traceability-timeline";
import { formatDate } from "@/lib/utils";
import { getPublicVerification } from "@/lib/db";

const links = [
  { label: "Verify honey", href: "/consumer" },
  { label: "Scan QR", href: "/consumer/scan" },
  { label: "About", href: "/consumer/about" },
];

export async function generateMetadata({ params }: PageProps<"/verify/[batchId]">): Promise<Metadata> {
  const { batchId } = await params;
  const result = await getPublicVerification(batchId);

  if (!result.found) {
    return { title: `Batch ${batchId} not found`, robots: { index: false, follow: true } };
  }

  return {
    title: `Batch ${result.batch.batchCode}`,
    description: `${result.batch.honeyType} honey harvested ${formatDate(result.batch.harvestDate)} from ${result.hive.region}, traced to hive ${result.hive.hiveCode}.`,
  };
}

export default async function VerifyPage({ params }: PageProps<"/verify/[batchId]">) {
  const { batchId } = await params;
  const result = await getPublicVerification(batchId);

  return (
    <div className="flex min-h-screen flex-col bg-honeycomb">
      <SiteHeader links={links} />

      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {!result.found ? <NotFoundState batchId={batchId} /> : <VerifiedContent result={result} />}
      </main>

      <SiteFooter />
    </div>
  );
}

function NotFoundState({ batchId }: { batchId: string }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX className="size-6" />
        </span>
        <h1 className="mt-2 font-display text-xl font-semibold">No record for this batch</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Nothing on the ledger matches this identifier. Check the code printed on the jar for typos — an O for a
          zero is the usual culprit — or scan its QR code instead.
        </p>
        <p className="mt-1 rounded-lg bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">{batchId}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/consumer">Try another identifier</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/consumer/scan">Scan the QR code</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type VerificationResult = Extract<Awaited<ReturnType<typeof getPublicVerification>>, { found: true }>;

function VerifiedContent({ result }: { result: VerificationResult }) {
  const { batch, hive, beekeeper, blockchain, timeline, isVerified } = result;

  const statusMeta = isVerified
    ? {
        label: "Honey verified",
        badge: "Verified",
        icon: ShieldCheck,
        tone: "success" as const,
        sub: "This batch is registered on the HoneyChain ledger and its record matches.",
      }
    : batch.status === "REGISTRATION_FAILED"
      ? {
          label: "Not verified",
          badge: "Not verified",
          icon: ShieldX,
          tone: "destructive" as const,
          sub: "This batch could not be registered on the ledger, so its origin cannot be confirmed here.",
        }
      : {
          label: "Verification in progress",
          badge: "Pending",
          icon: Clock,
          tone: "warning" as const,
          sub: "This batch is still being registered on the ledger. Check again shortly.",
        };

  const toneText =
    statusMeta.tone === "success" ? "text-success" : statusMeta.tone === "destructive" ? "text-destructive" : "text-warning";
  const toneBg =
    statusMeta.tone === "success" ? "bg-success/10" : statusMeta.tone === "destructive" ? "bg-destructive/10" : "bg-warning/10";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className={`mx-auto flex size-16 items-center justify-center rounded-2xl ${toneBg} ${toneText}`}>
          <statusMeta.icon className="size-8" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{statusMeta.label}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{statusMeta.sub}</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Batch identifier</p>
            <p className="mt-0.5 font-mono text-lg font-semibold">{batch.batchCode}</p>
          </div>
          <Badge variant={statusMeta.tone}>
            <span className={`size-1.5 rounded-full ${statusMeta.tone === "success" ? "bg-success" : statusMeta.tone === "destructive" ? "bg-destructive" : "bg-warning"}`} />
            {statusMeta.badge}
          </Badge>
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
          {hive.snapshotUrl && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Hive Camera</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL */}
              <img
                src={hive.snapshotUrl}
                alt={`Photo of ${hive.name}`}
                className="w-full rounded-xl border border-border object-cover"
              />
              {hive.snapshotAt && (
                <p className="mt-1 text-[11px] text-muted-foreground">Captured {formatDate(hive.snapshotAt)}</p>
              )}
            </div>
          )}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Hive Conditions at Harvest</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ConditionTile icon={Thermometer} value={hive.harvestConditions.temperature !== null ? `${hive.harvestConditions.temperature}°C` : "No data"} label="Temperature" />
              <ConditionTile icon={Droplets} value={hive.harvestConditions.humidity !== null ? `${hive.harvestConditions.humidity}%` : "No data"} label="Humidity" />
              <ConditionTile icon={Scale} value={hive.harvestConditions.hiveWeight !== null ? `${hive.harvestConditions.hiveWeight} kg` : "No data"} label="Hive Weight" />
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
