import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const description =
  "HoneyChain gives every batch of honey a verifiable record — live hive sensor data, harvest details, and a blockchain-anchored certificate a consumer can check in seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Child segments set a short `title` and inherit this suffix, so every tab
  // reads "<Page> · HoneyChain" without repeating the brand in each file.
  title: {
    default: "HoneyChain — Verified Honey Traceability",
    template: "%s · HoneyChain",
  },
  description,
  applicationName: "HoneyChain",
  keywords: ["honey traceability", "beekeeping", "blockchain verification", "hive monitoring", "IoT apiary"],
  openGraph: {
    type: "website",
    siteName: "HoneyChain",
    title: "HoneyChain — Verified Honey Traceability",
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "HoneyChain — Verified Honey Traceability",
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#12100d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-floating"
          >
            Skip to content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
