"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerifyQuickForm({ placeholder = "HC-2026-00982" }: { placeholder?: string }) {
  const [code, setCode] = React.useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <ScanLine className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`Enter Batch ID (e.g. ${placeholder})`}
          className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none ring-primary/40 focus:ring-2"
        />
      </div>
      <Button type="submit" size="lg" className="h-11 shrink-0 rounded-full">
        Verify <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
