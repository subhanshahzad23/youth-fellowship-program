"use client";

import { EyeOff, Lock, ShieldCheck, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

/*
 * Adapts the observed inset black card (10px from the viewport edge, 24px
 * radius, text left, visual right, jade/mint rectangular blocks). Copy
 * describes intended product behavior only — no certifications or claims of
 * encryption.
 */
const POINTS = [
  { icon: Users, title: "Cohort boundaries", body: "Fellows message people in their own cohort. Other cohorts aren't reachable through the directory or a hand-edited link." },
  { icon: ShieldCheck, title: "Assigned mentors only", body: "Mentors can only message the fellows assigned to them, and staff can review every fellowship conversation." },
  { icon: EyeOff, title: "Report and review", body: "Anyone can report a message. The program team reviews it, can hide it with a recorded reason, and keeps the original on file." },
  { icon: Lock, title: "Restricted documents", body: "Proof-of-residence files open only for the applicant and reviewers explicitly assigned to that application — not by job title." },
];

export function Safeguarding() {
  return (
    <section id="safeguarding" className="scroll-mt-24 px-[10px] py-6" aria-labelledby="safe-h">
      <div className="relative mx-auto max-w-[1420px] overflow-hidden rounded-[24px] bg-void text-paper">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
          <Reveal className="px-6 py-14 sm:px-12 sm:py-16 lg:py-20">
            <p className="eyebrow text-paper">Safeguarding by design</p>
            <h2 id="safe-h" className="display-xl mt-4 max-w-[14ch]">
              Supported, supervised and in the right hands
            </h2>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.6] text-paper/90">
              Many fellows are under 18. The workspace is built so the right people can help — and nobody else can reach in. Here is how the demo behaves; the production build will enforce the same rules on the server.
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <Icon className="size-5 text-jade" aria-hidden />
                  <p className="mt-2 text-[16px] font-medium">{title}</p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-[#bdbdbd]">{body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-9">
              <ButtonLink href="/demo" arrow>
                See it in the demo
              </ButtonLink>
            </div>
          </Reveal>

          <div className="relative min-h-[460px] overflow-hidden lg:min-h-0" aria-hidden>
            <div className="absolute inset-0 bg-[#141414]" />
            <div className="absolute right-0 top-0 h-[70px] w-[36%] bg-forest" />
            <div className="absolute right-0 top-[70px] bg-mint px-4 py-3 text-[14px] font-medium tracking-[0.08em] text-forest">SUPERVISED</div>
            <div className="absolute bottom-[60px] left-0 h-[74px] w-[74px] bg-[#8ae8a1]" />
            <div className="absolute bottom-0 left-[10%] h-[60px] w-[62%] bg-jade" />
            <div className="absolute bottom-0 right-0 h-[18px] w-full bg-mint" />

            <div className="relative mx-auto flex h-full max-w-[420px] flex-col justify-center gap-4 px-6 py-16">
              <div className="rounded-[16px] bg-paper p-4 text-void shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold">Mentor conversation</p>
                  <span className="flex items-center gap-1 text-[11.5px] text-muted">
                    <ShieldCheck className="size-3.5" /> Staff can review
                  </span>
                </div>
                <p className="mt-3 rounded-[10px] bg-fog px-3 py-2 text-[13px]">Before Tuesday, write down what the pop-up cost to run.</p>
                <p className="mt-2 rounded-[10px] border border-dashed border-line px-3 py-2 text-[12.5px] text-muted">This message was hidden by the program team.</p>
              </div>
              <div className="ml-8 rounded-[16px] bg-paper p-4 text-void shadow-2xl">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[8px] bg-fog">
                    <Lock className="size-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">Proof of residence</p>
                    <p className="text-[12px] text-muted">Restricted · assigned reviewers only</p>
                  </div>
                </div>
              </div>
              <div className="mr-10 rounded-[16px] bg-paper p-4 text-void shadow-2xl">
                <p className="text-[13px] font-semibold">Can’t message Leo Martins</p>
                <p className="mt-1 text-[12px] text-muted">Fellows can only message people in their own cohort.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
