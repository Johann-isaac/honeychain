"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Hive } from "@/types";

const HONEY_TYPES = ["Multifloral Honey", "Eucalyptus Honey", "Wildflower Honey", "Forest Honey", "Nilgiri Honey"];
const EXTRACTION_METHODS = ["Cold Extraction (Unheated)", "Cold Extraction", "Hot Extraction"];

interface FieldState {
  hiveId: string;
  harvestDate: string;
  quantity: string;
  honeyType: string;
  floralSource: string;
  extractionMethod: string;
  storageTemperature: string;
  storageLocation: string;
}

export function CreateBatchForm({ hives }: { hives: Hive[] }) {
  const router = useRouter();
  const [fields, setFields] = React.useState<FieldState>({
    hiveId: hives[0]?.id ?? "",
    harvestDate: new Date().toISOString().slice(0, 10),
    quantity: "",
    honeyType: HONEY_TYPES[0],
    floralSource: "",
    extractionMethod: EXTRACTION_METHODS[0],
    storageTemperature: "23",
    storageLocation: "",
  });
  const [snapshot, setSnapshot] = React.useState<{ temperature: number; humidity: number; weight: number; healthScore: number } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdBatch, setCreatedBatch] = React.useState<{ id: string; batchCode: string } | null>(null);
  const [sendingToLab, setSendingToLab] = React.useState(false);

  const selectedHive = hives.find((h) => h.id === fields.hiveId);

  React.useEffect(() => {
    if (!fields.hiveId) return;
    let cancelled = false;
    fetch(`/api/hives/${fields.hiveId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSnapshot({
          temperature: data.latestReading?.temperature ?? 0,
          humidity: data.latestReading?.humidity ?? 0,
          weight: data.latestReading?.weight ?? 0,
          healthScore: data.health?.healthScore ?? 0,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [fields.hiveId]);

  function update<K extends keyof FieldState>(key: K, value: FieldState[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          quantity: Number(fields.quantity),
          storageTemperature: Number(fields.storageTemperature),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to create batch.");
      setCreatedBatch(data.batch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create batch.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendToLab() {
    if (!createdBatch) return;
    setSendingToLab(true);
    try {
      await fetch(`/api/batches/${createdBatch.id}/send-to-lab`, { method: "POST" });
      router.push(`/beekeeper/batches/${createdBatch.id}`);
    } finally {
      setSendingToLab(false);
    }
  }

  if (createdBatch) {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardContent className="space-y-4 p-6 text-center">
          <p className="text-sm font-medium text-success">Batch created successfully</p>
          <p className="font-display text-3xl">{createdBatch.batchCode}</p>
          <p className="text-sm text-muted-foreground">Send this batch to the laboratory to begin quality testing.</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push(`/beekeeper/batches/${createdBatch.id}`)}>
              View Batch
            </Button>
            <Button onClick={handleSendToLab} disabled={sendingToLab}>
              <Send className="size-4" /> {sendingToLab ? "Sending…" : "Send to Laboratory"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Batch Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hive">
              <select value={fields.hiveId} onChange={(e) => update("hiveId", e.target.value)} className="input" required>
                {hives.map((h) => (
                  <option key={h.id} value={h.id}>{h.hiveCode} · {h.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Harvest Date">
              <input type="date" value={fields.harvestDate} onChange={(e) => update("harvestDate", e.target.value)} className="input" required />
            </Field>
            <Field label="Harvest Quantity (kg)">
              <input type="number" step="0.1" min="0.1" value={fields.quantity} onChange={(e) => update("quantity", e.target.value)} className="input" required />
            </Field>
            <Field label="Honey Type">
              <select value={fields.honeyType} onChange={(e) => update("honeyType", e.target.value)} className="input">
                {HONEY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Floral Source">
              <input value={fields.floralSource} onChange={(e) => update("floralSource", e.target.value)} placeholder="e.g. Mixed wildflower" className="input" required />
            </Field>
            <Field label="Extraction Method">
              <select value={fields.extractionMethod} onChange={(e) => update("extractionMethod", e.target.value)} className="input">
                {EXTRACTION_METHODS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Storage Temperature (°C)">
              <input type="number" value={fields.storageTemperature} onChange={(e) => update("storageTemperature", e.target.value)} className="input" required />
            </Field>
            <Field label="Storage Location">
              <input value={fields.storageLocation} onChange={(e) => update("storageLocation", e.target.value)} placeholder="e.g. Coimbatore Central Store" className="input" required />
            </Field>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Creating…" : "Create Honey Batch"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-honey-dark" /> Environmental Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">Automatically captured from {selectedHive?.hiveCode ?? "the selected hive"}&apos;s latest sensor reading.</p>
          <SnapshotRow label="Temperature" value={snapshot ? `${snapshot.temperature}°C` : "—"} />
          <SnapshotRow label="Humidity" value={snapshot ? `${snapshot.humidity}%` : "—"} />
          <SnapshotRow label="Hive Weight" value={snapshot ? `${snapshot.weight} kg` : "—"} />
          <SnapshotRow label="AI Health Score" value={snapshot ? `${snapshot.healthScore} / 100` : "—"} />
        </CardContent>
      </Card>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
