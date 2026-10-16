import type { Metadata } from "next";
import { BellRing, CalendarClock, ClipboardList, FolderInput, Inbox, MessagesSquare, RefreshCcw, Workflow } from "lucide-react";
import { FAQS } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { PlaceholderTag, SectionHeader } from "@/components/gc/section";
import { SecurityCard } from "@/components/gc/security";
import { PricingBlock } from "@/components/gc/pricing";
import { FeaturedTestimonial } from "@/components/gc/testimonials";
import { FaqBlock } from "@/components/gc/faq";
import { FinalCta } from "@/components/gc/final-cta";

export const metadata: Metadata = {
  title: "Case management",
  description: "An experienced immigration case manager working inside your firm — intake, documents, follow-ups, deadlines and RFEs — supported by Casey, our case management software.",
};

const DUTIES = [
  { icon: FolderInput, title: "Intake and onboarding", body: "Questionnaires sent, answers chased, new matters opened the same day." },
  { icon: Inbox, title: "Document collection", body: "Checklists per case type, reminders to clients, files named and filed." },
  { icon: MessagesSquare, title: "Client follow-ups", body: "Polite, persistent and in your firm's name — so you stop chasing." },
  { icon: CalendarClock, title: "Deadline tracking", body: "Filing windows, expirations and response dates — visible to your team." },
  { icon: RefreshCcw, title: "RFE coordination", body: "Evidence gathered, drafters briefed, responses kept on schedule." },
  { icon: BellRing, title: "Status updates", body: "A weekly summary for you, timely updates for clients when you approve." },
  { icon: Workflow, title: "Works in your tools", body: "Your email, your case software, your templates. Casey if you want it." },
  { icon: ClipboardList, title: "Process, written down", body: "We document your workflow as we learn it, so it survives growth." },
];

const WEEK = [
  ["Mon", "Weekly plan", "Priorities and deadlines for the week, sent to you by 9 AM."],
  ["Tue", "Client outreach", "Document requests and reminders go out; replies logged."],
  ["Wed", "Drafting handoffs", "Complete evidence packages handed to the drafting team."],
  ["Thu", "Review prep", "Drafts back from review, queued for your read with notes."],
  ["Fri", "Status report", "What moved, what's blocked, what needs your decision."],
];

const CASES = [
  ["O-1A · #1041", "Drafting", "Draft to attorney Thu", "jade"],
  ["EB-1A · #1031", "RFE response", "Due in 5 days", "amber"],
  ["EB-2 NIW · #1044", "Documents", "3 of 7 received", "sky"],
  ["H-1B · B1-012", "With attorney", "Ready to sign", "leaf"],
  ["L-1A · #2201", "Review", "Citations 38/42", "jade"],
] as const;

export default function CaseManagementPage() {
  return (
    <PublicShell>
      <PublicHero
        eyebrow="Service 02 · Case management"
        title="A case manager inside your firm,"
        muted="backed by Casey."
        aside={
          <div className="rounded-[24px] bg-paper p-6 text-void shadow-panel sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-[#ffe7a3] text-[14px] font-semibold text-[#7a4b00]">BL</span>
              <div>
                <p className="text-[15px] font-semibold leading-tight">Your case manager</p>
                <p className="text-[13px] text-muted">Today · 6 tasks, 2 need you</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {[
                ["Sent document checklist", "NIW #1044", true],
                ["Chased passport scan", "O-1A #1046", true],
                ["Briefed drafter on RFE evidence", "EB-1A #1031", true],
                ["Approve client status update", "H-1B B1-012", false],
                ["Decide: add 6th support letter?", "O-1A #1041", false],
              ].map(([t, c, done]) => (
                <li key={t as string} className={cn("flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px]", done ? "bg-fog" : "bg-leaf text-leaf-ink")}>
                  <span className={cn("size-2 shrink-0 rounded-full", done ? "bg-[#9a9a9a]" : "bg-jade")} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{t}</span>
                  <span className="shrink-0 text-[12px] opacity-70">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          An experienced immigration case manager runs intake, collects documents, chases clients, tracks every deadline and keeps you updated — inside your firm, under your name.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/book-a-call" size="lg" arrow>
            Book a 30-minute call
          </ButtonLink>
          <ButtonLink href="#casey" size="lg" variant="ghost-dark">
            Meet Casey
          </ButtonLink>
        </div>
      </PublicHero>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="duties-h">
        <div className="container-page">
          <SectionHeader id="duties-h" eyebrow="What your case manager does" title="Everything between the strategy" muted="and the signature." lede="The work that keeps a case moving but doesn't need a law license. Handled by one named person who knows your firm." />
          <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DUTIES.map((d, i) => (
              <Reveal as="li" key={d.title} delay={(i % 4) * 0.05} className="min-w-0 rounded-[20px] bg-fog p-6">
                <d.icon className="size-6 text-leaf-ink" aria-hidden />
                <h3 className="mt-5 text-[17px] font-medium">{d.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="casey" className="scroll-mt-24 bg-[#eef1ef] py-[var(--space-section)]" aria-labelledby="casey-h">
        <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.85fr_1.4fr]">
          <Reveal className="min-w-0">
            <p className="eyebrow text-void">Casey</p>
            <h2 id="casey-h" className="display-xl mt-4">
              Every case, <span className="text-muted-display">visible.</span>
            </h2>
            <p className="mt-5 max-w-[480px] text-[17px] leading-[1.6] text-ink">
              Casey is the case management software we built for immigration work. Your team sees status, deadlines, RFEs and client documents in one place — and so does your case manager.
            </p>
            <ul className="mt-6 space-y-2 text-[15px]">
              {["Case list with stages and owners", "Deadline and RFE tracker", "Client document portal", "Reporting for partners"].map((x) => (
                <li key={x} className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full bg-void" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/casey" variant="dark" arrow>
                Learn about Casey
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="min-w-0">
            <div className="overflow-hidden rounded-[20px] bg-paper shadow-panel">
              <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
                <LogoMark className="size-6" />
                <p className="text-[14px] font-semibold">Casey</p>
                <span className="text-[13px] text-muted">/ Your firm</span>
                <PlaceholderTag className="ml-auto">Interface mock</PlaceholderTag>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr]">
                <div className="min-w-0 p-4 sm:p-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Active cases</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-[13px]">
                      <thead>
                        <tr className="text-[11.5px] text-muted">
                          <th className="pb-2 font-medium">Case</th>
                          <th className="pb-2 font-medium">Stage</th>
                          <th className="pb-2 font-medium">Next</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {CASES.map(([c, s, n, tone]) => (
                          <tr key={c}>
                            <td className="py-2.5 font-medium">{c}</td>
                            <td className="py-2.5">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[11.5px] font-medium",
                                  tone === "jade" && "bg-leaf text-leaf-ink",
                                  tone === "amber" && "bg-[#fff1cc] text-[#7a4b00]",
                                  tone === "sky" && "bg-[#e3efff] text-[#195ad7]",
                                  tone === "leaf" && "bg-void text-paper",
                                )}
                              >
                                {s}
                              </span>
                            </td>
                            <td className="py-2.5 text-muted">{n}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="min-w-0 space-y-3 border-t border-line bg-[#fafafa] p-4 sm:p-5 md:border-l md:border-t-0">
                  <div className="rounded-[12px] bg-void p-3.5 text-paper">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-display">RFE tracker</p>
                    <p className="mt-1 text-[14px]">EB-1A · #1031</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#333]">
                      <div className="h-full w-[70%] rounded-full bg-jade" />
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-muted-display">Evidence 7 of 10 · response due in 5 days</p>
                  </div>
                  <div className="rounded-[12px] bg-paper p-3.5 ring-1 ring-black/5">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted">Client portal</p>
                    <ul className="mt-2 space-y-1.5 text-[12.5px]">
                      <li className="flex justify-between">
                        <span>Passport scan</span>
                        <span className="text-leaf-ink">Received</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Degree evaluation</span>
                        <span className="text-[#7a4b00]">Reminder sent</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Support letter #3</span>
                        <span className="text-muted">Requested</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-[12px] bg-paper p-3.5 ring-1 ring-black/5">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted">This month</p>
                    <p className="mt-1 font-display text-[28px] leading-none tracking-[-0.03em]">14 filed</p>
                    <p className="mt-1 text-[12px] text-muted">Sample data · illustrative</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper py-[var(--space-section)]" aria-labelledby="week-h">
        <div className="container-page">
          <SectionHeader id="week-h" eyebrow="A week with your case manager" title="A rhythm you can count on." lede="Predictable, written down and adjustable. Most firms are onboarded within a week of the first call." />
          <ol className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-5">
            {WEEK.map(([d, t, b], i) => (
              <Reveal as="li" key={d} delay={i * 0.05} className="min-w-0 rounded-[20px] border-[1.5px] border-line p-6">
                <p className="font-display text-[40px] font-light leading-none tracking-[-0.04em]">{d}</p>
                <p className="mt-4 text-[16px] font-medium">{t}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{b}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <SecurityCard />
      <PricingBlock />
      <FeaturedTestimonial id="practical" />
      <FaqBlock items={FAQS.filter((f) => f.topic === "Working together" || f.topic === "Security" || f.topic === "Pricing")} />
      <FinalCta title="Meet your case manager on a call." />
    </PublicShell>
  );
}
