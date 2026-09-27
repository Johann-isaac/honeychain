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
import { SignalTicker } from "@/components/landing/signal-ticker";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPlatformStats } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per
// request rather than frozen at build time.
export const dynamic = "force-dynamic";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Platform", href: "#platform" },
  { label: "Why a ledger", href: "#why-blockchain" },
];

const steps = [
  {
    icon: Radio,
    title: "The hive reports itself",
    desc: "An ESP32 node on each hive sends temperature, humidity, weight and colony sound on a timer. A second board posts entrance photos. Nothing is typed in by hand.",
  },
  {
    icon: Sprout,
    title: "The harvest is logged",
    desc: "Quantity, floral source, extraction method and storage go on the record at harvest time — alongside the hive conditions the sensors captured that day.",
  },
  {
    icon: Link2,
    title: "The batch is sealed",
    desc: "Creating a batch hashes its contents and writes them to the ledger. From that moment, changing the record breaks the hash and the edit becomes visible.",
  },
  {
    icon: ScanLine,
    title: "Anyone can check it",
    desc: "The QR code on the jar opens the whole record — producer, hive, conditions, ledger entry. No app, no account, no asking the seller.",
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
    desc: "Sensor trends are scored for colony risk and expected yield, with alerts that point at the hive needing attention first.",
  },
  {
    icon: QrCode,
    title: "Batch certificates",
    desc: "Creating a batch generates its identifier, ledger record and printable QR code in one step, ready for the label.",
  },
];

const whyBlockchain = [
  {
    icon: ShieldCheck,
    title: "Tamper-evident",
    desc: "Alter a registered batch and its stored hash no longer matches. The change does not pass unnoticed.",
  },
  {
    icon: Fingerprint,
    title: "Batch-level",
    desc: "Every jar links to one specific hive, one harvest date, one registered producer — not to a brand in general.",
  },
  {
    icon: Eye,
    title: "Published, not summarised",
    desc: "Hive conditions, floral source, extraction and storage are all shown. Not compressed into a logo.",
  },
  {
    icon: Users,
    title: "Independently checkable",
    desc: "Buyers, distributors and auditors verify a batch themselves, without the producer's cooperation.",
  },
];

export default async function LandingPage() {
  const stats = await getPlatformStats();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader links={navLinks} />

      <main id="main" className="flex-1">
        {/* ---------------------------------------------------------------
            Hero — asymmetric on purpose. Type occupies the left seven
            columns and runs large; the right is a comb of hexagons rather
            than a single centred illustration.
        --------------------------------------------------------------- */}
        <section className="grain relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-48 size-[38rem] rounded-full bg-honey/15 blur-3xl"
          />

          <div className="relative z-[1] mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-12 lg:pb-24 lg:pt-16">
            <div className="lg:col-span-7">
              <span className="inline-flex -rotate-2 items-center gap-1.5 rounded-md border-2 border-charcoal/85 bg-honey px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal shadow-[3px_3px_0_0_var(--color-charcoal)] dark:border-cream/80 dark:shadow-[3px_3px_0_0_var(--color-cream)]">
                <Link2 className="size-3.5" /> Hive to jar, on the record
              </span>

              <h1 className="mt-7 font-display text-[2.7rem] font-semibold leading-[0.96] tracking-[-0.03em] sm:text-6xl lg:text-[4.4rem]">
                Honey you can
                <br />
                <span className="swash">actually</span> verify.
                <br />
                <span className="text-honey-dark dark:text-honey">Not just trust.</span>
              </h1>

              <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Every batch carries the hive it came from, the conditions it was harvested in, and a ledger
                entry anyone can check in seconds.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/beekeeper">
                    Open the portal <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/consumer">Verify a batch</Link>
                </Button>
              </div>
            </div>

            {/* Hexagon comb. The jar sits in the large cell; the three small
                cells carry the live counts, so the stats are part of the
                composition instead of a separate band of boxes. */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto grid max-w-sm grid-cols-3 gap-3">
                <div className="comb-lattice hex-v col-span-3 flex aspect-[6/5] items-center justify-center bg-accent/60 opacity-100">
                  <HoneyJarIllustration className="h-auto w-36 sm:w-44" />
                </div>

                {[
                  { label: "Hives", value: stats.activeHives },
                  { label: "Batches", value: stats.totalBatches },
                  { label: "Producers", value: stats.beekeepersCount },
                ].map((tile) => (
                  <div
                    key={tile.label}
                    className="hex-v flex aspect-[7/8] flex-col items-center justify-center bg-card shadow-sm"
                  >
                    <span className="font-display text-2xl font-semibold text-honey-dark dark:text-honey">
                      <AnimatedCounter value={tile.value} />
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {tile.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SignalTicker
          hives={stats.activeHives}
          batches={stats.totalBatches}
          beekeepers={stats.beekeepersCount}
        />

        {/* ---------------------------------------------------------------
            Process — offset rows with oversized numerals, rather than four
            identical columns. Each row steps further right on desktop.
        --------------------------------------------------------------- */}
        <section id="how-it-works" className="grain relative overflow-hidden py-20 sm:py-28">
          <div className="relative z-[1] mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <Eyebrow>The chain</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.05]">
                Four stages. Each one writes to the same record.
              </h2>
            </div>

            <ol className="mt-16 space-y-12 lg:space-y-6">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="grid gap-5 border-t border-border pt-8 lg:grid-cols-12 lg:items-start"
                  style={{ marginLeft: `calc(${i} * 2.2rem)` }}
                >
                  <div className="flex items-center gap-5 lg:col-span-4">
                    <span className="numeral shrink-0 text-6xl sm:text-7xl">{String(i + 1).padStart(2, "0")}</span>
                    <span className="hex flex size-12 shrink-0 items-center justify-center bg-accent text-honey-dark dark:text-honey">
                      <step.icon className="size-5" />
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold tracking-tight lg:col-span-3">{step.title}</h3>
                  <p className="max-w-xl leading-relaxed text-muted-foreground lg:col-span-5">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Platform */}
        <section id="platform" className="border-y border-border bg-card py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <Eyebrow>For producers</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.05]">
                The hive data behind every certificate.
              </h2>
            </div>

            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-3">
              {platform.map((item) => (
                <article key={item.title} className="group bg-background p-8 transition-colors hover:bg-accent/40">
                  <span className="hex flex size-12 items-center justify-center bg-accent text-honey-dark dark:text-honey">
                    <item.icon className="size-5" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why a ledger */}
        <section id="why-blockchain" className="grain relative overflow-hidden py-20 sm:py-28">
          <div className="relative z-[1] mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Eyebrow>Why a ledger</Eyebrow>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.05]">
                  Trust that doesn&apos;t rest on a promise.
                </h2>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  A shared, verifiable record means no single party can quietly rewrite the story of a jar of
                  honey — including us.
                </p>
              </div>

              <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:col-span-7">
                {whyBlockchain.map((item) => (
                  <div key={item.title} className="border-l-2 border-honey/40 pl-5">
                    <item.icon className="size-5 text-nature" />
                    <h3 className="mt-3 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Verification CTA */}
        <section className="pb-24 sm:pb-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grain relative overflow-hidden rounded-3xl border-2 border-charcoal/85 bg-honey p-8 shadow-[8px_8px_0_0_var(--color-charcoal)] sm:p-14 dark:border-cream/70 dark:shadow-[8px_8px_0_0_rgba(244,240,232,0.5)]">
              <div className="relative z-[1] grid items-center gap-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-[2.7rem] sm:leading-[1.03]">
                    Got a jar in front of you?
                  </h2>
                  <p className="mt-4 max-w-md leading-relaxed text-charcoal/75">
                    Type the batch identifier from the label. You&apos;ll see exactly what any buyer sees — no
                    account, no app.
                  </p>
                  <div className="mt-7">
                    <VerifyQuickForm onAccent />
                  </div>
                  <Link
                    href="/consumer/scan"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal underline decoration-charcoal/40 decoration-2 underline-offset-4 hover:decoration-charcoal"
                  >
                    Or scan the QR code <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <div className="lg:col-span-5">
                  <HoneyJarIllustration className="mx-auto h-auto w-40 sm:w-52" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-honey-dark dark:text-honey">
      <span className="size-1.5 rotate-45 bg-honey" />
      {children}
    </p>
  );
}
