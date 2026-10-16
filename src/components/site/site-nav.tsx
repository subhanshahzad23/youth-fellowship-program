"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { NavigationMenu as NM } from "radix-ui";
import { ArrowUpRight, ChevronDown, ChevronRight, Menu as MenuIcon, X } from "lucide-react";
import { NAV, OFFER } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

/*
 * Floating white navigation bar: 16px from the top, rounded 16px, soft float
 * shadow, sticky. Two dropdowns (Services, Who we serve) as the brief asks,
 * plus About and Resources. "Book a call" is jade over the dark hero and turns
 * black once the page scrolls past it.
 */

export function SiteNav({ overDark = false }: { overDark?: boolean }) {
  const pathname = usePathname();
  const [pastHero, setPastHero] = useState(!overDark);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuValue, setMenuValue] = useState("");

  useEffect(() => {
    if (!overDark) return;
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { rootMargin: "-80px 0px 0px 0px", threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, [overDark, pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileOpen]);

  const close = () => setMenuValue("");
  const dropdown =
    "absolute left-0 top-full z-10 mt-3 rounded-[16px] bg-paper p-2 shadow-float before:absolute before:inset-x-0 before:-top-3 before:h-3 before:content-[''] data-[state=open]:animate-[pop-in_180ms_cubic-bezier(0.23,1,0.32,1)]";
  const trigger =
    "group inline-flex h-10 items-center gap-1 rounded-[8px] px-3.5 text-[15.5px] text-void transition-colors duration-200 hover:bg-fog data-[state=open]:bg-fog data-[active]:bg-fog focus-visible:outline-2 focus-visible:outline-void";
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="no-print sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-10">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center rounded-[16px] bg-paper pl-4 pr-2 shadow-float sm:pr-3">
          <Link href="/" className="flex shrink-0 items-center rounded-[8px] pr-2" aria-label="Goodcase home">
            <Logo />
          </Link>
          <span className="mx-4 hidden h-7 w-px bg-line lg:block" aria-hidden />

          <NM.Root className="relative hidden lg:block" delayDuration={80} value={menuValue} onValueChange={setMenuValue} aria-label="Main">
            <NM.List className="flex items-center gap-0.5">
              <NM.Item value="services" className="relative">
                <NM.Trigger className={trigger} data-active={NAV.services.some((l) => isActive(l.href)) || undefined}>
                  Services <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                </NM.Trigger>
                <NM.Content className={dropdown + " w-[560px]"}>
                  <div className="grid grid-cols-[1fr_200px] gap-2">
                    <ul>
                      {NAV.services.map((l) => (
                        <li key={l.href}>
                          <NM.Link asChild active={isActive(l.href)}>
                            <Link href={l.href} onClick={close} className="group/l flex items-start gap-3 rounded-[12px] p-3 transition-colors hover:bg-fog focus-visible:bg-fog focus-visible:outline-none data-[active]:bg-fog">
                              <span className="min-w-0 flex-1">
                                <span className="block font-display text-[22px] leading-tight tracking-[-0.02em] text-void">{l.title}</span>
                                <span className="mt-0.5 block text-[13.5px] text-muted">{l.desc}</span>
                              </span>
                              <ArrowUpRight className="mt-1 size-4 text-muted transition-transform duration-300 group-hover/l:-translate-y-0.5 group-hover/l:translate-x-0.5" aria-hidden />
                            </Link>
                          </NM.Link>
                        </li>
                      ))}
                    </ul>
                    <Link href="/case-drafting#pricing" onClick={close} className="dots-dark on-dark flex flex-col justify-between rounded-[12px] p-4 text-paper">
                      <span className="eyebrow text-mint">Open pricing</span>
                      <span>
                        <span className="block font-display text-[30px] leading-none tracking-[-0.03em]">$500</span>
                        <span className="mt-1 block text-[13px] text-muted-display">flat fee per case, from</span>
                        <span className="mt-3 block text-[13px] leading-snug text-paper/90">{OFFER.items[0]} · {OFFER.items[1].toLowerCase()}</span>
                      </span>
                    </Link>
                  </div>
                </NM.Content>
              </NM.Item>
              <NM.Item value="who" className="relative">
                <NM.Trigger className={trigger} data-active={isActive("/who-we-serve") || undefined}>
                  Who we serve <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                </NM.Trigger>
                <NM.Content className={dropdown + " w-[400px]"}>
                  <ul>
                    {NAV.whoWeServe.map((l, i) => (
                      <li key={l.href}>
                        <NM.Link asChild active={pathname === l.href}>
                          <Link href={l.href} onClick={close} className={cn("flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-fog focus-visible:bg-fog focus-visible:outline-none data-[active]:bg-fog", i === 0 && "mb-1 border-b border-line pb-3")}>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] text-void">{l.title}</span>
                              <span className="block text-[13px] text-muted">{l.desc}</span>
                            </span>
                            <ChevronRight className="size-4 text-muted" aria-hidden />
                          </Link>
                        </NM.Link>
                      </li>
                    ))}
                  </ul>
                </NM.Content>
              </NM.Item>
              {NAV.links.map((l) => (
                <NM.Item key={l.href}>
                  <NM.Link asChild active={isActive(l.href)}>
                    <Link href={l.href} className={trigger}>
                      {l.title}
                    </Link>
                  </NM.Link>
                </NM.Item>
              ))}
            </NM.List>
          </NM.Root>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <a href="mailto:info@goodcase.io" className="hidden h-10 items-center rounded-[8px] px-3 text-[15px] font-medium hover:bg-fog xl:inline-flex">
              info@goodcase.io
            </a>
            <ButtonLink href="/book-a-call" variant={pastHero ? "dark" : "primary"} arrow className="hidden sm:inline-flex" data-testid="nav-cta">
              Book a call
            </ButtonLink>
            <ButtonLink href="/book-a-call" variant={pastHero ? "dark" : "primary"} size="sm" className="h-10 sm:hidden">
              Book a call
            </ButtonLink>
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
              <MobileGroup title="Services" links={NAV.services.map((l) => ({ href: l.href, label: l.title }))} onNavigate={() => setMobileOpen(false)} />
              <MobileGroup title="Who we serve" links={NAV.whoWeServe.map((l) => ({ href: l.href, label: l.title }))} onNavigate={() => setMobileOpen(false)} />
              {NAV.links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="flex h-14 items-center border-b border-line text-[18px]">
                  {l.title}
                </Link>
              ))}
              <div className="mt-8 flex flex-col gap-3">
                <ButtonLink href="/book-a-call" size="lg" arrow className="w-full" onClick={() => setMobileOpen(false)}>
                  Book a 30-minute call
                </ButtonLink>
                <p className="text-center text-[13.5px] text-muted">{OFFER.items.join(" · ")}</p>
                <a href="mailto:info@goodcase.io" className="mt-2 flex h-12 items-center justify-center rounded-[8px] border-[1.5px] border-line text-[16px] font-medium">
                  info@goodcase.io
                </a>
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
