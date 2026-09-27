import Link from "next/link";
import {
  ArrowRight,
  Radio,
  Link2,
  ScanLine,
  Sprout,
  ShieldCheck,
  Fingerprint,
  Eye,
  Users,
  Activity,
  Brain,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/animated-counter";
import { HoneyJarIllustration } from "@/components/landing/honey-jar-illustration";
import { VerifyQuickForm } from "@/components/landing/verify-quick-form";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPlatformStats } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per
// request rather than frozen at build time.
export const dynamic = "force-dynamic";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Platform", href: "#platform" },
  { label: "Why blockchain", href: "#why-blockchain" },
];

const steps = [
  {
    icon: Radio,
    title: "Hive monitoring",
    desc: "IoT sensors on each hive report temperature, humidity, weight and colony sound continuously.",
  },
  {
    icon: Sprout,
    title: "Harvest logging",
    desc: "Beekeepers record harvest quantity, floral source, extraction method and storage conditions.",
  },
  {
    icon: Link2,
    title: "Ledger registration",
    desc: "Each batch is hashed and anchored to a tamper-evident ledger the moment it is created.",
  },
  {
    icon: ScanLine,
    title: "Consumer verification",
    desc: "A QR code on the jar opens the batch's full origin record — no app and no login needed.",
  },
];

const platform = [
  {
    icon: Activity,
    title: "Live hive telemetry",
    desc: "Every reading from an ESP32 node is timestamped and charted, so conditions at harvest are a matter of record rather than recollection.",
  },
  {
    icon: Brain,
    title: "AI-assisted health scoring",
    desc: "Sensor trends are scored for colony risk and expected yield, with alerts that point to the hive that needs attention first.",
  },
  {
    icon: QrCode,
    title: "Batch certificates",
    desc: "Creating a batch generates its identifier, ledger record and printable QR code in one step, ready to go on the label.",
  },
];

const whyBlockchain = [
  {
    icon: ShieldCheck,
    title: "Tamper-evident records",
    desc: "Once a batch is registered, altering its record breaks the stored hash and the change becomes visible.",
  },
  {
    icon: Fingerprint,
    title: "Batch-level traceability",
    desc: "Every jar links back to one specific hive, harvest date and registered beekeeper.",
  },
  {
    icon: Eye,
    title: "Transparent provenance",
    desc: "The full hive-to-jar journey is published — not summarised into a logo on a label.",
  },
  {
    icon: Users,
    title: "Independent checks",
    desc: "Buyers, distributors and auditors verify a batch themselves, without asking the producer.",
  },
];

export default async function LandingPage() {
  const stats = await getPlatformStats();

  const statTiles = [
    { label: "Hives monitored", value: stats.activeHives },
    { label: "Batches registered", value: stats.totalBatches },
    { label: "Batches verified", value: stats.verifiedBatches },
    { label: "Beekeepers onboard", value: stats.beekeepersCount },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader links={navLinks} />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-honeycomb">
          {/* Warm light pooling behind the jar, clipped by the section so it
              never bleeds into the band below. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-honey/15 blur-3xl"
          />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-honey/40 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                <Link2 className="size-3.5" /> Blockchain-verified traceability
              </span>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.6rem]">
                From hive to home — honey you can actually verify.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                HoneyChain records the full digital journey of every batch — the beekeeper, the hive it came
                from, the conditions it was harvested in, and a ledger entry anyone can check.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/beekeeper">
                    Open beekeeper portal <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/consumer">Verify a batch</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-nature" /> No login needed to verify
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="size-3.5 text-nature" /> Live sensor data from every hive
                </span>
              </div>
            </div>

            <div className="relative mx-auto animate-fade-up [animation-delay:150ms]">
              <div aria-hidden className="absolute inset-8 -z-10 rounded-full bg-honey/20 blur-3xl" />
              <HoneyJarIllustration className="mx-auto h-auto w-60 sm:w-72 lg:w-80" />
            </div>
          </div>

          {/* Stats strip — the seam between the hero and the rest of the page. */}
          <div className="border-t border-border/70">
            <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/70 px-5 sm:px-8 lg:grid-cols-4">
              {statTiles.map((tile) => (
                <div key={tile.label} className="px-2 py-7 text-center first:pl-0 last:pr-0 lg:px-6">
                  <p className="font-display text-3xl font-semibold text-honey-dark dark:text-honey sm:text-4xl">
                    <AnimatedCounter value={tile.value} />
                  </p>
                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {tile.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-border bg-card py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Process"
              title="Four verifiable stages, apiary to kitchen table"
              subtitle="Each stage writes to the same batch record, so nothing depends on a claim made after the fact."
            />
            <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-8 hidden h-1 w-full lg:block"
                preserveAspectRatio="none"
              >
                <line
                  x1="12%"
                  y1="0"
                  x2="88%"
                  y2="0"
                  stroke="var(--color-honey)"
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  className="animate-flow-line"
                />
              </svg>
              {steps.map((step, i) => (
                <div key={step.title} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl border border-honey/30 bg-background shadow-sm">
                    <step.icon className="size-7 text-honey-dark" />
                    <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-sm">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform capabilities */}
        <section id="platform" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="For producers"
              title="The hive data behind every certificate"
              subtitle="The beekeeper portal is where the record is built — monitoring, analysis and batch registration in one place."
              align="left"
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {platform.map((item) => (
                <article key={item.title} className="rounded-2xl border border-border bg-card p-7 card-shadow">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-honey-dark dark:text-honey">
                    <item.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why blockchain */}
        <section id="why-blockchain" className="border-y border-border bg-card py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Why a ledger"
              title="Trust that does not rest on a promise"
              subtitle="A shared, verifiable record means no single party can quietly rewrite the story of a jar of honey."
              align="left"
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {whyBlockchain.map((item) => (
                <article key={item.title} className="rounded-2xl border border-border bg-background p-6">
                  <item.icon className="size-6 text-nature" />
                  <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Verification CTA */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid items-center gap-10 overflow-hidden rounded-3xl border border-honey/30 bg-gradient-to-br from-accent via-card to-card p-8 shadow-elevated sm:p-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Scan. Verify. Trust.
                </h2>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                  Every verified jar carries a unique QR code linking to its origin and ledger record. Enter a
                  batch identifier below to see exactly what a buyer sees.
                </p>
                <div className="mt-7">
                  <VerifyQuickForm />
                </div>
                <Link
                  href="/consumer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-honey-dark underline-offset-4 hover:underline dark:text-honey"
                >
                  Scan a QR code instead <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <HoneyJarIllustration className="mx-auto h-auto w-44 sm:w-56" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-honey-dark dark:text-honey">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}
