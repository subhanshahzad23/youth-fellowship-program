"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight, Compass, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { setWindowScenario, type WindowScenario } from "@/lib/actions/comms";
import { fellowMembership, homeFor, roleLabel } from "@/lib/domain/permissions";
import { windowState } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { PERSONAS } from "@/lib/seed/people";
import { resetDemo, setPersona, useDb, useHydrated, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { cn, fmtDateLong, fmtTime } from "@/lib/utils";
import { WALKTHROUGH } from "@/lib/walkthrough";
import { Avatar } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlay";

/**
 * Presenter-only control, visually separate from product navigation.
 * Switching identities here changes who is signed in; it never grants the
 * current persona extra powers.
 */
export function DemoControl() {
  const db = useDb();
  const me = useMe();
  const hydrated = useHydrated();
  const router = useRouter();
  const now = useNow();
  const { demoPanelOpen, setDemoPanelOpen, walkthroughOpen, setWalkthrough } = useUI();
  const [confirmReset, setConfirmReset] = useState(false);
  const forms = useMemo(() => Object.values(db.forms).filter((f) => ["c_winter27", "c_spring27", "c_summer27"].includes(f.cohortId) || f.createdAt > "2026-10-01"), [db.forms]);

  const cohortName = me ? db.cohorts[fellowMembership(db, me.id)?.cohortId ?? ""]?.name : undefined;

  const switchTo = (userId: string) => {
    setPersona(userId);
    setDemoPanelOpen(false);
    router.push(homeFor(db, userId));
  };

  return (
    <>
      <div className="no-print fixed bottom-4 left-4 z-[60] flex items-end gap-2">
        <PopoverRoot open={demoPanelOpen} onOpenChange={setDemoPanelOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="group flex h-10 items-center gap-2 rounded-full border border-white/10 bg-void pl-1.5 pr-2.5 text-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5"
              aria-label={`Open demo controls${me ? ` — signed in as ${me.name}` : ""}`}
            >
              {me ? <Avatar name={me.name} hue={me.avatarHue} size={28} /> : <span className="grid size-7 place-items-center rounded-full bg-[#333]"><SlidersHorizontal className="size-3.5" /></span>}
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10.5px] font-semibold tracking-[0.02em] text-jade">Demo · fictional data</span>
                <span className="hidden max-w-[104px] truncate text-[12px] text-paper/85 sm:block">{hydrated ? (me ? me.name : "Choose identity") : "Loading…"}</span>
              </span>
              <ChevronDown className="size-3.5 text-paper/60 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-[min(92vw,380px)] overflow-hidden p-0">
            <div className="bg-void px-4 py-3 text-paper">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-jade">Presenter controls</p>
              <p className="mt-0.5 text-[13px] text-paper/70">Not part of the product. Everything here is fictional demo data.</p>
            </div>
            <div className="max-h-[min(70vh,560px)] overflow-y-auto p-4">
              <p className="eyebrow mb-2 text-muted">Sign in as</p>
              <ul className="grid gap-1">
                {PERSONAS.map((p) => {
                  const u = db.users[p.userId];
                  const active = me?.id === p.userId;
                  return (
                    <li key={p.key}>
                      <button
                        type="button"
                        onClick={() => switchTo(p.userId)}
                        className={cn("flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left transition-colors hover:bg-fog", active && "bg-fog")}
                        aria-current={active || undefined}
                      >
                        <Avatar name={p.label} hue={u?.avatarHue} size={32} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium">{p.label}</span>
                          <span className="block truncate text-[12.5px] text-muted">{u ? roleLabel(db, u) : p.role}</span>
                        </span>
                        {active && <span className="text-[12px] font-medium text-leaf-ink">Current</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" onClick={() => { setDemoPanelOpen(false); router.push("/demo"); }} className="mt-1 w-full rounded-[8px] px-2 py-1.5 text-left text-[13px] text-muted underline-offset-2 hover:text-void hover:underline">
                All identities, sign-up and walkthrough →
              </button>

              <div className="mt-4 rounded-[12px] bg-fog p-3 text-[13px]">
                <p className="flex items-center gap-2 font-medium">
                  <CalendarClock className="size-4" aria-hidden /> Demo clock
                </p>
                <p className="mt-1 text-muted">
                  {fmtDateLong(now)}, {fmtTime(now)} UTC · independent of today&apos;s real date
                </p>
                {me && (
                  <p className="mt-1 text-muted">
                    Context: {roleLabel(db, me)}
                    {cohortName ? ` · ${cohortName}` : ""}
                  </p>
                )}
              </div>

              <p className="eyebrow mb-2 mt-5 text-muted">Application windows</p>
              <div className="space-y-2">
                {forms.map((f) => {
                  const ws = windowState(f, now);
                  const cur: WindowScenario | null = ws === "open" ? "open" : ws === "upcoming" ? "upcoming" : ws === "closed" ? "closed" : null;
                  return (
                    <div key={f.id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[13.5px]">{db.cohorts[f.cohortId]?.name}</span>
                      <div className="flex rounded-[8px] bg-fog p-0.5" role="radiogroup" aria-label={`${db.cohorts[f.cohortId]?.name} window scenario`}>
                        {(["upcoming", "open", "closed"] as WindowScenario[]).map((sc) => (
                          <button
                            key={sc}
                            type="button"
                            role="radio"
                            aria-checked={cur === sc}
                            onClick={() => {
                              const r = setWindowScenario(f.id, sc);
                              if (r.ok) toast.success(`${db.cohorts[f.cohortId]?.name}: window set to ${sc === "upcoming" ? "before open" : sc}`);
                              else toast.error(r.error);
                            }}
                            className={cn("h-7 rounded-[6px] px-2 text-[12px] transition-colors", cur === sc ? "bg-void text-paper" : "text-muted hover:text-void")}
                          >
                            {sc === "upcoming" ? "Before open" : sc === "open" ? "Open" : "Closed"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="dark"
                  icon={<Compass className="size-4" />}
                  onClick={() => {
                    setWalkthrough(true);
                    setDemoPanelOpen(false);
                  }}
                >
                  Guided walkthrough
                </Button>
                <Button size="sm" variant="outline" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
                  Reset demo data
                </Button>
              </div>
            </div>
          </PopoverContent>
        </PopoverRoot>
      </div>

      <AnimatePresence>{walkthroughOpen && hydrated && <WalkthroughCard />}</AnimatePresence>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset all demo data?"
        description="This restores every seeded person, application, message and relationship, and clears files you added in this browser."
        confirmLabel="Reset demo"
        onConfirm={async () => {
          await resetDemo();
          setDemoPanelOpen(false);
          toast.success("Demo data reset to the original seed.");
          router.push("/demo");
        }}
      />
    </>
  );
}

function WalkthroughCard() {
  const { walkthroughStep, setWalkthrough } = useUI();
  const db = useDb();
  const router = useRouter();
  const step = WALKTHROUGH[Math.min(walkthroughStep, WALKTHROUGH.length - 1)];
  const persona = PERSONAS.find((p) => p.key === step.persona)!;

  const go = (i: number) => {
    const s = WALKTHROUGH[i];
    const p = PERSONAS.find((x) => x.key === s.persona)!;
    setWalkthrough(true, i);
    setPersona(p.userId);
    router.push(s.href);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      aria-label="Guided walkthrough"
      className="no-print fixed bottom-[72px] left-4 z-[59] w-[min(calc(100vw-32px),360px)] overflow-hidden rounded-[16px] bg-paper shadow-float ring-1 ring-line"
    >
      <div className="flex items-center justify-between bg-void px-4 py-2.5 text-paper">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-jade">
          Walkthrough · {walkthroughStep + 1} / {WALKTHROUGH.length}
        </p>
        <button type="button" onClick={() => setWalkthrough(false)} className="grid size-7 place-items-center rounded-[6px] hover:bg-white/10" aria-label="Close walkthrough">
          <X className="size-4" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-[12.5px] text-muted">
          As <span className="font-medium text-void">{persona.label}</span> · {db.users[persona.userId] ? roleLabel(db, db.users[persona.userId]) : persona.role}
        </p>
        <p className="mt-1 text-[16px] font-semibold tracking-[-0.01em]">{step.title}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{step.body}</p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {WALKTHROUGH.map((s, i) => (
            <span key={s.id} className={cn("h-1 flex-1 rounded-full", i <= walkthroughStep ? "bg-jade" : "bg-ash")} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button size="sm" variant="ghost" icon={<ChevronLeft className="size-4" />} disabled={walkthroughStep === 0} onClick={() => go(walkthroughStep - 1)}>
            Back
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => go(walkthroughStep)}>
              Open this step
            </Button>
            {walkthroughStep < WALKTHROUGH.length - 1 ? (
              <Button size="sm" variant="dark" onClick={() => go(walkthroughStep + 1)}>
                Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={() => setWalkthrough(false, 0)}>
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
