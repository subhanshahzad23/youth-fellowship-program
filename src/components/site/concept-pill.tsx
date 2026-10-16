"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Layers, RotateCcw } from "lucide-react";
import { useLeads } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlay";

/** Page index for reviewers, grouped exactly like the brief's site map. */
const INDEX: { group: string; pages: { href: string; label: string }[] }[] = [
  {
    group: "Main",
    pages: [
      { href: "/", label: "Home" },
      { href: "/case-drafting", label: "Case drafting" },
      { href: "/case-management", label: "Case management" },
      { href: "/about", label: "About · process · security" },
      { href: "/book-a-call", label: "Book a call" },
    ],
  },
  {
    group: "Who we serve",
    pages: [
      { href: "/who-we-serve", label: "Overview" },
      { href: "/who-we-serve/solo-and-small-firms", label: "Solo and small firms" },
      { href: "/who-we-serve/growing-firms", label: "Growing firms" },
      { href: "/who-we-serve/large-and-high-volume", label: "Large and high-volume" },
    ],
  },
  {
    group: "Resources",
    pages: [
      { href: "/resources", label: "Resource hub" },
      { href: "/blog", label: "Blog" },
      { href: "/podcast", label: "Podcast" },
      { href: "/case-studies", label: "Case studies" },
      { href: "/sample-work", label: "Sample work" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    group: "Other",
    pages: [
      { href: "/casey", label: "Casey" },
      { href: "/ai-use-policy", label: "AI Use Policy" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/design-system", label: "Design system" },
    ],
  },
];

/** Reviewer-only control, visually separate from the site itself. */
export function ConceptPill() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reset = useLeads((s) => s.reset);

  return (
    <div className="no-print fixed bottom-4 left-4 z-[60]">
      <PopoverRoot open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-testid="concept-pill"
            className="group flex h-10 items-center gap-2 rounded-full border border-white/10 bg-void pl-1.5 pr-3 text-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5"
            aria-label="Open design concept page index"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#2b2b2b]">
              <Layers className="size-3.5 text-jade" aria-hidden />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[10.5px] font-semibold tracking-[0.02em] text-jade">Design concept</span>
              <span className="hidden text-[12px] text-paper/85 sm:block">Goodcase · Part B</span>
            </span>
            <ChevronDown className="size-3.5 text-paper/60 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-[min(92vw,380px)] overflow-hidden p-0">
          <div className="bg-void px-4 py-3 text-paper">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-jade">Reviewer panel</p>
            <p className="mt-0.5 text-[13px] text-paper/70">Not part of the site. Forms and bookings are simulated — nothing is sent.</p>
          </div>
          <nav className="max-h-[min(64vh,520px)] overflow-y-auto p-3" aria-label="Page index">
            {INDEX.map((g) => (
              <div key={g.group} className="mb-3 last:mb-0">
                <p className="eyebrow px-2 pb-1 text-muted">{g.group}</p>
                <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                  {g.pages.map((p) => {
                    const active = pathname === p.href;
                    return (
                      <li key={p.href} className="min-w-0">
                        <Link
                          href={p.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn("block truncate rounded-[8px] px-2 py-1.5 text-[13.5px] transition-colors hover:bg-fog", active && "bg-leaf text-leaf-ink")}
                        >
                          {p.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
            <p className="text-[12px] text-muted">Placeholders are labelled on the page.</p>
            <button
              type="button"
              onClick={() => {
                reset();
                toast.success("Simulated bookings and messages cleared");
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-2 py-1 text-[12.5px] text-muted hover:bg-fog hover:text-void"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Reset forms
            </button>
          </div>
        </PopoverContent>
      </PopoverRoot>
    </div>
  );
}
