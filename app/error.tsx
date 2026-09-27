"use client"; // Error boundaries must be Client Components

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-honeycomb px-5 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
        We hit an unexpected error loading this page. Trying again usually resolves it — if it keeps happening,
        the details below help us track it down.
      </p>
      {error.digest && <p className="mt-4 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={retry} size="lg">
          <RotateCw className="size-4" /> Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
