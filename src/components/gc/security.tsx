import { EyeOff, FileCheck2, KeyRound, ShieldCheck } from "lucide-react";
import { SECURITY_POINTS } from "@/lib/content/site";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

/*
 * Inset black security card. Statements mirror Goodcase's published AI Use
 * Policy and FAQ — no certifications are claimed.
 */
const ICONS = [EyeOff, FileCheck2, KeyRound, ShieldCheck];

export function SecurityCard({ id = "security", cta = true }: { id?: string; cta?: boolean }) {
  return (
    <section id={id} className="scroll-mt-24 px-[10px] py-6" aria-labelledby={`${id}-h`}>
      <div className="relative mx-auto max-w-[1420px] overflow-hidden rounded-[24px] bg-void text-paper">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
          <Reveal className="min-w-0 px-6 py-14 sm:px-12 sm:py-16 lg:py-20">
            <p className="eyebrow text-paper">Security &amp; confidentiality</p>
            <h2 id={`${id}-h`} className="display-xl mt-4 max-w-[15ch]">
              Your clients&apos; files, <span className="text-muted-display">handled like your own.</span>
            </h2>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.6] text-paper/90">
              Attorneys trust us with passports, A-Numbers and their clients&apos; life stories. So the rules are simple and written down — and people, not tools, do the work.
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {SECURITY_POINTS.map(({ title, body }, i) => {
                const Icon = ICONS[i];
                return (
                  <li key={title}>
                    <Icon className="size-5 text-jade" aria-hidden />
                    <p className="mt-2 text-[16px] font-medium">{title}</p>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-[#bdbdbd]">{body}</p>
                  </li>
                );
              })}
            </ul>
            {cta && (
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/ai-use-policy" arrow>
                  Read our AI Use Policy
                </ButtonLink>
                <ButtonLink href="/about#security" variant="ghost-dark">
                  How we protect data
                </ButtonLink>
              </div>
            )}
          </Reveal>

          <div className="relative min-h-[480px] overflow-hidden lg:min-h-0" aria-hidden>
            <div className="absolute inset-0 bg-[#141414]" />
            <div className="absolute right-0 top-0 h-[70px] w-[36%] bg-forest" />
            <div className="absolute right-0 top-[70px] bg-mint px-4 py-3 text-[14px] font-medium tracking-[0.08em] text-forest">CONFIDENTIAL</div>
            <div className="absolute bottom-[60px] left-0 h-[74px] w-[74px] bg-[#8ae8a1]" />
            <div className="absolute bottom-0 left-[10%] h-[60px] w-[62%] bg-jade" />
            <div className="absolute bottom-0 right-0 h-[18px] w-full bg-mint" />

            <div className="relative mx-auto flex h-full max-w-[420px] flex-col justify-center gap-4 px-6 py-16">
              <div className="rounded-[16px] bg-paper p-4 text-void shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold">Exhibit 14 · Citation check</p>
                  <span className="rounded-full bg-leaf px-2 py-0.5 text-[11px] font-medium text-leaf-ink">Verified</span>
                </div>
                <p className="mt-3 rounded-[10px] bg-fog px-3 py-2 text-[12.5px]">8 C.F.R. § 214.2(o)(3)(iii) — checked against the source by M. Prado</p>
              </div>
              <div className="ml-8 rounded-[16px] bg-paper p-4 text-void shadow-2xl">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[8px] bg-fog">
                    <KeyRound className="size-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">Passport · A-Number</p>
                    <p className="text-[12px] text-muted">Assigned team only · access logged</p>
                  </div>
                </div>
              </div>
              <div className="mr-10 rounded-[16px] bg-paper p-4 text-void shadow-2xl">
                <p className="text-[13px] font-semibold">AI tools: public sources only</p>
                <p className="mt-1 text-[12px] text-muted">Statutes, USCIS Policy Manual, AAO decisions. Never client data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
