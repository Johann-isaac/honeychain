"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, UserCircle, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { HoneycombLogo } from "@/components/honeycomb-logo";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  mobileLabel?: string;
}

export interface PortalUser {
  name: string;
  /** Public identifier, e.g. "BK-2026-014" */
  code: string;
  region: string;
}

export function PortalShell({
  children,
  navItems,
  portalLabel,
  user,
  alertCount = 0,
  alertsHref,
  profileHref,
  accentClassName = "bg-primary text-primary-foreground",
  mobileNavItems,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  portalLabel: string;
  user: PortalUser;
  alertCount?: number;
  alertsHref: string;
  profileHref: string;
  accentClassName?: string;
  mobileNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const bottomNavItems = mobileNavItems ?? navItems.slice(0, 5);

  // Escape closes whichever overlay is open; a click outside closes the menu.
  React.useEffect(() => {
    if (!mobileOpen && !menuOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMenuOpen(false);
      }
    }
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [mobileOpen, menuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Full navigation, not router.push — same race as login/signup: push
    // immediately followed by refresh can get cancelled and leave the
    // user on a page that requires a session they just cleared.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload so the cleared session cookie is applied
    window.location.href = "/login";
  }

  const isActive = (href: string) => (href === navItems[0].href ? pathname === href : pathname?.startsWith(href));

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const navLinks = (onNavigate?: () => void) =>
    navItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive(item.href) ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          isActive(item.href)
            ? cn(accentClassName, "shadow-xs")
            : "text-foreground/70 hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="size-4.5 shrink-0" />
        {item.label}
      </Link>
    ));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <Link href={navItems[0].href} className="flex items-center gap-2.5 border-b border-border px-5 py-5">
          <HoneycombLogo className="size-8" />
          <span>
            <span className="block font-display text-lg font-semibold leading-none">HoneyChain</span>
            <span className="mt-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {portalLabel}
            </span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin" aria-label={portalLabel}>
          {navLinks()}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href={profileHref}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-honey-dark dark:text-honey">
              {initials || <UserCircle className="size-4" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {user.code} · {user.region}
              </span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-floating">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="flex items-center gap-2.5">
                <HoneycombLogo className="size-7" />
                <span className="font-display text-lg font-semibold">HoneyChain</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">{navLinks(() => setMobileOpen(false))}</nav>
            <div className="border-t border-border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="mt-0.5">
                {user.code} · {user.region}
              </p>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border glass px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <span className="font-display text-base font-semibold lg:hidden">HoneyChain</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <ThemeToggle />

            <Link
              href={alertsHref}
              className="relative rounded-full p-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              aria-label={alertCount > 0 ? `Alerts (${alertCount} active)` : "Alerts"}
            >
              <Bell className="size-4.5" />
              {alertCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 transition-colors hover:bg-muted"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-honey-dark dark:text-honey">
                  {initials || <UserCircle className="size-3.5" />}
                </span>
                <span className="hidden max-w-28 truncate text-xs font-medium sm:inline">{user.name}</span>
                <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-floating"
                >
                  <div className="border-b border-border px-3 py-3">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {user.code} · {user.region}
                    </p>
                  </div>
                  <Link
                    href={profileHref}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                  >
                    <UserCircle className="size-4 text-muted-foreground" /> Profile &amp; settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Quick navigation"
      >
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              isActive(item.href) ? "text-honey-dark dark:text-honey" : "text-muted-foreground"
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
