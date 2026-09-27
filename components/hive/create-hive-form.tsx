"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

function CopyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-center justify-center gap-2">
        <p className={mono ? "break-all font-mono text-sm" : "font-display text-3xl tracking-wide"}>{value}</p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Copy ${label}`}
        >
          <Copy className="size-4" />
        </button>
      </div>
      {copied && <p className="mt-1 text-xs text-success">Copied</p>}
    </div>
  );
}

export function CreateHiveForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<{ id: string; hiveCode: string; deviceSecret: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/hives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to register hive.");
      setCreated({ ...data.hive, deviceSecret: data.deviceSecret });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register hive.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardContent className="space-y-5 p-6 text-center">
          <CheckCircle2 className="mx-auto size-8 text-success" />
          <p className="text-sm font-medium text-success">Hive registered</p>

          <CopyField label="Hive ID — flash this into the ESP32's HIVE_ID constant" value={created.hiveCode} />

          <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
            <div className="flex items-center justify-center gap-1.5 text-warning">
              <ShieldAlert className="size-4" />
              <p className="text-xs font-semibold">Shown only once — save it now</p>
            </div>
            <div className="mt-3">
              <CopyField label="Device Secret — flash this into DEVICE_SECRET" value={created.deviceSecret} mono />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              This is this hive&apos;s only credential — it&apos;s what lets its ESP32 (and no one else&apos;s) post
              readings under this Hive ID. It won&apos;t be shown again; if you lose it, remove the hive and register
              a new one.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            This hive won&apos;t show sensor data until its ESP32 sends its first reading to <code className="rounded bg-muted px-1 py-0.5">/api/hive-data</code>.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/beekeeper/hives")}>
              Back to Hives
            </Button>
            <Button onClick={() => router.push(`/beekeeper/hives/${created.id}`)}>View Hive</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Hive Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-xs font-medium text-muted-foreground">
            Hive Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Backyard Hive"
              className="input mt-1"
              required
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Coimbatore North Apiary"
              className="input mt-1"
              required
            />
          </label>

          {error && <FormMessage>{error}</FormMessage>}

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Registering…" : "Register Hive"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
