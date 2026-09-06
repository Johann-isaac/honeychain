"use client";

import type { ReactNode } from "react";
import { LayoutDashboard, Hexagon, LineChart, Package, TrendingUp, AlertTriangle, UserCircle } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/layout/portal-shell";

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

export default function BeekeeperLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell
      navItems={navItems}
      mobileNavItems={mobileNavItems}
      portalLabel="Beekeeper Portal"
      identityLine="BK-2026-0142 · Coimbatore, TN"
      accentClassName="bg-honey/20 text-honey-dark dark:text-honey"
    >
      {children}
    </PortalShell>
  );
}
