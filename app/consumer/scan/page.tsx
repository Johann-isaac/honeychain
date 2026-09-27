import type { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { QrScanner } from "@/components/consumer/qr-scanner";

export const metadata: Metadata = {
  title: "Scan a batch QR code",
  description: "Use your device camera to scan the QR code printed on a HoneyChain jar and open its batch record.",
};

export default function ScanPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-7 px-5 py-16 text-center sm:py-24">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-honey-dark dark:text-honey">
        <QrCode className="size-7" />
      </span>
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Scan a batch QR code</h1>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted-foreground">
          Point your camera at the QR code printed on the jar. The batch record opens as soon as it is read.
        </p>
      </div>

      <QrScanner />

      <p className="text-sm text-muted-foreground">
        No camera handy?{" "}
        <Link href="/consumer" className="font-medium text-foreground underline underline-offset-4">
          Enter the batch identifier instead
        </Link>
      </p>
    </div>
  );
}
