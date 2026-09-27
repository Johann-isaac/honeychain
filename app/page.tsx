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
    desc: "An ESP32 node on each hive sends temperature, humidity, weight and colony sound on a timer. A second board posts entrance photographs. Nothing is entered by hand.",
  },
  {
    icon: Sprout,
    title: "The harvest is logged",
    desc: "Quantity, floral source, extraction method and storage join the record at harvest, alongside the hive conditions the sensors captured that day.",
  },
  {
    icon: Link2,
    title: "The batch is sealed",
    desc: "Creating a batch hashes its contents and writes them to the ledger. From that point, altering the record breaks the hash and the edit becomes visible.",
  },
  {
    icon: ScanLine,
    title: "Anyone can check it",
    desc: "The code on the jar opens the full record — producer, hive, conditions, ledger entry. No application, no account, no need to ask the seller.",
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
    desc: "Creating a batch generates its identifier, ledger record and printable code in a single step, ready for the label.",
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
    desc: "Every jar links to one specific hive, one harvest date and one registered producer — not to a brand in general.",
  },
  {
    icon: Eye,
    title: "Published in full",
    desc: "Hive conditions, floral source, extraction and storage are all shown, rather than compressed into a label.",
  },
  {
    icon: Users,
    title: "Independently checkable",
    desc: "Buyers, distributors and auditors verify a batch themselves, without the producer's cooperation.",
  },
];

export default async function LandingPage() {
  const stats = await getPlatformStats();

  const figures = [
    { label: "Hives monitored", value: stats.activeHives },
    { label: "Batches registered", value: stats.totalBatches },
    { label: "Batches verified", value: stats.verifiedBatches },
    { label: "Producers", value: stats.beekeepersCount },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader links={navLinks} />

      <main id="main" className="flex-1">
        {/* ---------------------------------------------------------------
            Hero. Calm and asymmetric: the claim sits left at a readable
            size with generous leading, the comb sits right as a single
            quiet object. Honey appears once, as a rule and an accent.
        --------------------------------------------------------------- */}
        <section className="grain relative overflow-hidden">
          <div className="relative z-[1] mx-auto grid max-w-6xl items-center gap-16 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-12 lg:pb-28 lg:pt-24">
            <div className="lg:col-span-7">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <span className="h-px w-8 bg-honey" />
                Honey traceability
              </p>

              <h1 className="mt-8 max-w-xl font-display text-[2.5rem] font-medium leading-[1.08] tracking-[-0.022em] text-balance sm:text-5xl lg:text-[3.5rem]">
                Provenance you can verify, not simply trust.
              </h1>

              <p className="mt-7 max-w-lg text-lg leading-[1.65] text-muted-foreground">
                HoneyChain records the hive a batch came from, the conditions it was harvested in, and a ledger
                entry any buyer can check in seconds.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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

            <div className="lg:col-span-5">
              <div className="comb-lattice hex-v mx-auto flex aspect-[6/5] max-w-xs items-center justify-center bg-accent/35">
                <HoneyJarIllustration className="h-auto w-36 sm:w-40" />
              </div>
            </div>
          </div>

          {/* Figures as a typographic row under the hero, separated by
              hairlines rather than sat inside boxes. */}
          <div className="relative z-[1] border-t border-border">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 px-6 sm:px-8 lg:grid-cols-4">
              {figures.map((figure, i) => (
                <div
                  key={figure.label}
                  className={`py-8 lg:py-9 ${i > 0 ? "lg:border-l lg:border-border lg:pl-8" : ""}`}
                >
                  <dd className="font-display text-3xl font-medium tabular-nums sm:text-[2.25rem]">
                    <AnimatedCounter value={figure.value} />
                  </dd>
                  <dt className="mt-2 text-xs tracking-wide text-muted-foreground">{figure.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <SignalTicker
          hives={stats.activeHives}
          batches={stats.totalBatches}
          beekeepers={stats.beekeepersCount}
        />

        {/* Process — a numbered editorial list separated by hairlines. */}
        <section id="how-it-works" className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6 sm:px-8">
            <SectionHeading eyebrow="How it works" title="Four stages. One record." />

            <ol className="mt-16">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="grid gap-x-10 gap-y-4 border-t border-border py-10 last:border-b lg:grid-cols-12"
                >
                  <div className="flex items-baseline gap-4 lg:col-span-4">
                    <span className="numeral">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-display text-xl font-medium tracking-tight">{step.title}</h3>
                  </div>
                  <p className="max-w-xl leading-[1.7] text-muted-foreground lg:col-span-7 lg:col-start-6">
                    {step.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Platform */}
        <section id="platform" className="border-y border-border bg-card py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6 sm:px-8">
            <SectionHeading
              eyebrow="For producers"
              title="The hive data behind every certificate."
              lead="The portal is where the record is built — monitoring, analysis and batch registration in one place."
            />

            <div className="mt-16 grid gap-12 lg:grid-cols-3 lg:gap-10">
              {platform.map((item) => (
                <article key={item.title}>
                  <span className="hex flex size-11 items-center justify-center bg-accent text-honey-dark dark:text-honey">
                    <item.icon className="size-[1.15rem]" />
                  </span>
                  <h3 className="mt-6 font-display text-lg font-medium tracking-tight">{item.title}</h3>
                  <div className="rule-fade my-4" />
                  <p className="text-sm leading-[1.7] text-muted-foreground">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why a ledger */}
        <section id="why-blockchain" className="py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 sm:px-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeading
                eyebrow="Why a ledger"
                title="Trust that does not rest on a promise."
                lead="A shared, verifiable record means no single party can quietly rewrite the story of a jar of honey — ourselves included."
              />
            </div>

            <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
              {whyBlockchain.map((item) => (
                <div key={item.title}>
                  <item.icon className="size-[1.15rem] text-nature" />
                  <dt className="mt-4 font-medium">{item.title}</dt>
                  <dd className="mt-2 text-sm leading-[1.7] text-muted-foreground">{item.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Verification CTA — a deep panel, honey used only for accents. */}
        <section className="pb-24 sm:pb-32">
          <div className="mx-auto max-w-6xl px-6 sm:px-8">
            <div className="grain relative overflow-hidden rounded-2xl bg-charcoal px-8 py-14 sm:px-14 sm:py-16">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-honey/10 blur-3xl"
              />
              <div className="relative z-[1] grid items-center gap-12 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-cream/50">
                    <span className="h-px w-8 bg-honey" />
                    Verify
                  </p>
                  <h2 className="mt-6 max-w-md font-display text-3xl font-medium leading-[1.12] tracking-[-0.02em] text-cream sm:text-[2.5rem]">
                    Have a jar in front of you?
                  </h2>
                  <p className="mt-5 max-w-md leading-[1.65] text-cream/60">
                    Enter the batch identifier from the label to see exactly what any buyer sees. No account, no
                    application.
                  </p>
                  <div className="mt-8">
                    <VerifyQuickForm onAccent />
                  </div>
                  <Link
                    href="/consumer/scan"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm text-cream/70 underline decoration-cream/25 underline-offset-4 transition-colors hover:text-cream hover:decoration-cream/60"
                  >
                    Or scan the code instead <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <div className="lg:col-span-5">
                  <HoneyJarIllustration className="mx-auto h-auto w-36 sm:w-44" />
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

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        <span className="h-px w-8 bg-honey" />
        {eyebrow}
      </p>
      <h2 className="mt-6 font-display text-3xl font-medium leading-[1.12] tracking-[-0.02em] text-balance sm:text-[2.5rem]">
        {title}
      </h2>
      {lead && <p className="mt-5 leading-[1.7] text-muted-foreground">{lead}</p>}
    </div>
  );
}
