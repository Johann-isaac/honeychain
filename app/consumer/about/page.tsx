import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Fingerprint, Eye, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About verification",
  description:
    "How HoneyChain records a batch of honey — from hive sensors and harvest details to a tamper-evident ledger entry anyone can check.",
};

const points = [
  {
    icon: ShieldCheck,
    title: "Tamper-evident records",
    desc: "A batch record is hashed when it is registered. Altering it afterwards breaks that hash, so silent edits do not go unnoticed.",
  },
  {
    icon: Fingerprint,
    title: "Batch-level traceability",
    desc: "Every jar links back to one specific hive, one harvest date and one registered beekeeper — not to a brand in general.",
  },
  {
    icon: Eye,
    title: "Transparent provenance",
    desc: "Hive conditions at harvest, floral source, extraction method and storage are all published with the batch.",
  },
  {
    icon: Users,
    title: "Checks you run yourself",
    desc: "Verification needs no account and no cooperation from the seller. The record is the same one the producer sees.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-honey-dark dark:text-honey">
        About the platform
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        What HoneyChain verification actually proves
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        HoneyChain records honey traceability end to end — from continuous hive monitoring and harvest logging,
        to a ledger-anchored record any buyer can verify without going through the producer.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {points.map((point) => (
          <article key={point.title} className="rounded-2xl border border-border bg-card p-6 card-shadow">
            <span className="flex size-10 items-center justify-center rounded-xl bg-nature/12 text-nature">
              <point.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold">{point.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.desc}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-muted/60 p-6">
        <h2 className="text-sm font-semibold">A note on the ledger</h2>
        {/* lib/blockchainService.ts is a deterministic mock behind a provider
            interface. Saying so plainly is the whole point of a traceability
            product — the alternative would undercut the claim it makes. */}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Batch records are currently anchored on a simulated network while the production chain integration is
          finalised. Records written to it are hashed and verified exactly as they will be on a live chain, and
          every batch page labels its ledger entry so you always know which network backs it.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/consumer">
            Verify a batch <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/beekeeper">I am a beekeeper</Link>
        </Button>
      </div>
    </div>
  );
}
