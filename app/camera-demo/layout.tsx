import type { Metadata } from "next";
import type { ReactNode } from "react";

// Internal hardware tooling, not part of the public site — keep it out of
// search results even though the route itself stays reachable by URL.
export const metadata: Metadata = {
  title: "Camera bridge",
  robots: { index: false, follow: false },
};

export default function CameraDemoLayout({ children }: { children: ReactNode }) {
  return <main id="main" className="min-h-screen bg-honeycomb">{children}</main>;
}
