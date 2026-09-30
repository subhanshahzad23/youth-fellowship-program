import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Display: Newsreader Light stands in for Mural's proprietary STK Bureau (see docs/reference-audit.md).
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

// Interface: DM Sans, a clean humanist sans in place of ABC Social.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Launchpad Fellowship — Start with an idea. Build what comes next.",
    template: "%s · Launchpad Fellowship",
  },
  description:
    "An 18-month entrepreneurship fellowship for young people aged 16–24. Applications, cohorts, learning and supervised messaging in one connected workspace. Demo with fictional data.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${newsreader.variable} ${dmSans.variable} antialiased`}>
      <body className="min-h-dvh bg-paper text-void">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[8px] focus:bg-jade focus:px-4 focus:py-2 focus:text-void"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
