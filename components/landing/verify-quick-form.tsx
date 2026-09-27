"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VerifyQuickForm({
  placeholder = "HC-2026-359938",
  // Set when the form sits on the dark CTA panel. The default `.input` uses
  // the card colour, which is near-invisible against charcoal in dark mode,
  // so the field switches to a translucent treatment instead. The button
  // keeps its honey fill, which already reads well on a dark ground.
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
        <ScanLine
          className={cn(
            "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2",
            onAccent ? "text-cream/50" : "text-muted-foreground"
          )}
        />
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
          className={cn(
            "input h-11 pl-10",
            onAccent &&
              "border-cream/20 bg-cream/10 text-cream placeholder:text-cream/45 hover:border-cream/35 focus:border-honey"
          )}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="shrink-0"
      >
        Verify <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
