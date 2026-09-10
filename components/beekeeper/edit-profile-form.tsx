"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Beekeeper } from "@/types";

export function EditProfileForm({ beekeeper }: { beekeeper: Beekeeper }) {
  const router = useRouter();
  const [name, setName] = React.useState(beekeeper.name);
  const [region, setRegion] = React.useState(beekeeper.region);
  const [phone, setPhone] = React.useState(beekeeper.phone ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/beekeeper/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, region, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to update profile.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Region
            <input value={region} onChange={(e) => setRegion(e.target.value)} className="input mt-1" required />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1" placeholder="Optional" />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
            {saved && <p className="text-xs text-success">Saved</p>}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
