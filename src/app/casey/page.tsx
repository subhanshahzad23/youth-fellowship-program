import type { Metadata } from "next";
import {
  BellRing,
  CalendarClock,
  ChartColumn,
  Check,
  Circle,
  FileText,
  FolderOpen,
  FolderUp,
  KeyRound,
  ListChecks,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { PlaceholderTag, SectionHeader } from "@/components/gc/section";
import { FinalCta } from "@/components/gc/final-cta";

export const metadata: Metadata = {
  title: "Casey — case management software",
  description:
    "Casey is the case management software Goodcase built for immigration work: case list, deadlines and RFE tracker, client document requests, status updates, role-based access and reporting. Included with Goodcase case management.",
};

/** Placeholder until Goodcase confirms the product site's address. */
const CASEY_SITE = "https://casey.goodcase.io";

/** The long placeholder label must wrap on narrow phones instead of overflowing. */
const WRAP = "h-auto min-h-12 max-w-full whitespace-normal py-2.5 text-left";

const FEATURES = [
  { icon: ListChecks, title: "Case list", body: "Every matter with its visa type, stage, owner and next step — filterable by attorney, client or case type." },
  { icon: CalendarClock, title: "Deadlines and RFE tracker", body: "Filing windows, expirations and RFE response dates in one view, with evidence progress for every response." },
  { icon: FolderUp, title: "Client document requests", body: "Checklists per case type, requests sent in your firm's name, reminders tracked until every file is in." },
  { icon: BellRing, title: "Status updates", body: "A clear status on every case, so attorneys — and clients, when you choose — stop asking where things stand." },
  { icon: KeyRound, title: "Role-based access", body: "People see only the matters they're assigned to. Access is role-based and every view is logged." },
  { icon: ChartColumn, title: "Reporting for high-volume firms", body: "Throughput, turnaround and deadline status across every matter, for partners who need the whole picture." },
];

/* ---------------------------- Dashboard mock ---------------------------- */
/* Static, in-code illustration of the Casey dashboard. All data is sample. */

type Tone = "jade" | "amber" | "sky" | "dark" | "grey";

const STAGE_TONE: Record<Tone, string> = {
  jade: "bg-leaf text-leaf-ink",
  amber: "bg-[#fff1cc] text-[#7a4b00]",
  sky: "bg-[#e3efff] text-[#195ad7]",
  dark: "bg-void text-paper",
  grey: "bg-ash text-ink",
};

const CASES: { id: string; visa: string; stage: string; tone: Tone; owner: string; next: string; urgent?: boolean }[] = [
  { id: "#1041", visa: "O-1A", stage: "Drafting", tone: "jade", owner: "Drafter", next: "Draft to attorney · Thu" },
  { id: "#1031", visa: "EB-1A", stage: "RFE response", tone: "amber", owner: "Case manager", next: "Due in 5 days", urgent: true },
  { id: "#1044", visa: "EB-2 NIW", stage: "Documents", tone: "sky", owner: "Case manager", next: "3 of 7 received" },
  { id: "B1-012", visa: "H-1B", stage: "With attorney", tone: "dark", owner: "Attorney", next: "Ready to sign" },
  { id: "#2201", visa: "L-1A", stage: "Review", tone: "jade", owner: "Reviewer", next: "Citations 38 / 42" },
  { id: "#1048", visa: "E-2", stage: "Intake", tone: "grey", owner: "Case manager", next: "Questionnaire sent" },
];

const RAIL = [
  { icon: FolderOpen, label: "Cases", active: true },
  { icon: CalendarClock, label: "Deadlines" },
  { icon: FolderUp, label: "Documents" },
  { icon: Users, label: "Clients" },
  { icon: ChartColumn, label: "Reports" },
  { icon: ShieldCheck, label: "Access" },
];

function Label({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={cn("text-[10.5px] font-medium uppercase tracking-[0.16em]", dark ? "text-muted-display" : "text-muted")}>{children}</p>;
}

function CaseyDashboard() {
  const bars = [6, 8, 7, 10, 9, 12];
  const max = Math.max(...bars);
  return (
    <div className="dots-light rounded-[24px] bg-[#fafafa] p-2.5 sm:p-6 lg:p-8" role="img" aria-label="Illustration of the Casey dashboard with sample data: a case list, a deadlines and RFE tracker, client document requests, status updates and a weekly report.">
      <div className="overflow-hidden rounded-[18px] bg-paper shadow-panel" aria-hidden>
        {/* Window bar */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
          <LogoMark className="size-6 shrink-0" />
          <p className="text-[14px] font-semibold">Casey</p>
          <span className="hidden text-[13px] text-muted sm:inline">/ Your firm</span>
          <span className="ml-auto hidden h-8 w-[220px] items-center gap-2 rounded-[8px] bg-fog px-3 text-[12.5px] text-muted md:flex">
            <Search className="size-3.5" /> Search cases, clients, forms
          </span>
          <PlaceholderTag className="ml-auto md:ml-0">Illustrative · sample data</PlaceholderTag>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[176px_minmax(0,1fr)]">
          {/* Rail */}
          <nav className="hidden border-r border-line bg-[#fafafa] p-3 lg:block">
            <ul className="space-y-1">
              {RAIL.map(({ icon: Icon, label, active }) => (
                <li key={label} className={cn("flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px]", active ? "bg-void text-paper" : "text-ink")}>
                  <Icon className="size-4" strokeWidth={1.8} /> {label}
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-3 p-3 sm:space-y-4 sm:p-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
              {[
                ["Active cases", "18"],
                ["Due this week", "5"],
                ["Open RFEs", "2"],
                ["Documents outstanding", "9"],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0 rounded-[12px] bg-fog p-3 sm:p-3.5">
                  <Label>{k}</Label>
                  <p className="mt-1.5 font-display text-[30px] leading-none tracking-[-0.03em] tabular">{v}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
              {/* Case list */}
              <div className="min-w-0 rounded-[14px] p-3 ring-1 ring-black/5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Case list</Label>
                  <div className="flex flex-wrap gap-1">
                    {["All", "O-1", "EB-1A", "NIW", "H-1B"].map((f, i) => (
                      <span key={f} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", i === 0 ? "bg-void text-paper" : "bg-fog text-ink")}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <ul className="mt-3 divide-y divide-line">
                  {CASES.map((c) => (
                    <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2.5 sm:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)]">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">
                          {c.visa} <span className="font-normal text-muted">· {c.id}</span>
                        </p>
                        <p className="truncate text-[11.5px] text-muted">{c.owner}</p>
                      </div>
                      <span className={cn("justify-self-end rounded-full px-2 py-0.5 text-[11px] font-medium sm:justify-self-start", STAGE_TONE[c.tone])}>{c.stage}</span>
                      <p className={cn("col-span-2 truncate text-[12px] sm:col-span-1 sm:text-right", c.urgent ? "font-medium text-[#7a4b00]" : "text-muted")}>{c.next}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0 space-y-3 sm:space-y-4">
                {/* Deadlines + RFE */}
                <div className="rounded-[14px] bg-void p-4 text-paper">
                  <div className="flex items-center justify-between">
                    <Label dark>Deadlines &amp; RFEs</Label>
                    <CalendarClock className="size-4 text-muted-display" />
                  </div>
                  <ul className="mt-2.5 space-y-1.5 text-[12.5px]">
                    {[
                      ["RFE response · EB-1A #1031", "5 days"],
                      ["Draft to attorney · O-1A #1041", "Thu"],
                      ["I-94 expiry · L-1A #2201", "38 days"],
                    ].map(([t, d]) => (
                      <li key={t} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate">{t}</span>
                        <span className="shrink-0 text-jade">{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3.5 rounded-[10px] bg-paper/[0.07] p-3">
                    <p className="text-[12px]">RFE · EB-1A #1031 — evidence 7 of 10</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#333]">
                      <div className="h-full w-[70%] rounded-full bg-jade" />
                    </div>
                  </div>
                </div>

                {/* Document requests */}
                <div className="rounded-[14px] p-4 ring-1 ring-black/5">
                  <div className="flex items-center justify-between">
                    <Label>Client document requests</Label>
                    <span className="text-[11px] font-medium text-muted tabular">NIW #1044</span>
                  </div>
                  <ul className="mt-2.5 space-y-1.5 text-[12.5px]">
                    {(
                      [
                        ["Passport scan", "Received", "done"],
                        ["Degree evaluation", "Reminder sent", "wait"],
                        ["Support letter #3", "Requested", "todo"],
                      ] as const
                    ).map(([doc, st, s]) => (
                      <li key={doc} className="flex items-center gap-2">
                        {s === "done" ? <Check className="size-3.5 text-leaf-ink" strokeWidth={3} /> : <Circle className={cn("size-3", s === "wait" ? "text-amber" : "text-[#c4c4c4]")} />}
                        <span className="min-w-0 flex-1 truncate">{doc}</span>
                        <span className={cn("shrink-0", s === "done" ? "text-leaf-ink" : s === "wait" ? "text-[#7a4b00]" : "text-muted")}>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              {/* Status updates */}
              <div className="min-w-0 rounded-[14px] bg-fog p-4">
                <Label>Status updates</Label>
                <ul className="mt-2.5 space-y-2 text-[12.5px]">
                  {[
                    ["O-1A #1041", "Moved to quality review", "10:42"],
                    ["H-1B B1-012", "Package ready for attorney signature", "09:15"],
                    ["EB-2 NIW #1044", "Client uploaded passport scan", "Yesterday"],
                  ].map(([c, t, w]) => (
                    <li key={c} className="flex items-start gap-2.5">
                      <FileText className="mt-0.5 size-3.5 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{c}</span> <span className="text-ink">{t}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-muted">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reporting */}
              <div className="min-w-0 rounded-[14px] p-4 ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <Label>Drafts delivered · last 6 weeks</Label>
                  <ChartColumn className="size-4 text-muted" />
                </div>
                <div className="mt-3 flex h-[64px] items-end gap-2">
                  {bars.map((b, i) => (
                    <span key={i} className="flex-1 rounded-t-[4px] bg-void" style={{ height: `${(b / max) * 100}%`, opacity: i === bars.length - 1 ? 1 : 0.3 + i * 0.1 }} />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[10.5px] text-muted">
                  {["W1", "W2", "W3", "W4", "W5", "W6"].map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Page --------------------------------- */

export default function CaseyPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Casey · case management software" title="Casey keeps every case" muted="visible.">
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/80 sm:text-[18px]">
          Casey is the case management software Goodcase built for immigration work. Your case manager runs it day to day; your attorneys see every case, deadline and document request in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/book-a-call" arrow size="lg">
            Book a 30-minute call
          </ButtonLink>
          <ButtonLink href={CASEY_SITE} variant="ghost-dark" size="lg" target="_blank" rel="noopener noreferrer" className={WRAP}>
            Visit the Casey site (placeholder link)
          </ButtonLink>
        </div>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="dashboard-h">
        <div className="container-page">
          <SectionHeader
            id="dashboard-h"
            eyebrow="One view of the caseload"
            title="Every case, every deadline."
            muted="One calm screen."
            lede="Case list, deadlines, RFEs, client documents and status updates side by side — so nobody has to ask where a petition stands."
          />
          <Reveal className="mt-12">
            <CaseyDashboard />
          </Reveal>
          <p className="mt-4 text-[13px] text-muted">Design-concept illustration with sample data. It is not a screenshot of the Casey product.</p>
        </div>
      </section>

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="features-h">
        <div className="container-page">
          <SectionHeader id="features-h" eyebrow="What Casey does" title="Built for immigration work." muted="Nothing you don't need." />
          <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 3) * 0.06} className="min-w-0 rounded-[20px] bg-fog p-6 sm:p-7">
                <f.icon className="size-6 text-leaf-ink" aria-hidden />
                <h3 className="mt-5 text-[19px] font-medium leading-snug tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper pb-[var(--space-section)]" aria-labelledby="included-h">
        <div className="container-page grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Reveal className="min-w-0 rounded-[24px] bg-leaf p-7 sm:p-10">
            <p className="eyebrow text-leaf-ink">Included</p>
            <h2 id="included-h" className="display-lg mt-4 max-w-[18ch]">
              Casey comes with Goodcase case management.
            </h2>
            <p className="mt-5 max-w-[560px] text-[17px] leading-[1.6] text-ink">
              When a Goodcase case manager works inside your firm, Casey is part of the engagement. Your case manager sets it up and keeps it current; your attorneys get a clear view of every matter.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/case-management" variant="dark" arrow>
                Explore case management
              </ButtonLink>
              <ButtonLink href="/case-drafting#pricing" variant="light">
                See pricing
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="dots-dark on-dark flex min-w-0 flex-col rounded-[24px] p-7 text-paper sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow text-mint">Casey has its own site</p>
              <PlaceholderTag dark>Link to be confirmed</PlaceholderTag>
            </div>
            <h2 className="display-md mt-4 max-w-[16ch]">See the full product tour on the Casey site.</h2>
            <p className="mt-4 max-w-[460px] text-[16px] leading-[1.6] text-paper/75">
              This page is a short introduction. Product details live on Casey&apos;s own website.
            </p>
            <div className="mt-auto pt-8">
              <ButtonLink href={CASEY_SITE} arrow size="lg" target="_blank" rel="noopener noreferrer" className={WRAP}>
                Visit the Casey site (placeholder link)
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      <FinalCta />
    </PublicShell>
  );
}
