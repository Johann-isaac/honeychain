import Link from "next/link";
import type { ReactNode } from "react";
import { HoneycombLogo } from "@/components/honeycomb-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ConsumerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-32px)] flex-col bg-honeycomb">
      <header className="flex items-center justify-between border-b border-border bg-card/80 px-5 py-4 backdrop-blur sm:px-8">
        <Link href="/consumer" className="flex items-center gap-2">
          <HoneycombLogo className="size-7" />
          <span className="font-display text-lg">HoneyChain</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/consumer" className="hover:text-honey-dark">Verify Honey</Link>
          <Link href="/consumer/scan" className="hidden hover:text-honey-dark sm:inline">Scan QR</Link>
          <Link href="/consumer/about" className="hover:text-honey-dark">About</Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
