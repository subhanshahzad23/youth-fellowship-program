import type { Metadata } from "next";
import { CheckCircle2, Clock, Mail, MapPin } from "lucide-react";
import { COMPANY, FAQS } from "@/lib/content/site";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Reveal } from "@/components/site/reveal";
import { Portrait } from "@/components/gc/team";
import { BookingWidget } from "@/components/gc/booking";
import { ContactForm } from "@/components/gc/contact-form";
import { FaqBlock } from "@/components/gc/faq";

export const metadata: Metadata = {
  title: "Book a 30-minute call",
  description: "Book a 30-minute intro call with Goodcase. We'll look at your case types and volume and tell you what your first case would cost — at half price, with a money-back guarantee.",
};

const COVER = ["Your case types and monthly volume", "Where work piles up in your firm today", "How we'd match your templates and tone", "What your first case would cost — at half price"];
const PREPARE = ["A redacted petition you liked (optional)", "Your house templates, if you have them", "The case types you'd hand off first"];

export default function BookACallPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Book a call" title="Thirty minutes." muted="No pitch deck, no pressure.">
        <p className="mt-6 max-w-[600px] text-[17px] leading-[1.6] text-paper/90 sm:text-[18px]">
          Pick a time that suits you. We&apos;ll tell you honestly whether we&apos;re a fit — and if we are, your first case is half price with a money-back guarantee.
        </p>
      </PublicHero>

      <section className="relative bg-paper pb-[var(--space-section)]" aria-label="Schedule your call">
        <div className="dots-dark absolute inset-x-0 top-0 h-[120px]" aria-hidden />
        <div className="container-page relative grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-14">
          <div className="order-2 min-w-0 pt-4 lg:order-1 lg:pt-[150px]">
            <Reveal>
              <h2 className="display-sm">What we&apos;ll cover</h2>
              <ul className="mt-5 space-y-3">
                {COVER.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-[16px]">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-leaf-ink" aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
              <h2 className="display-sm mt-10">Helpful to have</h2>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[15.5px] text-ink">
                {PREPARE.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="mt-10 flex items-center gap-4 rounded-[20px] bg-fog p-4">
                <div className="w-16 shrink-0">
                  <Portrait name="Marta Gronkiewicz" size="sm" className="rounded-[12px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] uppercase tracking-[0.14em] text-muted">You&apos;ll meet</p>
                  <p className="text-[16px] font-medium">Marta Gronkiewicz</p>
                  <p className="text-[14px] text-muted">Onboarding Lead</p>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="order-1 min-w-0 lg:order-2" id="schedule">
            <BookingWidget />
            <p className="mt-3 text-center text-[12.5px] text-muted">Booking calendar embed — simulated in this concept (production: Calendly or HubSpot Meetings).</p>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 bg-fog py-[var(--space-section)]" aria-labelledby="contact-h">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-14">
          <Reveal className="min-w-0">
            <p className="eyebrow text-void">Prefer to write?</p>
            <h2 id="contact-h" className="display-lg mt-4">
              Send us a message.
            </h2>
            <p className="mt-4 max-w-[420px] text-[16.5px] leading-relaxed text-ink">{COMPANY.responseTime} A team lead — not a sales bot — will reply.</p>
            <ul className="mt-8 space-y-4 text-[15px]">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-5 shrink-0" aria-hidden />
                <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-4">
                  {COMPANY.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0" aria-hidden />
                Calls weekdays, 9:00 AM – 2:30 PM Eastern
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span>
                  {COMPANY.legalName}
                  <br />
                  {COMPANY.address}
                </span>
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.06} className="min-w-0 rounded-[24px] bg-paper p-6 sm:p-9">
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <FaqBlock items={FAQS.filter((f) => f.topic === "Working together" || f.topic === "Pricing" || f.q === "Are you a law firm?")} title={<>Before you book.</>} />
    </PublicShell>
  );
}
