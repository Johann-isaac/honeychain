import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BeekeeperShell } from "@/components/layout/beekeeper-shell";
import { getCurrentBeekeeperId } from "@/lib/auth";
import { getAlertsForBeekeeper, getBeekeeperById } from "@/lib/db";

export const metadata: Metadata = {
  title: { default: "Beekeeper Portal", template: "%s · HoneyChain" },
  robots: { index: false, follow: false },
};

// proxy.ts already redirects anyone without a valid session to /login
// before this ever renders — getCurrentBeekeeperId() here is just used
// to look up the identity shown in the shell, not to gate access.
export default async function BeekeeperLayout({ children }: { children: ReactNode }) {
  const beekeeperId = await getCurrentBeekeeperId();
  const [beekeeper, alerts] = await Promise.all([
    getBeekeeperById(beekeeperId),
    getAlertsForBeekeeper(beekeeperId),
  ]);

  const user = {
    name: beekeeper?.name ?? "Beekeeper",
    code: beekeeper?.beekeeperCode ?? "—",
    region: beekeeper?.region ?? "—",
  };

  return (
    <BeekeeperShell user={user} alertCount={alerts.length}>
      {children}
    </BeekeeperShell>
  );
}
