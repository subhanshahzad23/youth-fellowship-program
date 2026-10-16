"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useInView } from "motion/react";
import { CalendarClock, Check, ChevronDown, Circle, FileCheck2, FileText, FolderOpen, Gauge, ListChecks, MessageSquareText, Search, ShieldCheck, Share2 } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";

/*
 * Overlapping "case workspace" under the hero: a dotted canvas with a tool
 * rail, a floating toolbar pill, teammates' cursors and a selector card
 * ("What kind of practice do you run?"). Each practice shows a different
 * board — a petition package for smaller firms, a pipeline for larger ones.
 * All case details are illustrative samples, not client data.
 */

type Key = "solo" | "small" | "growing" | "volume";

const PRACTICES: { key: Key; label: string; board: string; copy: string; href: string; cta: string }[] = [
  { key: "solo", label: "Solo practice", board: "O-1A · Robotics researcher", copy: "Send one petition at a time. We draft in your templates while you keep the client calls — and your evenings.", href: "/who-we-serve/solo-and-small-firms", cta: "Support for solo practices" },
  { key: "small", label: "Small firm", board: "EB-2 NIW · Climate engineer", copy: "Two or three attorneys, one drafting team on call. Overflow goes out Monday; reviewed drafts come back in your format.", href: "/who-we-serve/solo-and-small-firms", cta: "Support for small firms" },
  { key: "growing", label: "Growing firm", board: "Pipeline · 18 active cases", copy: "Volume climbing faster than you can hire? Add drafters and a case manager within a week — and adjust every month.", href: "/who-we-serve/growing-firms", cta: "Support for growing firms" },
  { key: "volume", label: "High-volume", board: "H-1B cap season · Pod A", copy: "A dedicated pod trained on your templates, with throughput, deadlines and RFEs reported in Casey.", href: "/who-we-serve/large-and-high-volume", cta: "Support for high-volume teams" },
];

const ease = [0.23, 1, 0.32, 1] as const;
const item = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease, delay: 0.05 + i * 0.06 } }),
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

function Cursor({ name, color, x, y, drift, paused }: { name: string; color: string; x: number; y: number; drift: [number, number]; paused: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-20"
      style={{ left: x, top: y }}
      animate={paused ? { x: 0, y: 0 } : { x: [0, drift[0], drift[0] * 0.4, 0], y: [0, drift[1], drift[1] * -0.6, 0] }}
      transition={paused ? { duration: 0.3 } : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 22 22" className="drop-shadow-sm">
        <path d="M3 2 L19 10 L11 12 L8 20 Z" fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="ml-4 inline-block rounded-[6px] px-2 py-0.5 text-[12px] font-semibold text-white shadow-sm" style={{ background: color }}>
        {name}
      </span>
    </motion.div>
  );
}

function Sticky({ color, rotate, children, className, i }: { color: string; rotate: number; children: React.ReactNode; className?: string; i: number }) {
  return (
    <motion.div custom={i} variants={item} className={cn("absolute w-[178px] p-3.5 text-[13px] leading-snug text-void shadow-[0_10px_20px_-8px_rgba(0,0,0,0.18)]", className)} style={{ background: color, rotate }}>
      {children}
    </motion.div>
  );
}

function Card({ className, children, i, dark }: { className?: string; children: React.ReactNode; i: number; dark?: boolean }) {
  return (
    <motion.div custom={i} variants={item} className={cn("absolute rounded-[12px] p-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04),0_10px_24px_-12px_rgba(0,0,0,0.2)]", dark ? "bg-void text-paper" : "bg-paper ring-1 ring-black/5", className)}>
      {children}
    </motion.div>
  );
}

function Mini({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={cn("text-[10.5px] font-medium uppercase tracking-[0.16em]", dark ? "text-muted-display" : "text-muted")}>{children}</p>;
}

type Row = [string, "done" | "now" | "todo"];

function StatusIcon({ s }: { s: Row[1] }) {
  if (s === "done") return <Check className="size-3.5 text-leaf-ink" strokeWidth={3} aria-hidden />;
  if (s === "now") return <span className="size-2.5 rounded-full bg-jade ring-4 ring-jade/20" aria-hidden />;
  return <Circle className="size-3 text-[#c4c4c4]" aria-hidden />;
}

/* ------------------------------ Boards ------------------------------ */

function PetitionBoard({ variant }: { variant: "o1" | "niw" }) {
  const o1 = variant === "o1";
  const rows: Row[] = o1
    ? [
        ["A · Awards and prizes", "done"],
        ["B · Membership", "done"],
        ["C · Published material", "done"],
        ["D · Judging the work of others", "now"],
        ["E · Original contributions", "todo"],
        ["F · Scholarly authorship", "todo"],
      ]
    : [
        ["Prong 1 · National importance", "done"],
        ["Prong 2 · Well positioned", "done"],
        ["Prong 3 · Balance of factors", "now"],
        ["Business plan · 5 years", "now"],
        ["Support letters · 4 of 6", "todo"],
        ["Exhibit index", "todo"],
      ];
  return (
    <>
      <motion.div custom={0} variants={item} className="absolute left-[44px] top-[26px]">
        <Mini>{o1 ? "Petition package · I-129 / O-1A" : "Petition package · I-140 / NIW"}</Mini>
        <p className="font-display text-[34px] leading-none tracking-[-0.03em]">{o1 ? "Robotics researcher" : "Climate engineer"}</p>
      </motion.div>
      <Card i={1} className="left-[44px] top-[106px] w-[290px]">
        <div className="flex items-center justify-between">
          <Mini>{o1 ? "Exhibit index · by criterion" : "Dhanasar argument"}</Mini>
          <ListChecks className="size-4 text-muted" aria-hidden />
        </div>
        <ul className="mt-2 space-y-1.5">
          {rows.map(([t, s]) => (
            <li key={t} className={cn("flex items-center gap-2 text-[13px]", s === "todo" && "text-muted")}>
              <span className="grid w-4 place-items-center">
                <StatusIcon s={s} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </Card>
      <Sticky i={2} color="#ffe146" rotate={-3} className="left-[372px] top-[92px]">
        {o1 ? "Judged 3 conferences — add the invitation letters to Exhibit D." : "Prong 3: stress the urgency of the grid-storage work."}
        <span className="mt-2 block text-[11px] text-black/60">Drafter note</span>
      </Sticky>
      <Sticky i={3} color="#b4f5c8" rotate={2.5} className="left-[572px] top-[112px]">
        {o1 ? "Lead with the IEEE award — it's the strongest evidence." : "Keep the business plan to 12 pages, my usual format."}
        <span className="mt-2 block text-[11px] text-black/60">Attorney · you</span>
      </Sticky>
      <Sticky i={4} color="#bed7ff" rotate={-1.5} className="left-[392px] top-[262px]">
        {o1 ? "Client to send the 2025 press piece by Wed." : "Two support letters signed; two pending."}
        <span className="mt-2 block text-[11px] text-black/60">Case manager</span>
      </Sticky>
      <Card i={5} className="left-[600px] top-[290px] w-[300px]">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-[#bed7ff] text-[11px] font-semibold">FC</span>
          <div>
            <p className="text-[12.5px] font-semibold leading-none">Francesco Cortese</p>
            <p className="text-[11px] text-muted">Reviewer · step 2 of 2</p>
          </div>
          <span className="ml-auto rounded-full bg-leaf px-2 py-0.5 text-[10.5px] font-medium text-leaf-ink">42/42 citations</span>
        </div>
        <p className="mt-2 text-[13px] leading-snug">Every citation checked against the source. Ready for your read on Thursday.</p>
      </Card>
      <Card i={6} dark className="left-[44px] top-[322px] w-[290px]">
        <div className="flex items-center justify-between">
          <Mini dark>Casey · case status</Mini>
          <LogoMark dark className="size-5" />
        </div>
        <p className="mt-1 text-[14px]">Drafting → Quality review</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#333]">
          <div className="h-full rounded-full bg-jade" style={{ width: o1 ? "64%" : "48%" }} />
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted-display">
          <CalendarClock className="size-3.5" aria-hidden /> Draft to attorney · Thu, 10:00 AM
        </p>
      </Card>
      <motion.div custom={7} variants={item} className="absolute left-[44px] top-[462px] w-[640px]">
        <div className="grid grid-cols-5 gap-[3px]">
          {["Intake", "Drafting", "Review", "Your review", "Filed"].map((s, i) => (
            <div key={s}>
              <span className={cn("block h-2.5 rounded-[2px]", i < 1 ? "bg-void" : i === 1 ? "bg-jade" : "bg-ash")} />
              <span className={cn("mt-1 block text-[11px]", i === 1 ? "font-medium text-void" : "text-muted")}>{s}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}

function PipelineBoard({ variant }: { variant: "growing" | "volume" }) {
  const g = variant === "growing";
  const cols: [string, string[]][] = g
    ? [
        ["Intake", ["O-1A · #1046", "EB-1A · #1045", "NIW · #1044"]],
        ["Drafting", ["O-1A · #1041", "EB-2 NIW · #1040", "L-1A · #1039"]],
        ["Review", ["EB-1A · #1036", "O-1B · #1035"]],
        ["With attorney", ["E-2 · #1031", "O-1A · #1030"]],
      ]
    : [
        ["Intake", ["H-1B · B2-018", "H-1B · B2-017", "H-1B · B2-016"]],
        ["Drafting", ["H-1B · B1-044", "H-1B · B1-043", "L-1B · #2207"]],
        ["Review", ["H-1B · B1-031", "H-1B · B1-030"]],
        ["With attorney", ["H-1B · B1-012", "L-1A · #2201"]],
      ];
  const counts = g ? [4, 6, 4, 4] : [22, 26, 9, 7];
  const bars = g ? [3, 5, 4, 6, 4] : [11, 14, 12, 16, 13];
  return (
    <>
      <motion.div custom={0} variants={item} className="absolute left-[44px] top-[26px]">
        <Mini>{g ? "Firm pipeline · Casey" : "Dedicated pod · Casey"}</Mini>
        <p className="font-display text-[34px] leading-none tracking-[-0.03em]">{g ? "18 active cases" : "H-1B cap season"}</p>
      </motion.div>
      <div className="absolute left-[44px] top-[104px] flex gap-3">
        {cols.map(([label, names], i) => (
          <motion.div key={label} custom={1 + i} variants={item} className="w-[158px] rounded-[12px] bg-[#f1f1f1] p-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11.5px] font-medium">{label}</span>
              <span className="rounded-full bg-paper px-2 text-[11px] font-semibold tabular">{counts[i]}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {names.map((nm) => (
                <div key={nm} className="flex items-center gap-2 rounded-[8px] bg-paper px-2 py-1.5 text-[12px] shadow-sm">
                  <FileText className="size-3.5 shrink-0 text-muted" aria-hidden />
                  <span className="truncate">{nm}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <Card i={5} className="left-[730px] top-[104px] w-[200px]">
        <div className="flex items-center justify-between">
          <Mini>Drafts delivered</Mini>
          <Gauge className="size-4 text-muted" aria-hidden />
        </div>
        <div className="mt-3 flex h-[70px] items-end gap-2">
          {bars.map((b, i) => (
            <span key={i} className="flex-1 rounded-t-[4px] bg-void" style={{ height: `${(b / Math.max(...bars)) * 100}%`, opacity: i === bars.length - 1 ? 1 : 0.35 + i * 0.12 }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10.5px] text-muted">
          {["M", "T", "W", "T", "F"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
      </Card>
      <Card i={6} dark className="left-[44px] top-[330px] w-[340px]">
        <Mini dark>Deadlines this week</Mini>
        <ul className="mt-2 space-y-1.5 text-[12.5px]">
          {(g
            ? [
                ["RFE response · EB-1A #1031", "5 days"],
                ["Draft to attorney · O-1A #1041", "Thu"],
                ["Client documents · NIW #1044", "Fri"],
              ]
            : [
                ["Batch 1 drafts to attorneys", "Mon"],
                ["RFE response · L-1A #2201", "6 days"],
                ["Batch 2 intake complete", "Fri"],
              ]
          ).map(([t, d]) => (
            <li key={t} className="flex justify-between gap-3">
              <span className="truncate">{t}</span>
              <span className="shrink-0 text-jade">{d}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Sticky i={7} color="#ffe146" rotate={-2.5} className="left-[420px] top-[330px]">
        {g ? "Busier quarter — case manager added in week one, scope reviewed monthly." : "Pod A trained on your templates — same standard across every attorney."}
        <span className="mt-2 block text-[11px] text-black/60">Team lead</span>
      </Sticky>
      <Card i={8} className="left-[640px] top-[300px] w-[270px]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4" aria-hidden />
          <p className="text-[13px] font-semibold">Access log</p>
        </div>
        <p className="mt-1 text-[12.5px] text-muted">Only the assigned pod can open these matters. Every view is recorded.</p>
      </Card>
    </>
  );
}

const BOARDS: Record<Key, () => React.ReactElement> = {
  solo: () => <PetitionBoard variant="o1" />,
  small: () => <PetitionBoard variant="niw" />,
  growing: () => <PipelineBoard variant="growing" />,
  volume: () => <PipelineBoard variant="volume" />,
};

const RAIL = [FolderOpen, FileText, ListChecks, MessageSquareText, CalendarClock, FileCheck2, ShieldCheck, Share2];

export function CaseBoard() {
  const [key, setKey] = useState<Key>("solo");
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { margin: "-10% 0px" });
  const [scale, setScale] = useState(1);
  const current = PRACTICES.find((p) => p.key === key)!;
  const Board = BOARDS[key];

  useEffect(() => {
    const el = stageRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, (e.contentRect.width - 72) / 960)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selector = useMemo(
    () => (
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Choose your practice">
        {PRACTICES.map((p) => {
          const active = p.key === key;
          return (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setKey(p.key)}
              className={cn("relative grid h-[84px] place-items-center rounded-[8px] bg-ash px-2 text-center text-[15px] font-semibold leading-tight text-void transition-colors duration-200 hover:bg-[#e6e6e6] sm:h-[96px]", active && "spectrum-ring bg-[#f7f7f7]")}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    ),
    [key],
  );

  return (
    <div ref={wrapRef} className="relative" data-testid="case-board">
      <div className="relative hidden sm:block">
        <motion.div initial={reduced ? false : { opacity: 0, y: 48, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, ease, delay: 0.45 }} className="relative ml-[4%] mr-[2%] rounded-[24px] bg-[#fafafa] shadow-panel lg:ml-[6%]">
          <div className="dots-light relative overflow-hidden rounded-[24px]" style={{ height: 60 + 520 * scale + 56 }}>
            <div ref={stageRef} className="absolute left-[56px] top-[60px] h-[520px] w-[960px] origin-top-left" style={{ transform: `scale(${scale})` }}>
              <AnimatePresence mode="wait">
                <motion.div key={key} initial="hidden" animate="show" exit="exit" className="absolute inset-0">
                  <Board />
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.div initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 1.1 }} className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-[14px] bg-paper px-3 py-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 lg:flex">
              <MessageSquareText className="size-5" aria-hidden />
              <span className="mx-1 h-6 w-px bg-line" />
              {[
                ["You · attorney", "#195ad7", "YOU"],
                ["Lizy M. Kurian · drafter", "#00a86b", "LK"],
                ["Francesco Cortese · reviewer", "#8b3fd9", "FC"],
                ["Barbara Lage · case manager", "#ed6000", "BL"],
              ].map(([n, c, ini]) => (
                <span key={n} className="grid size-9 place-items-center rounded-[10px] bg-paper text-[10.5px] font-semibold" style={{ boxShadow: `inset 0 0 0 2.5px ${c}` }} title={n}>
                  {ini}
                </span>
              ))}
              <span className="ml-1 text-[12px] text-muted">4 people on this case</span>
            </motion.div>
          </div>
          <Cursor name="Drafter" color="#00a86b" x={Math.round(56 + 500 * scale)} y={Math.round(60 + 240 * scale)} drift={[34, -18]} paused={!inView || reduced} />
          <Cursor name="You" color="#195ad7" x={Math.round(56 + 520 * scale)} y={Math.round(60 + 30 * scale)} drift={[-28, 14]} paused={!inView || reduced} />
          <Cursor name="Reviewer" color="#8b3fd9" x={Math.round(56 + 800 * scale)} y={Math.round(60 + 440 * scale)} drift={[20, 16]} paused={!inView || reduced} />
        </motion.div>

        <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.7 }} className="absolute -top-7 left-[2%] z-10 flex h-14 items-center gap-3 rounded-[14px] bg-paper pl-3 pr-4 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)] lg:left-[4%]">
          <LogoMark className="size-7" />
          <span className="text-[16px] font-medium">{current.board}</span>
          <ChevronDown className="size-4" aria-hidden />
          <span className="h-6 w-px bg-line" />
          <span className="rounded-full bg-[#fff1cc] px-2 py-0.5 text-[11px] font-medium text-[#7a4b00]">Sample case</span>
          <Search className="size-[18px]" aria-hidden />
        </motion.div>

        <motion.div initial={reduced ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease, delay: 0.8 }} className="absolute left-[calc(4%-22px)] top-[120px] z-10 hidden flex-col items-center gap-4 rounded-[14px] bg-void px-2.5 py-4 text-paper shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)] md:flex lg:left-[calc(6%-22px)]" aria-hidden>
          {RAIL.map((Icon, i) => (
            <Icon key={i} className="size-[19px]" strokeWidth={1.8} />
          ))}
        </motion.div>

        <motion.div initial={reduced ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.6 }} className="absolute -top-[120px] right-[6%] z-20 hidden w-[300px] rounded-[16px] bg-paper p-4 shadow-float xl:right-[8%] xl:block">
          <p className="px-1 pb-4 pt-3 text-center text-[17px] font-semibold">What kind of practice do you run?</p>
          {selector}
          <AnimatePresence mode="wait">
            <motion.p key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="mt-4 px-1 text-center text-[15px] leading-relaxed">
              {current.copy}
            </motion.p>
          </AnimatePresence>
          <div className="mt-4 flex justify-center pb-1">
            <Link href={current.href} className="group/b relative inline-flex h-10 items-center overflow-hidden rounded-[8px] bg-void px-4 text-[15px] font-medium text-paper">
              <span aria-hidden className="absolute inset-0 bg-white/12 opacity-0 transition-opacity duration-300 group-hover/b:opacity-100" />
              <span className="relative">{current.cta}</span>
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 xl:hidden">
        <div className="mx-auto max-w-xl rounded-[16px] bg-paper p-4 shadow-float">
          <p className="pb-3 text-center text-[16px] font-semibold">What kind of practice do you run?</p>
          {selector}
          <AnimatePresence mode="wait">
            <motion.div key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <p className="mt-4 text-center text-[15px] leading-relaxed">{current.copy}</p>
              <MobilePreview k={key} />
            </motion.div>
          </AnimatePresence>
          <Link href={current.href} className="mt-4 grid h-11 w-full place-items-center rounded-[8px] bg-void text-[15px] font-medium text-paper">
            {current.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobilePreview({ k }: { k: Key }) {
  const rows: Record<Key, [string, string][]> = {
    solo: [
      ["O-1A package", "Exhibits A–C done · D in drafting"],
      ["Reviewer", "42 of 42 citations checked"],
      ["Casey", "Draft to you Thursday, 10:00 AM"],
    ],
    small: [
      ["EB-2 NIW package", "Prongs 1–2 done · business plan in drafting"],
      ["Your note", "“Keep the plan to 12 pages.”"],
      ["Case manager", "Two support letters pending"],
    ],
    growing: [
      ["Pipeline", "18 active cases across 4 stages"],
      ["Deadlines", "RFE response · EB-1A in 5 days"],
      ["Scope", "Reviewed monthly — no long-term contract"],
    ],
    volume: [
      ["Dedicated pod", "Trained on your templates"],
      ["This week", "66 drafts delivered"],
      ["Security", "Assigned pod only · every view logged"],
    ],
  };
  return (
    <ul className="dots-light mt-4 space-y-2 rounded-[14px] bg-[#fafafa] p-3">
      {rows[k].map(([a, b], i) => (
        <li key={a} className="flex items-start gap-3 rounded-[10px] bg-paper p-3 shadow-sm">
          <span className={cn("mt-1 size-2.5 shrink-0 rounded-[3px]", ["bg-jade", "bg-[#5887ff]", "bg-[#ffaa00]"][i])} aria-hidden />
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{a}</span>
            <span className="text-[14px]">{b}</span>
          </span>
          {i === 0 && <Check className="ml-auto size-4 shrink-0 text-leaf-ink" aria-hidden />}
        </li>
      ))}
    </ul>
  );
}
