import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const links = [
  { label: "Verify honey", href: "/consumer" },
  { label: "Scan QR", href: "/consumer/scan" },
  { label: "About", href: "/consumer/about" },
];

export default function ConsumerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-honeycomb">
      <SiteHeader links={links} />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
