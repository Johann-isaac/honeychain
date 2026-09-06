import Link from "next/link";
import {
  ArrowRight,
  Radio,
  FlaskConical,
  Link2,
  ScanLine,
  Sprout,
  ShieldCheck,
  Fingerprint,
  Eye,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/animated-counter";
import { HoneycombLogo } from "@/components/honeycomb-logo";
import { HoneyJarIllustration } from "@/components/landing/honey-jar-illustration";
import { VerifyQuickForm } from "@/components/landing/verify-quick-form";
import { getPlatformStats } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per
// request rather than frozen at build time.
export const dynamic = "force-dynamic";

const steps = [
  { icon: Radio, title: "Hive Monitoring", desc: "IoT sensors track temperature, humidity, and weight in real time." },
  { icon: Sprout, title: "Honey Harvest", desc: "Beekeepers log harvest details and environmental conditions." },
  { icon: FlaskConical, title: "Laboratory Testing", desc: "Accredited technicians run physical, chemical & purity tests." },
  { icon: Link2, title: "Blockchain Registration", desc: "Verified results are anchored to a tamper-resistant ledger." },
  { icon: ScanLine, title: "Consumer Verification", desc: "Anyone can scan the jar's QR code to see the full journey." },
];

const whyBlockchain = [
  { icon: ShieldCheck, title: "Tamper-resistant records", desc: "Once a lab result is registered, it cannot be silently altered." },
  { icon: Fingerprint, title: "Batch traceability", desc: "Every jar links back to a specific hive, harvest date, and beekeeper." },
  { icon: FlaskConical, title: "Laboratory verification", desc: "Independent quality testing backs every verified claim." },
  { icon: Eye, title: "Transparent provenance", desc: "The full hive-to-jar journey is visible, not just a logo on a label." },
  { icon: Users, title: "Consumer confidence", desc: "Shoppers can check authenticity themselves, in seconds." },
];

export default async function LandingPage() {
  const stats = await Promise.resolve(getPlatformStats());

  return (
    <div className="bg-honeycomb">
      {/* Top nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2">
          <HoneycombLogo className="size-8" />
          <span className="font-display text-xl">HoneyChain</span>
        </div>
        <nav className="hidden items-center gap-7 text-sm font-medium text-foreground/70 md:flex">
          <Link href="#how-it-works" className="hover:text-foreground">How it works</Link>
          <Link href="#why-blockchain" className="hover:text-foreground">Why blockchain</Link>
          <Link href="/consumer" className="hover:text-foreground">Verify honey</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/beekeeper">Beekeeper</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/lab">Laboratory</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-2 lg:pt-16">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-honey/40 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Link2 className="size-3.5" /> Blockchain-verified traceability
          </span>
          <h1 className="mt-5 font-display text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            From Hive to Home —<br /> Verified Honey You Can Trust.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            HoneyChain creates a transparent digital journey for every batch of honey — from the beekeeper&apos;s hive
            to laboratory verification and finally to the consumer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/beekeeper">
                Explore HoneyChain <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/consumer">Verify a Honey Batch</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Try the flagship batch: <Link href="/verify/HC-2026-00982" className="underline underline-offset-2 hover:text-foreground">HC-2026-00982</Link>
          </p>
        </div>
        <div className="relative mx-auto animate-fade-up [animation-delay:150ms]">
          <div className="absolute inset-0 -z-10 rounded-full bg-honey/20 blur-3xl" />
          <HoneyJarIllustration className="mx-auto h-auto w-64 sm:w-80" />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-card/60 py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl">How HoneyChain Works</h2>
            <p className="mt-2 text-muted-foreground">Five verifiable stages from apiary to your kitchen table.</p>
          </div>
          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <svg className="pointer-events-none absolute inset-x-0 top-8 hidden h-1 w-full lg:block" preserveAspectRatio="none">
              <line x1="10%" y1="0" x2="90%" y2="0" stroke="var(--color-honey)" strokeWidth="2" className="animate-flow-line" />
            </svg>
            {steps.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl border border-honey/30 bg-card shadow-sm">
                  <step.icon className="size-7 text-honey-dark" />
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Active Hives", value: stats.activeHives, suffix: "" },
            { label: "Honey Batches", value: stats.totalBatches, suffix: "" },
            { label: "Lab Verified Batches", value: stats.labVerifiedBatches, suffix: "" },
            { label: "Verification Success", value: stats.verificationSuccessRate, suffix: "%" },
            { label: "Beekeepers", value: stats.beekeepersCount, suffix: "" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 text-center card-shadow">
              <p className="font-display text-3xl text-honey-dark dark:text-honey">
                <AnimatedCounter value={s.value} decimals={s.suffix === "%" ? 1 : 0} suffix={s.suffix} />
              </p>
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why blockchain */}
      <section id="why-blockchain" className="border-y border-border bg-card/60 py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-12 max-w-xl">
            <h2 className="font-display text-3xl">Why Blockchain?</h2>
            <p className="mt-2 text-muted-foreground">
              A shared, verifiable record means no single party can quietly rewrite the story of a jar of honey.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {whyBlockchain.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-5 card-shadow">
                <item.icon className="size-6 text-nature" />
                <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR verification CTA */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid items-center gap-10 rounded-3xl border border-honey/30 bg-gradient-to-br from-accent to-card p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">Scan. Verify. Trust.</h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Every verified jar carries a unique QR code linking to its full origin, laboratory results, and
              blockchain record — no login required.
            </p>
            <div className="mt-6">
              <VerifyQuickForm />
            </div>
            <Button asChild variant="link" className="mt-4">
              <Link href="/consumer">
                Verify a Batch <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <HoneyJarIllustration className="mx-auto h-auto w-48 sm:w-56" />
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground sm:px-8">
        <p>HoneyChain — Smart India Hackathon Prototype. Blockchain records shown in demo mode are clearly labeled and are not real on-chain transactions.</p>
      </footer>
    </div>
  );
}
