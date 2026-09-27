import type { Metadata } from "next";
import { ShieldCheck, Radio, FileCheck2 } from "lucide-react";
import { VerifyQuickForm } from "@/components/landing/verify-quick-form";
import { QrScanner } from "@/components/consumer/qr-scanner";
import { HoneyJarIllustration } from "@/components/landing/honey-jar-illustration";

export const metadata: Metadata = {
  title: "Verify your honey",
  description:
    "Enter the batch identifier printed on your jar, or scan its QR code, to see the hive it came from and its ledger record.",
};

const assurances = [
  { icon: Radio, label: "Hive conditions recorded at harvest" },
  { icon: FileCheck2, label: "Batch details registered on the ledger" },
  { icon: ShieldCheck, label: "Producer identity independently listed" },
];

export default function ConsumerHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 px-5 py-16 text-center sm:py-24">
      <HoneyJarIllustration className="h-auto w-36" />

      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-honey/40 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
          <ShieldCheck className="size-3.5" /> No account required
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Verify your honey</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
          Enter the batch identifier printed on your jar, or scan its QR code, to see the full hive-to-jar
          journey behind it.
        </p>
      </div>

      <div className="w-full">
        <VerifyQuickForm />
        <p className="mt-2.5 text-xs text-muted-foreground">Batch identifiers look like HC-2026-359938 and are printed next to the QR code.</p>
      </div>

      <div className="flex w-full items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <QrScanner />

      <ul className="mt-2 grid w-full gap-3 border-t border-border pt-8 text-left sm:grid-cols-3">
        {assurances.map((item) => (
          <li key={item.label} className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <item.icon className="size-4 text-nature" />
            <span className="text-xs leading-relaxed text-muted-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
