"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, Settings, User as UserIcon, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { HoneycombLogo } from "@/components/honeycomb-logo";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  mobileLabel?: string;
}

export function PortalShell({
  children,
  navItems,
  portalLabel,
  identityLine,
  accentClassName = "bg-primary text-primary-foreground",
  mobileNavItems,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  portalLabel: string;
  identityLine: string;
  accentClassName?: string;
  mobileNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const bottomNavItems = mobileNavItems ?? navItems.slice(0, 5);

  const isActive = (href: string) => (href === navItems[0].href ? pathname === href : pathname?.startsWith(href));

  return (
    <div className="flex min-h-[calc(100vh-32px)] bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-5">
          <HoneycombLogo className="size-8" />
          <div>
            <p className="font-display text-lg leading-none">HoneyChain</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{portalLabel}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? cn(accentClassName, "shadow-sm")
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4 text-xs text-muted-foreground">{identityLine}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-card p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HoneycombLogo className="size-7" />
                <span className="font-display text-lg">HoneyChain</span>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    isActive(item.href) ? accentClassName : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  <item.icon className="size-4.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <span className="font-display text-base">HoneyChain</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <button className="relative rounded-full p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="size-4.5" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
            </button>
            <button className="hidden rounded-full p-2 hover:bg-muted sm:block" aria-label="Settings">
              <Settings className="size-4.5" />
            </button>
            <button className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 hover:bg-muted">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-primary-dark">
                <UserIcon className="size-3.5" />
              </span>
              <span className="hidden text-xs font-medium sm:inline">Account</span>
            </button>
            <button className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Log out">
              <LogOut className="size-4.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 backdrop-blur lg:hidden">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
              isActive(item.href) ? "text-primary-dark dark:text-honey" : "text-muted-foreground"
            )}
          >
            <item.icon className="size-4.5" />
            {item.mobileLabel ?? item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
