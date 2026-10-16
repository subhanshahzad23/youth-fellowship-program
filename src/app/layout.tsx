import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Display: Newsreader Light — a quiet, editorial legal serif for headlines.
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

// Interface: DM Sans — plain, warm and highly legible for body copy and UI.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.goodcase.io"),
  title: {
    default: "Goodcase — the back office of U.S. immigration law firms",
    template: "%s · Goodcase",
  },
  description:
    "Filing-ready O-1, EB-1A, EB-2 NIW, H-1B, L-1 and E-2 petitions and experienced case managers for U.S. immigration law firms. Flat fees from $500 per case, first case at half price. Your strategy, your client, your signature.",
  openGraph: {
    title: "Goodcase — the back office of U.S. immigration law firms",
    description: "Specialized drafting and case management for immigration attorneys. Flat fees from $500 per case.",
    siteName: "Goodcase",
    type: "website",
  },
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
