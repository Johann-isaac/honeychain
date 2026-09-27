"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VerifyQuickForm({
  placeholder = "HC-2026-359938",
  // The default honey-filled button disappears when this form sits on the
  // honey CTA panel, so that caller asks for the inverted treatment.
  onAccent = false,
}: {
  placeholder?: string;
  onAccent?: boolean;
}) {
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
        <label htmlFor="batch-code" className="sr-only">
          Batch identifier
        </label>
        <input
          id="batch-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`Enter batch ID (e.g. ${placeholder})`}
          autoCapitalize="characters"
          spellCheck={false}
          className="input h-11 pl-10"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className={cn("shrink-0", onAccent && "bg-charcoal text-cream shadow-sm hover:bg-charcoal/85")}
      >
        Verify <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
