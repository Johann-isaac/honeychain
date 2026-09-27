"use client";

// Shared chrome for the public side of the site (landing, consumer, verify).
// The portal has its own sidebar shell — see components/layout/portal-shell.tsx.

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HoneycombLogo } from "@/components/honeycomb-logo";
import { cn } from "@/lib/utils";

export interface SiteHeaderLink {
  label: string;
  href: string;
}

export function SiteHeader({
  links = [],
  className,
}: {
  links?: SiteHeaderLink[];
  className?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // The header is transparent over the hero and gains a border + blur once
  // the page moves, so it never cuts a hard line across the artwork.
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-200",
        scrolled ? "glass border-b border-border" : "border-b border-transparent",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="HoneyChain home">
          <HoneycombLogo className="size-8" />
          <span className="font-display text-xl font-semibold">HoneyChain</span>
        </Link>

        {links.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.href === pathname ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                  link.href === pathname ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/consumer">Verify a batch</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/beekeeper">Beekeeper portal</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-5 py-4 sm:px-8" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              <Button asChild variant="outline">
                <Link href="/consumer" onClick={() => setOpen(false)}>
                  Verify a batch
                </Link>
              </Button>
              <Button asChild>
                <Link href="/beekeeper" onClick={() => setOpen(false)}>
                  Beekeeper portal
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
