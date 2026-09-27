import Link from "next/link";
import { HoneycombLogo } from "@/components/honeycomb-logo";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Why blockchain", href: "/#why-blockchain" },
      { label: "Beekeeper portal", href: "/beekeeper" },
    ],
  },
  {
    title: "Verify",
    links: [
      { label: "Verify a batch", href: "/consumer" },
      { label: "Scan a QR code", href: "/consumer/scan" },
      { label: "About verification", href: "/consumer/about" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/signup" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <HoneycombLogo className="size-7" />
              <span className="font-display text-lg font-semibold">HoneyChain</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Traceability infrastructure for honey producers — from live hive sensors through harvest to a
              verifiable record any buyer can check.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{column.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} HoneyChain. All rights reserved.</p>
          {/* The ledger really is a mock implementation (see
              lib/blockchainService.ts), and batch records say so individually.
              Stating it here too keeps the claim on the marketing pages
              honest rather than leaving "blockchain-verified" unqualified. */}
          <p>Ledger records are anchored on a simulated network pending production chain deployment.</p>
        </div>
      </div>
    </footer>
  );
}
