"use client";

import { useState } from "react";
import Link from "next/link";
import { useDb } from "@/lib/store/store";
import { LogoMark } from "@/components/brand/logo";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";

type DocKey = "privacy" | "terms" | "accessibility" | "contact";

const DOCS: Record<DocKey, { title: string; body: React.ReactNode }> = {
  privacy: {
    title: "Privacy notice (demo)",
    body: (
      <div className="space-y-3 text-[15px] leading-relaxed">
        <p>This is a demonstration site with fictional data. Nothing you type is sent to a server: records are stored in your browser&apos;s localStorage and files you add are stored in IndexedDB on this device only.</p>
        <p>You can clear everything at any time with <strong>Reset demo data</strong> in the demo controls.</p>
        <p>For the production program, a full privacy notice will explain what is collected from applicants (including 16–17-year-olds), who can see it, how long it is kept and how to request deletion. Those policies still need client confirmation.</p>
      </div>
    ),
  },
  terms: {
    title: "Terms of use (demo)",
    body: (
      <div className="space-y-3 text-[15px] leading-relaxed">
        <p>Launchpad Fellowship is a fictional program created to demonstrate a platform. People, ventures, places, dates, documents and messages are invented.</p>
        <p>Please don&apos;t upload real identity documents or personal information to this demo. Use the bundled sample documents instead.</p>
      </div>
    ),
  },
  accessibility: {
    title: "Accessibility",
    body: (
      <div className="space-y-3 text-[15px] leading-relaxed">
        <p>The demo is built to work with a keyboard and screen readers: semantic landmarks, visible focus, labelled form fields, error summaries, accessible dialogs, captions and transcripts on videos, and text alongside colour for every status.</p>
        <p>If you prefer reduced motion, pinned scrolling, parallax and decorative loops are switched off automatically.</p>
        <p>Found something hard to use? In a production build this would link to a real contact route.</p>
      </div>
    ),
  },
  contact: {
    title: "Contact",
    body: (
      <div className="space-y-3 text-[15px] leading-relaxed">
        <p>Launchpad Fellowship (fictional)</p>
        <p>Larkhaven Makers Hall, 5 College Lane, Eastbank, Larkhaven 00212</p>
        <p>hello@launchpad-fellowship.example · (000) 000-0000</p>
        <p className="text-muted">These details are placeholders for the demo.</p>
      </div>
    ),
  },
};

export function SiteFooter() {
  const db = useDb();
  const [doc, setDoc] = useState<DocKey | null>(null);
  const tracks = Object.values(db.tracks).sort((a, b) => a.order - b.order);
  const cohorts = Object.values(db.cohorts).sort((a, b) => (a.startDate < b.startDate ? -1 : 1));

  const cols: { title: string; links: ({ label: string; href: string } | { label: string; doc: DocKey })[] }[] = [
    {
      title: "Fellowship",
      links: [
        { label: "The program", href: "/#program" },
        { label: "How it works", href: "/#journey" },
        { label: "Safeguarding", href: "/#safeguarding" },
        { label: "Fellow stories", href: "/#stories" },
        { label: "FAQs", href: "/#faqs" },
      ],
    },
    { title: "Tracks", links: tracks.map((t) => ({ label: t.name, href: `/tracks/${t.slug}` })) },
    { title: "Cohorts", links: [...cohorts.map((c) => ({ label: c.name, href: `/cohorts/${c.slug}` })), { label: "All dates", href: "/#dates" }] },
    {
      title: "Demo",
      links: [
        { label: "Explore the demo", href: "/demo" },
        { label: "Sign in", href: "/demo" },
        { label: "Applicant portal", href: "/applicant/dashboard" },
        { label: "Fellow workspace", href: "/workspace/dashboard" },
      ],
    },
    {
      title: "Legal & privacy",
      links: [
        { label: "Privacy notice", doc: "privacy" },
        { label: "Terms of use", doc: "terms" },
        { label: "Accessibility", doc: "accessibility" },
        { label: "Contact", doc: "contact" },
      ],
    },
  ];

  return (
    <footer className="bg-paper" aria-labelledby="footer-h">
      <h2 id="footer-h" className="sr-only">
        Footer
      </h2>
      <div className="container-page pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-[16px] font-medium">{c.title}</p>
              <ul className="mt-4 space-y-1.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"href" in l ? (
                      <Link href={l.href} className="text-[15.5px] font-light leading-7 text-void hover:underline hover:underline-offset-4">
                        {l.label}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => setDoc(l.doc)} className="text-left text-[15.5px] font-light leading-7 text-void hover:underline hover:underline-offset-4">
                        {l.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Launchpad Fellowship — a fictional program for demonstration.</p>
          <p>
            <span className="rounded-[26px] bg-leaf px-2.5 py-0.5 font-medium text-leaf-ink">Demo · fictional data</span>
          </p>
        </div>
      </div>
      {/* Oversized wordmark (observed: the footer ends with a giant logo). */}
      <div className="mt-10 overflow-hidden px-[10px]" aria-hidden>
        <div className="flex items-end justify-center gap-[1.5vw] pb-[1vw] leading-[0.8]">
          <LogoMark className="size-[12.5vw] shrink-0" />
          <span className="font-display text-[16.4vw] font-light tracking-[-0.06em]">Launchpad</span>
        </div>
      </div>

      {doc && (
        <DialogRoot open={!!doc} onOpenChange={(v) => !v && setDoc(null)}>
          <DialogContent title={DOCS[doc].title}>{DOCS[doc].body}</DialogContent>
        </DialogRoot>
      )}
    </footer>
  );
}
