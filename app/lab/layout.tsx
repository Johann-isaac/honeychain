"use client";

import type { ReactNode } from "react";
import { LayoutDashboard, Inbox, FlaskConical, ClipboardCheck, FileText, Link2 } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/layout/portal-shell";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/lab", icon: LayoutDashboard },
  { label: "Pending Samples", href: "/lab/samples", icon: Inbox, mobileLabel: "Pending" },
  { label: "Testing", href: "/lab/testing", icon: FlaskConical },
  { label: "Completed Tests", href: "/lab/completed", icon: ClipboardCheck, mobileLabel: "Completed" },
  { label: "Reports", href: "/lab/reports", icon: FileText },
  { label: "Blockchain Records", href: "/lab/blockchain", icon: Link2, mobileLabel: "Chain" },
];

const mobileNavItems = [navItems[0], navItems[1], navItems[2], navItems[4], navItems[5]];

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell
      navItems={navItems}
      mobileNavItems={mobileNavItems}
      portalLabel="Laboratory Quality Control"
      identityLine="LAB-TN-042 · Dr. Priya Sundaram"
      accentClassName="bg-nature/20 text-nature"
    >
      {children}
    </PortalShell>
  );
}
