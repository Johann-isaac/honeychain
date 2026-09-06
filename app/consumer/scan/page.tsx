"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/consumer/qr-scanner";

export default function ScanPage() {
  const router = useRouter();
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center">
      <h1 className="font-display text-2xl">Scan a Batch QR Code</h1>
      <p className="text-sm text-muted-foreground">Use your device camera to scan the QR code printed on a HoneyChain honey jar.</p>
      <QrScanner />
      <button onClick={() => router.push("/consumer")} className="text-xs text-muted-foreground underline underline-offset-2">
        Enter Batch ID manually instead
      </button>
    </div>
  );
}
