"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { NavigationMenu as NM } from "radix-ui";
import { ArrowUpRight, ChevronDown, Menu as MenuIcon, X } from "lucide-react";
import { formForCohort, sortedCohorts, windowState } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { cn, fmtDateShort } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlay";

/*
 * Floating white navigation bar (observed on mural.co: 16px from the top,
 * 40px side inset, 64px tall, 16px radius, blue-tinted float shadow, sticky).
 * The primary CTA is jade over the dark hero and switches to black once the
 * page scrolls past it (observed). Dropdowns open on hover and keyboard.
 */

const FELLOWSHIP_LINKS = [
  { href: "/#program", title: "The program", desc: "18 months, three tracks, one cohort" },
  { href: "/#journey", title: "How it works", desc: "From application to building with mentors" },
  { href: "/#safeguarding", title: "Safeguarding", desc: "Cohort boundaries and supervised messaging" },
  { href: "/#dates", title: "Dates & cohorts", desc: "Open, upcoming and active cohorts" },
  { href: "/#stories", title: "Fellow stories", desc: "Fictional examples of ventures" },
];

export function SiteNav({ overDark = false }: { overDark?: boolean }) {
  const db = useDb();
  const [scrolledPastHero, setScrolledPastHero] = useState(!overDark);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuValue, setMenuValue] = useState("");
  const tracks = useMemo(() => Object.values(db.tracks).sort((a, b) => a.order - b.order), [db.tracks]);

  useEffect(() => {
    if (!overDark) return;
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setScrolledPastHero(!e.isIntersecting), { rootMargin: "-80px 0px 0px 0px", threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, [overDark]);

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileOpen]);

  const dropdown =
    "absolute left-0 top-full z-10 mt-3 rounded-[16px] bg-paper p-2 shadow-float before:absolute before:inset-x-0 before:-top-3 before:h-3 before:content-[''] data-[state=open]:animate-[pop-in_180ms_cubic-bezier(0.23,1,0.32,1)]";
  const trigger =
    "group inline-flex h-10 items-center gap-1 rounded-[8px] px-3.5 text-[15.5px] text-void transition-colors duration-200 hover:bg-fog data-[state=open]:bg-fog focus-visible:outline-2 focus-visible:outline-void";

  return (
    <>
      <header className="no-print sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-10">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center rounded-[16px] bg-paper pl-4 pr-2 shadow-float sm:pr-3">
          <Link href="/" className="flex shrink-0 items-center rounded-[8px] pr-2" aria-label="Launchpad Fellowship home">
            <Logo responsive />
          </Link>
          <span className="mx-4 hidden h-7 w-px bg-line lg:block" aria-hidden />

          <NM.Root className="relative hidden lg:block" delayDuration={80} value={menuValue} onValueChange={setMenuValue}>
            <NM.List className="flex items-center gap-0.5">
              <NM.Item className="relative">
                <NM.Trigger className={trigger}>
                  Fellowship <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                </NM.Trigger>
                <NM.Content className={dropdown + " w-[340px]"}>
                  <ul>
                    {FELLOWSHIP_LINKS.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} onClick={() => setMenuValue("")} className="block rounded-[10px] px-3 py-2.5 transition-colors hover:bg-fog focus-visible:bg-fog focus-visible:outline-none">
                          <span className="block text-[15px] text-void">{l.title}</span>
                          <span className="block text-[13px] text-muted">{l.desc}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NM.Content>
              </NM.Item>
              <NM.Item className="relative">
                <NM.Trigger className={trigger}>
                  Tracks <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                </NM.Trigger>
                <NM.Content className={dropdown + " w-[520px]"}>
                  <ul className="grid grid-cols-1 gap-1">
                    {tracks.map((t) => (
                      <li key={t.id}>
                        <Link href={`/tracks/${t.slug}`} onClick={() => setMenuValue("")} className="group/t flex items-start gap-4 rounded-[12px] p-3 transition-colors hover:bg-fog focus-visible:bg-fog focus-visible:outline-none">
                            <span className="mt-1 size-3 shrink-0 rounded-[3px]" style={{ background: t.color }} aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block font-display text-[22px] leading-tight tracking-[-0.02em] text-void">{t.name}</span>
                              <span className="mt-0.5 block text-[13.5px] text-muted">{t.tagline}</span>
                            </span>
                            <ArrowUpRight className="mt-1 size-4 text-muted transition-transform duration-300 group-hover/t:-translate-y-0.5 group-hover/t:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NM.Content>
              </NM.Item>
              <NM.Item>
                <NM.Link asChild>
                  <Link href="/#journey" className={trigger}>
                    How it works
                  </Link>
                </NM.Link>
              </NM.Item>
              <NM.Item>
                <NM.Link asChild>
                  <Link href="/#faqs" className={trigger}>
                    FAQs
                  </Link>
                </NM.Link>
              </NM.Item>
            </NM.List>
          </NM.Root>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link href="/demo" className="hidden h-10 items-center rounded-[8px] px-3 text-[15px] font-medium hover:bg-fog md:inline-flex">
              Sign in
            </Link>
            <ButtonLink href="/demo" variant="outline" className="hidden md:inline-flex">
              Explore demo
            </ButtonLink>
            <ApplyButton dark={scrolledPastHero} />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-11 place-items-center rounded-[8px] hover:bg-fog lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <MenuIcon className="size-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[65] flex flex-col bg-paper lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="flex h-[88px] items-center justify-between px-7">
              <Logo />
              <button type="button" onClick={() => setMobileOpen(false)} className="grid size-11 place-items-center rounded-[8px] hover:bg-fog" aria-label="Close menu" autoFocus>
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-7 pb-8" aria-label="Mobile">
              <MobileGroup title="Fellowship" links={FELLOWSHIP_LINKS.map((l) => ({ href: l.href, label: l.title }))} onNavigate={() => setMobileOpen(false)} />
              <MobileGroup title="Tracks" links={tracks.map((t) => ({ href: `/tracks/${t.slug}`, label: t.name }))} onNavigate={() => setMobileOpen(false)} />
              <Link href="/#journey" onClick={() => setMobileOpen(false)} className="flex h-14 items-center border-b border-line text-[18px]">
                How it works
              </Link>
              <Link href="/#faqs" onClick={() => setMobileOpen(false)} className="flex h-14 items-center border-b border-line text-[18px]">
                FAQs
              </Link>
              <div className="mt-8 flex flex-col gap-2">
                <Link href="/demo" onClick={() => setMobileOpen(false)} className="flex h-12 items-center justify-center text-[16px] font-medium">
                  Sign in
                </Link>
                <ButtonLink href="/demo" variant="outline" size="lg" className="w-full">
                  Explore demo
                </ButtonLink>
                <ButtonLink href="/#dates" size="lg" arrow className="w-full">
                  Apply
                </ButtonLink>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileGroup({ title, links, onNavigate }: { title: string; links: { href: string; label: string }[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-14 w-full items-center justify-between text-[18px]" aria-expanded={open}>
        {title}
        <ChevronDown className={cn("size-5 transition-transform duration-300", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={onNavigate} className="flex h-11 items-center pl-3 text-[16px] text-muted hover:text-void">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="h-2" />
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Apply CTA: lists every open intake (more than one can be open at once). */
function ApplyButton({ dark }: { dark: boolean }) {
  const db = useDb();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const intakes = useMemo(
    () =>
      sortedCohorts(db)
        .map((c) => ({ c, f: formForCohort(db, c.id) }))
        .filter(({ f }) => f && ["open", "upcoming"].includes(windowState(f, now))),
    [db, now],
  );
  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group/btn relative inline-flex h-10 items-center overflow-hidden rounded-[8px] pl-4 pr-[52px] text-[15px] font-medium transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
            dark ? "bg-void text-paper" : "bg-jade text-void",
          )}
        >
          <span aria-hidden className={cn("pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100", dark ? "bg-white/12" : "bg-black/10")} />
          <span className="relative">Apply</span>
          <span aria-hidden className={cn("absolute bottom-[2px] right-[2px] top-[2px] grid w-9 place-items-center rounded-[6px] transition-colors duration-300", dark ? "bg-[#4b4b4b] text-paper" : "bg-mint text-void")}>
            <ChevronDown className="size-[18px] transition-transform duration-300 group-data-[state=open]/btn:rotate-180" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,340px)] p-2">
        <p className="px-3 pb-1 pt-2 text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted">Choose an intake</p>
        <ul>
          {intakes.map(({ c, f }) => {
            const ws = windowState(f, now);
            return (
              <li key={c.id}>
                <Link href={`/apply/${c.slug}`} onClick={() => setOpen(false)} className="group/i flex items-center justify-between gap-3 rounded-[10px] px-3 py-3 hover:bg-fog">
                  <span>
                    <span className="block text-[15px] font-medium">{c.name}</span>
                    <span className="block text-[13px] text-muted">{ws === "open" ? `Open · closes ${fmtDateShort(f!.closesAt)}` : `Opens ${fmtDateShort(f!.opensAt)} · register interest`}</span>
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-medium", ws === "open" ? "bg-leaf text-leaf-ink" : "bg-fog text-ink")}>{ws === "open" ? "Open" : "Soon"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href="/#dates" onClick={() => setOpen(false)} className="mt-1 block rounded-[10px] px-3 py-2 text-[13.5px] text-muted hover:bg-fog hover:text-void">
          All dates and cohorts →
        </Link>
      </PopoverContent>
    </PopoverRoot>
  );
}
