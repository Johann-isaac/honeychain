import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Radio, ShieldCheck, QrCode } from "lucide-react";
import { HoneycombLogo } from "@/components/honeycomb-logo";

const highlights = [
  { icon: Radio, title: "Live hive telemetry", desc: "Temperature, humidity, weight and colony sound from every ESP32 node." },
  { icon: ShieldCheck, title: "AI-assisted monitoring", desc: "Health scores, risk flags and yield forecasts from your own sensor history." },
  { icon: QrCode, title: "Verifiable batches", desc: "Every harvest gets a ledger record and a QR code buyers can check." },
];

/**
 * Two-panel frame shared by sign in and sign up: brand and value on the left
 * (desktop only), the form itself on the right at a comfortable reading width.
 */
export function AuthShell({
  children,
  title,
  subtitle,
  footer,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-charcoal p-12 text-cream lg:flex">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-honey/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-nature/20 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <HoneycombLogo className="size-8" />
          <span className="font-display text-xl font-semibold">HoneyChain</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Every jar carries proof of where it came from.
          </h2>
          <ul className="mt-10 space-y-6">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream/10 text-honey">
                  <item.icon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-cream/60">{item.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-cream/50">
          © {new Date().getFullYear()} HoneyChain. Traceability infrastructure for honey producers.
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-col bg-honeycomb">
        <div className="flex items-center justify-between p-5 sm:p-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="HoneyChain home">
            <HoneycombLogo className="size-7" />
            <span className="font-display text-lg font-semibold">HoneyChain</span>
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to site
          </Link>
        </div>

        <main id="main" className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
