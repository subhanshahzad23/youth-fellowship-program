"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { COMPANY, FOOTER_COLUMNS, OFFER } from "@/lib/content/site";
import { EMAIL_RE, useLeads } from "@/lib/leads";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Footer: newsletter signup (brief requirement), link columns, legal details and the oversized wordmark. */
export function SiteFooter() {
  return (
    <footer className="bg-paper" aria-labelledby="footer-h">
      <h2 id="footer-h" className="sr-only">
        Footer
      </h2>
      <div className="container-page pt-16">
        <Newsletter />

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title} className="min-w-0">
              <p className="text-[16px] font-medium">{c.title}</p>
              <ul className="mt-4 space-y-1.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15.5px] font-light leading-7 text-void hover:underline hover:underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 border-t border-line pt-8 lg:grid-cols-[1.4fr_1fr]">
          <p className="max-w-[72ch] text-[13px] leading-relaxed text-muted">{COMPANY.disclaimer}</p>
          <div className="text-[13px] leading-relaxed text-muted lg:text-right">
            <p className="font-medium text-void">{COMPANY.legalName}</p>
            <p>{COMPANY.address}</p>
            <p>{COMPANY.registry}</p>
            <p>
              <a href={`mailto:${COMPANY.email}`} className="text-void underline underline-offset-4">
                {COMPANY.email}
              </a>
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Goodcase. All rights reserved.</p>
          <p>
            <span className="rounded-[26px] bg-leaf px-2.5 py-0.5 font-medium text-leaf-ink">Design concept · forms are simulated</span>
          </p>
        </div>
      </div>
      {/* Oversized wordmark closing the page. */}
      <div className="mt-10 overflow-hidden px-[10px]" aria-hidden>
        <div className="flex items-end justify-center gap-[1.5vw] pb-[1.2vw] leading-[0.8]">
          <LogoMark className="size-[12.5vw] shrink-0" />
          <span className="text-[17.5vw] font-semibold tracking-[-0.065em]">Goodcase</span>
        </div>
      </div>
    </footer>
  );
}

function Newsletter() {
  const subscribe = useLeads((s) => s.subscribe);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | "new" | "dup">(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid work email, like name@yourfirm.com.");
      return;
    }
    setError("");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 450));
    const { duplicate } = subscribe(email);
    setBusy(false);
    setDone(duplicate ? "dup" : "new");
  };

  return (
    <section aria-labelledby="nl-h" className="dots-dark on-dark grid grid-cols-1 gap-8 rounded-[24px] p-6 text-paper sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:p-12">
      <div className="min-w-0">
        <p className="eyebrow text-mint">Newsletter</p>
        <h3 id="nl-h" className="display-md mt-3 max-w-[20ch]">
          Modern Immigration Practice <span className="text-muted-display">— one useful email a month.</span>
        </h3>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-paper/75">Pricing benchmarks, scaling playbooks and safe-AI practice for immigration firms. Written by the people who draft your petitions. No spam, unsubscribe anytime.</p>
      </div>
      <div className="min-w-0">
        {done ? (
          <div role="status" className="flex items-start gap-3 rounded-[16px] bg-paper/10 p-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-jade text-void">
              <Check className="size-5" />
            </span>
            <div>
              <p className="text-[16px] font-medium">{done === "dup" ? "You're already on the list." : "You're subscribed."}</p>
              <p className="mt-1 text-[14px] text-paper/70">Concept site: your email stays in this browser and nothing is sent.</p>
              <button type="button" className="mt-2 text-[14px] text-mint underline underline-offset-4" onClick={() => { setDone(null); setEmail(""); }}>
                Use another email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate aria-describedby={error ? "nl-err" : undefined}>
            <label htmlFor="nl-email" className="text-[14px] font-medium text-paper">
              Work email
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-paper/50" aria-hidden />
                <input
                  id="nl-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error || undefined}
                  placeholder="name@yourfirm.com"
                  className="h-12 w-full rounded-[8px] border-[1.5px] border-dark-line bg-transparent pl-10 pr-3 text-[15.5px] text-paper placeholder:text-paper/40 focus:border-jade focus:outline-none aria-[invalid=true]:border-[#ff6b6b]"
                />
              </div>
              <Button type="submit" size="lg" arrow loading={busy}>
                Subscribe
              </Button>
            </div>
            {error && (
              <p id="nl-err" role="alert" className="mt-2 text-[14px] text-[#ff9b9b]">
                {error}
              </p>
            )}
            <p className="mt-3 text-[12.5px] text-paper/55">By subscribing you agree to our <Link href="/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link>. {OFFER.items[2]} — on emails too.</p>
          </form>
        )}
      </div>
    </section>
  );
}
