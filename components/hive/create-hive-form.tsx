"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CreateHiveForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<{ id: string; hiveCode: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

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
      setCreated(data.hive);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register hive.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardContent className="space-y-4 p-6 text-center">
          <CheckCircle2 className="mx-auto size-8 text-success" />
          <p className="text-sm font-medium text-success">Hive registered</p>
          <div>
            <p className="text-xs text-muted-foreground">Hive ID — flash this into the ESP32&apos;s HIVE_ID constant</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <p className="font-display text-3xl tracking-wide">{created.hiveCode}</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(created.hiveCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Copy hive ID"
              >
                <Copy className="size-4" />
              </button>
            </div>
            {copied && <p className="mt-1 text-xs text-success">Copied</p>}
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Registering…" : "Register Hive"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
