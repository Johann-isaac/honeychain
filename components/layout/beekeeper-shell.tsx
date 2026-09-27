"use client";

// Thin client wrapper around PortalShell: nav items reference lucide icon
// components (functions), which can't be passed as props from the async
// Server Component layout (app/beekeeper/layout.tsx) into a Client
// Component — only serializable data like `user` crosses that boundary,
// so the icon-bearing nav config lives here instead.

import type { ReactNode } from "react";
import { LayoutDashboard, Hexagon, LineChart, Package, TrendingUp, AlertTriangle, UserCircle } from "lucide-react";
import { PortalShell, type NavItem, type PortalUser } from "@/components/layout/portal-shell";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/beekeeper", icon: LayoutDashboard },
  { label: "My Hives", href: "/beekeeper/hives", icon: Hexagon, mobileLabel: "Hives" },
  { label: "Hive Analytics", href: "/beekeeper/analytics", icon: LineChart, mobileLabel: "Analytics" },
  { label: "Honey Batches", href: "/beekeeper/batches", icon: Package, mobileLabel: "Batches" },
  { label: "Yield Predictions", href: "/beekeeper/yield", icon: TrendingUp, mobileLabel: "Yield" },
  { label: "Alerts", href: "/beekeeper/alerts", icon: AlertTriangle },
  { label: "Profile", href: "/beekeeper/profile", icon: UserCircle },
];

const mobileNavItems = [navItems[0], navItems[1], navItems[3], navItems[5], navItems[6]];

export function BeekeeperShell({
  user,
  alertCount,
  children,
}: {
  user: PortalUser;
  alertCount: number;
  children: ReactNode;
}) {
  return (
    <PortalShell
      navItems={navItems}
      mobileNavItems={mobileNavItems}
      portalLabel="Beekeeper Portal"
      user={user}
      alertCount={alertCount}
      alertsHref="/beekeeper/alerts"
      profileHref="/beekeeper/profile"
      accentClassName="bg-honey/20 text-honey-dark dark:text-honey"
    >
      {children}
    </PortalShell>
  );
}
