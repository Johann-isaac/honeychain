import { ShieldCheck } from "lucide-react";
import { VerifyQuickForm } from "@/components/landing/verify-quick-form";
import { QrScanner } from "@/components/consumer/qr-scanner";
import { HoneyJarIllustration } from "@/components/landing/honey-jar-illustration";

export default function ConsumerHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-5 py-16 text-center">
      <HoneyJarIllustration className="h-auto w-40" />
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-honey/40 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <ShieldCheck className="size-3.5" /> No login required
        </span>
        <h1 className="mt-4 font-display text-3xl">Verify Your Honey</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the Batch ID printed on your jar, or scan the QR code, to see its full hive-to-jar journey.
        </p>
      </div>

      <VerifyQuickForm />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <QrScanner />

      <p className="text-xs text-muted-foreground">
        Try the flagship batch: <code className="rounded bg-muted px-1.5 py-0.5">HC-2026-00982</code>
      </p>
    </div>
  );
}
