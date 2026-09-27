import Link from "next/link";
import { Compass, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoneycombLogo } from "@/components/honeycomb-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-honeycomb px-5 py-16 text-center">
      <Link href="/" className="flex items-center gap-2.5" aria-label="HoneyChain home">
        <HoneycombLogo className="size-8" />
        <span className="font-display text-xl font-semibold">HoneyChain</span>
      </Link>

      <span className="mt-12 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Compass className="size-7" />
      </span>
      <p className="mt-6 font-display text-5xl font-semibold text-honey-dark dark:text-honey">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
      <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
        The link may be out of date. If you were trying to check a jar of honey, verify it by its batch
        identifier instead.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/consumer">
            <ScanLine className="size-4" /> Verify a batch
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
