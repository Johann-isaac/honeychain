"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { key: "beekeeper", label: "Beekeeper", href: "/beekeeper" },
  { key: "lab", label: "Laboratory", href: "/lab" },
  { key: "consumer", label: "Consumer", href: "/consumer" },
] as const;

export function DemoBar() {
  const pathname = usePathname();
  const active = roles.find((r) => pathname?.startsWith(r.href))?.key;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border bg-charcoal px-3 py-1.5 text-cream sm:px-5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide">
        <Sparkles className="size-3.5 text-honey" />
        <span className="hidden sm:inline">DEMO MODE</span>
        <span className="sm:hidden">DEMO</span>
        <span className="hidden text-cream/50 font-normal sm:inline">— mock blockchain &amp; demo accounts</span>
      </div>
      <nav className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
        {roles.map((r) => (
          <Link
            key={r.key}
            href={r.href}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3",
              active === r.key ? "bg-honey text-charcoal" : "text-cream/80 hover:text-cream"
            )}
          >
            {r.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
