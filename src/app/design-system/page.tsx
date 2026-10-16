import type { Metadata } from "next";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { FirstCaseOffer } from "@/components/gc/offer";
import { PlaceholderTag, SectionHeader } from "@/components/gc/section";
import { Portrait } from "@/components/gc/team";
import { DesignSystemControls } from "./controls";

export const metadata: Metadata = {
  title: "Design system",
  description: "The Goodcase concept design system: logo, colour, typography, spacing, components and page sections — the reusable library behind every page.",
};

const COLORS = [
  { name: "Void", token: "--void", hex: "#000000", use: "Heroes, primary text, dark buttons", ink: "#fff" },
  { name: "Paper", token: "--paper", hex: "#FFFFFF", use: "Page background, cards", ink: "#000", ring: true },
  { name: "Jade", token: "--jade", hex: "#00C27A", use: "The one accent — primary CTA, focus on dark", ink: "#000" },
  { name: "Mint", token: "--mint", hex: "#B4F5C8", use: "Arrow box, closing CTA panel", ink: "#000" },
  { name: "Forest", token: "--forest", hex: "#00843F", use: "Accent text on mint", ink: "#fff" },
  { name: "Leaf", token: "--leaf", hex: "#D5F8E0", use: "Success and 'included' tints", ink: "#007B3B" },
  { name: "Fog", token: "--fog", hex: "#F3F3F3", use: "Card surfaces, secondary panels", ink: "#000" },
  { name: "Line", token: "--line", hex: "#DCE1E5", use: "Borders and dividers", ink: "#000" },
  { name: "Muted display", token: "--muted-display", hex: "#8C8C8C", use: "Second line of display headings", ink: "#fff" },
  { name: "Muted text", token: "--muted-text", hex: "#626262", use: "Secondary body text (AA on white)", ink: "#fff" },
];

const TYPE = [
  { cls: "display-hero", label: "Display hero", spec: "Newsreader Light · 46–84px · −0.048em", sample: "Your strategy. Your signature." },
  { cls: "display-xl", label: "Display XL", spec: "Newsreader Light · 42–72px · −0.042em", sample: "Filing-ready petitions" },
  { cls: "display-lg", label: "Display L", spec: "Newsreader Light · 36–56px · −0.038em", sample: "How a petition is built" },
  { cls: "display-md", label: "Display M", spec: "Newsreader Light · 30–42px · −0.03em", sample: "Modern Immigration Practice" },
  { cls: "display-sm", label: "Display S", spec: "Newsreader Light · 24–30px · −0.02em", sample: "What we'll cover" },
];

export default function DesignSystemPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Design system · concept" title="One library," muted="every page." offer={false}>
        <p className="mt-6 max-w-[640px] text-[17px] leading-[1.6] text-paper/90">
          The tokens, components and sections behind this concept. In the engagement this lives in Figma as a component library with variants — here it is in code, so every value you see is the one the site uses.
        </p>
      </PublicHero>

      <div className="container-page space-y-[var(--space-section)] py-[var(--space-section)]">
        <section aria-labelledby="ds-logo">
          <SectionHeader id="ds-logo" eyebrow="01 · Logo" title="A refreshed G." muted="Same name, steadier mark." lede="The current G, redrawn as an open stroke in a rounded square. The jade crossbar is the signature stroke — the attorney's mark that finishes every petition." />
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid min-h-[200px] place-items-center rounded-[24px] bg-fog">
              <Logo />
            </div>
            <div className="dots-dark grid min-h-[200px] place-items-center rounded-[24px]">
              <Logo dark />
            </div>
            <div className="flex min-h-[200px] items-center justify-center gap-6 rounded-[24px] border-[1.5px] border-line">
              <LogoMark className="size-16" />
              <LogoMark className="size-10" />
              <LogoMark className="size-6" />
            </div>
          </div>
        </section>

        <section aria-labelledby="ds-color">
          <SectionHeader id="ds-color" eyebrow="02 · Colour" title="Black, white" muted="and one green." lede="Restraint is the brand. Surfaces separate by tone rather than shadow; jade is reserved for the action we want taken." />
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {COLORS.map((c) => (
              <li key={c.token} className="min-w-0 overflow-hidden rounded-[16px] border-[1.5px] border-line">
                <div className="flex h-24 items-end p-3 text-[12px] font-medium" style={{ background: c.hex, color: c.ink }}>
                  {c.hex}
                </div>
                <div className="p-3">
                  <p className="text-[14px] font-medium">{c.name}</p>
                  <p className="font-mono text-[11.5px] text-muted">{c.token}</p>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">{c.use}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ds-type">
          <SectionHeader id="ds-type" eyebrow="03 · Typography" title="An editorial serif," muted="a plain sans." lede="Newsreader Light carries headlines with legal quiet. DM Sans keeps body copy and interface warm and legible. Display headings pair a white statement with a muted second line." />
          <div className="mt-10 divide-y divide-line border-y border-line">
            {TYPE.map((t) => (
              <div key={t.cls} className="grid grid-cols-1 gap-3 py-6 md:grid-cols-[220px_1fr] md:items-baseline">
                <div>
                  <p className="text-[14px] font-medium">{t.label}</p>
                  <p className="text-[12.5px] text-muted">{t.spec}</p>
                </div>
                <p className={`${t.cls} min-w-0`}>{t.sample}</p>
              </div>
            ))}
            <div className="grid grid-cols-1 gap-3 py-6 md:grid-cols-[220px_1fr] md:items-baseline">
              <div>
                <p className="text-[14px] font-medium">Body &amp; eyebrow</p>
                <p className="text-[12.5px] text-muted">DM Sans · 17px/1.6 · 11.5px +0.2em caps</p>
              </div>
              <div className="min-w-0">
                <p className="eyebrow">Inside every petition</p>
                <p className="mt-2 max-w-[60ch] text-[17px] leading-[1.6] text-ink">Send us the strategy and the evidence. Our immigration-only legal writers draft the full package in your templates and tone.</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="ds-components">
          <SectionHeader id="ds-components" eyebrow="04 · Components" title="Built to convert," muted="built to reuse." />
          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="min-w-0 rounded-[24px] bg-fog p-6 sm:p-8">
              <p className="eyebrow text-muted">Buttons</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button arrow>Book a call</Button>
                <Button variant="dark" arrow>
                  Book a call
                </Button>
                <Button variant="outline">See sample work</Button>
                <Button variant="soft">Secondary</Button>
                <Button loading>Saving</Button>
              </div>
              <div className="dots-dark on-dark mt-5 flex flex-wrap gap-3 rounded-[16px] p-5">
                <ButtonLink href="/book-a-call" arrow>
                  Book a 30-minute call
                </ButtonLink>
                <ButtonLink href="/sample-work" variant="ghost-dark">
                  See sample work
                </ButtonLink>
              </div>
            </div>
            <div className="min-w-0 rounded-[24px] bg-fog p-6 sm:p-8">
              <p className="eyebrow text-muted">First-case offer · under every hero, above every closing button</p>
              <FirstCaseOffer className="mt-5" />
              <div className="dots-dark mt-5 rounded-[16px] p-5">
                <FirstCaseOffer tone="dark" />
              </div>
              <div className="dots-mint mt-5 rounded-[16px] p-5">
                <FirstCaseOffer tone="mint" />
              </div>
            </div>
            <div className="min-w-0 rounded-[24px] bg-fog p-6 sm:p-8">
              <p className="eyebrow text-muted">Tags and badges</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge tone="green">Verified</Badge>
                <Badge>O-1A</Badge>
                <Badge tone="amber">RFE due in 5 days</Badge>
                <PlaceholderTag />
                <PlaceholderTag>Illustrative</PlaceholderTag>
                <span className="rounded-[26px] bg-leaf px-2.5 py-0.5 text-[12px] font-medium text-leaf-ink">from $500</span>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-muted">Every placeholder is labelled on the page — no invented clients, logos or statistics.</p>
            </div>
            <div className="min-w-0 rounded-[24px] bg-fog p-6 sm:p-8">
              <p className="eyebrow text-muted">People</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Portrait name="Piotr Messerszmidt" />
                <Portrait name="Monica Prado" />
                <Portrait name="Francesco Cortese" />
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-muted">Monogram portraits hold the place for real team photography — one consistent crop, natural light, plain background.</p>
            </div>
          </div>
          <DesignSystemControls />
        </section>

        <section aria-labelledby="ds-sections">
          <SectionHeader id="ds-sections" eyebrow="05 · Sections" title="Page sections" muted="as building blocks." lede="Every page is assembled from the same sections. Each links to a live example." />
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Header with two dropdowns", "/", "Services and Who we serve, sticky floating bar"],
              ["Fact strip", "/#facts-h", "Oversized serif numbers, thin dividers"],
              ["Client logo row", "/#logos-h", "Labelled placeholders until approved"],
              ["Service cards", "/#services", "Open prices on each card"],
              ["3D petition stack", "/#petition-stack", "Scroll-built glass layers (three.js)"],
              ["Four-step process", "/#process", "Sticky tabs with live previews"],
              ["ROI calculator", "/#roi", "Illustrative, assumptions shown"],
              ["Video testimonials", "/#testimonials", "Captioned player in a dialog"],
              ["Security card", "/#security", "Inset black card, policy-backed claims"],
              ["Booking calendar", "/book-a-call", "Time zones, .ics and Google Calendar"],
              ["Contact form", "/book-a-call#contact", "Inline validation and error summary"],
              ["Footer with newsletter", "/#footer-h", "Validation, success and duplicate states"],
            ].map(([t, href, d]) => (
              <li key={t} className="min-w-0">
                <a href={href} className="block h-full rounded-[16px] border-[1.5px] border-line p-5 transition-colors hover:border-void">
                  <p className="text-[16px] font-medium">{t}</p>
                  <p className="mt-1 text-[14px] text-muted">{d}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicShell>
  );
}
