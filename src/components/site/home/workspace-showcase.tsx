"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useInView } from "motion/react";
import {
  Archive,
  Check,
  ChevronDown,
  Download,
  Image as ImageIcon,
  LayoutGrid,
  MessageSquareText,
  PenLine,
  Search,
  Shapes,
  ShieldCheck,
  StickyNote,
  Table2,
  Type,
} from "lucide-react";
import { applicationStatusCounts, averageScore, trackProgress } from "@/lib/domain/selectors";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { setPersona, useDb } from "@/lib/store/store";
import { cn, initials } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";

/*
 * Recreates the mural.co hero workspace mechanics (observed): a white dotted
 * canvas overlapping the black hero, a dark vertical tool rail, a floating
 * toolbar pill, collaborator cursors with name tags, an avatar strip, and a
 * floating card with a 2×2 "Which team are you part of?" selector whose active
 * tile gets a rotating spectrum border. Switching roles cross-fades the canvas
 * (observed) and swaps the card copy. Content here is original fellowship UI,
 * and several numbers are read live from the demo store.
 */

type RoleKey = "fellow" | "instructor" | "mentor" | "program";

const ROLES: { key: RoleKey; label: string; board: string; copy: string; userId: string; href: string; cta: string }[] = [
  {
    key: "fellow",
    label: "Fellow",
    board: "Porchlight Repair",
    copy: "Log interviews, run experiments and get feedback in one place — with your curriculum, assignments and mentor a click away.",
    userId: "u_noah",
    href: "/workspace/dashboard",
    cta: "Explore as a fellow",
  },
  {
    key: "instructor",
    label: "Instructor",
    board: "Foundations · Module 2",
    copy: "Draft sessions privately, publish when they're ready, and review every submission with clear, specific feedback.",
    userId: "u_elena",
    href: "/staff/content",
    cta: "Explore as an instructor",
  },
  {
    key: "mentor",
    label: "Mentor",
    board: "Mentoring · Summer 2026",
    copy: "See the fellows assigned to you, pick up conversations and keep check-ins on track — with staff oversight built in.",
    userId: "u_daniel",
    href: "/staff/dashboard",
    cta: "Explore as a mentor",
  },
  {
    key: "program",
    label: "Program team",
    board: "Winter 2027 intake",
    copy: "Run intakes, score applications with a rubric, manage cohorts and keep every conversation safe and supervised.",
    userId: "u_amira",
    href: "/admin/dashboard",
    cta: "Explore as the program team",
  },
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
    <motion.div custom={i} variants={item} className={cn("absolute w-[168px] p-3.5 text-[13px] leading-snug text-void shadow-[0_10px_20px_-8px_rgba(0,0,0,0.18)]", className)} style={{ background: color, rotate }}>
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

function Mini({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted">{children}</p>;
}

/* ------------------------------ Boards ------------------------------ */

function FellowBoard() {
  const db = useDb();
  const p = trackProgress(db, "u_noah", "t_ff");
  return (
    <>
      <motion.div custom={0} variants={item} className="absolute left-[44px] top-[30px]">
        <Mini>Venture canvas</Mini>
        <p className="font-display text-[34px] leading-none tracking-[-0.03em]">Porchlight Repair</p>
      </motion.div>
      <Card i={1} className="left-[44px] top-[112px] w-[250px]">
        <Mini>Problem</Mini>
        <p className="mt-1 text-[14px] leading-snug">Renters throw away lamps and kettles that need a five-minute fix.</p>
        <p className="mt-2 text-[12px] text-muted">Who: renters 20–35 and older neighbors</p>
      </Card>
      <Sticky i={2} color="#ffe146" rotate={-3} className="left-[330px] top-[92px]">
        “I put the lamp in the hallway for someone to take.”
        <span className="mt-2 block text-[11px] text-black/60">Interview · renter, 24</span>
      </Sticky>
      <Sticky i={3} color="#b4f5c8" rotate={2.5} className="left-[520px] top-[112px]">
        “It&apos;s carrying it across town that stops me.”
        <span className="mt-2 block text-[11px] text-black/60">Interview · neighbor, 71</span>
      </Sticky>
      <Sticky i={4} color="#bed7ff" rotate={-1.5} className="left-[352px] top-[262px]">
        “I&apos;d come to a monthly repair day.”
        <span className="mt-2 block text-[11px] text-black/60">Interview · student</span>
      </Sticky>
      <motion.svg custom={5} variants={item} className="pointer-events-none absolute left-[318px] top-[80px]" width="200" height="140" viewBox="0 0 200 140" aria-hidden>
        <path d="M18 70 C 14 20, 180 10, 186 64 C 190 118, 30 130, 18 74" fill="none" stroke="#ff4b4b" strokeWidth="2.5" strokeLinecap="round" />
      </motion.svg>
      <Card i={6} dark className="left-[44px] top-[270px] w-[270px]">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-display">Module 2 · Customer interviews</p>
        <p className="mt-1 text-[14px]">Run five customer interviews</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#333]">
          <div className="h-full rounded-full bg-jade" style={{ width: `${Math.max(8, p.pct)}%` }} />
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted-display">
          {p.done} of {p.total} sessions · draft saved
        </p>
      </Card>
      <Card i={7} className="left-[540px] top-[300px] w-[190px]">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-[#bed7ff] text-[11px] font-semibold">DB</span>
          <div>
            <p className="text-[12.5px] font-semibold leading-none">Daniel Brooks</p>
            <p className="text-[11px] text-muted">Mentor · supervised</p>
          </div>
        </div>
        <p className="mt-2 text-[13px] leading-snug">Nine strangers is a real signal. What did it cost you to run?</p>
      </Card>
      <Card i={8} className="left-[750px] top-[300px] w-[190px]">
        <Mini>Pop-up #1 results</Mini>
        <div className="mt-2 space-y-1.5">
          {[
            ["Visitors", 14],
            ["Strangers", 9],
            ["Repairs", 9],
          ].map(([k, v]) => (
            <div key={k as string} className="flex items-center gap-2 text-[12px]">
              <span className="w-16 text-muted">{k}</span>
              <span className="h-2 rounded-full bg-void" style={{ width: (v as number) * 8 }} />
              <span className="tabular">{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <motion.div custom={9} variants={item} className="absolute left-[44px] top-[440px] w-[640px]">
        <div className="flex justify-between text-[11px] text-muted">
          <span>Jul 2026</span>
          <span className="font-medium text-void">Month 4 of 18</span>
          <span>Dec 2027</span>
        </div>
        <div className="mt-1.5 grid gap-[3px]" style={{ gridTemplateColumns: "repeat(18,1fr)" }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className={cn("h-2.5 rounded-[2px]", i < 3 ? "bg-void" : i === 3 ? "bg-jade" : "bg-ash")} />
          ))}
        </div>
      </motion.div>
    </>
  );
}

function InstructorBoard() {
  const db = useDb();
  const pending = Object.values(db.submissions).filter((s) => s.status === "submitted" && ["c_summer26", "c_spring26"].includes(s.cohortId) && db.modules[db.sessions[s.sessionId]?.moduleId]?.trackId === "t_ff");
  const sessions = (db.modules["ff-2"]?.sessionIds ?? []).map((id) => db.sessions[id]).filter(Boolean);
  return (
    <>
      <motion.div custom={0} variants={item} className="absolute left-[44px] top-[30px]">
        <Mini>Founder Foundations · Module 2</Mini>
        <p className="font-display text-[34px] leading-none tracking-[-0.03em]">Customer interviews</p>
      </motion.div>
      <div className="absolute left-[44px] top-[112px] w-[330px] space-y-2">
        {sessions.slice(0, 4).map((s, i) => (
          <Card key={s.id} i={1 + i} className="relative w-full">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted">
                {i + 1} · {s.kind}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium", s.draft ? "bg-[#fff1cc] text-[#7a4b00]" : "bg-leaf text-leaf-ink")}>{s.draft ? "Draft changes" : "Published"}</span>
            </div>
            <p className="mt-1 truncate text-[13.5px]">{(s.draft ?? s.published)?.title}</p>
          </Card>
        ))}
      </div>
      <Card i={6} className="left-[420px] top-[100px] w-[250px]">
        <Mini>To review</Mini>
        <p className="font-display text-[40px] leading-none tracking-[-0.03em] tabular">{pending.length}</p>
        <div className="mt-2 flex -space-x-2">
          {pending.slice(0, 5).map((s) => (
            <span key={s.id} className="grid size-7 place-items-center rounded-full bg-[#e6bfff] text-[10.5px] font-semibold ring-2 ring-paper">
              {initials(db.users[s.fellowId]?.name ?? "?")}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted">submissions waiting for feedback</p>
      </Card>
      <Card i={7} className="left-[420px] top-[262px] w-[300px]">
        <Mini>Feedback · Aisha Bello</Mini>
        <p className="mt-1 text-[13px] leading-snug">
          Great evidence. Lead with your strongest quote, then show the pattern across all five
          <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-void" />
        </p>
        <div className="mt-3 flex gap-1.5">
          <span className="rounded-[6px] bg-jade px-2.5 py-1 text-[11.5px] font-medium">Approve</span>
          <span className="rounded-[6px] bg-fog px-2.5 py-1 text-[11.5px]">Request changes</span>
        </div>
      </Card>
      <Sticky i={8} color="#ffe146" rotate={3} className="left-[760px] top-[310px]">
        Office hours Thursday 5–6pm — bring one transcript.
      </Sticky>
      <Sticky i={9} color="#ff98b4" rotate={-2} className="left-[520px] top-[400px]">
        Draft: add a worked example to session 4 before publishing.
      </Sticky>
    </>
  );
}

function MentorBoard() {
  const db = useDb();
  const mentees = ["u_noah", "u_diego", "u_lily"].map((id) => ({ u: db.users[id], p: trackProgress(db, id, "t_ff") }));
  return (
    <>
      <motion.div custom={0} variants={item} className="absolute left-[44px] top-[30px]">
        <Mini>Mentoring · Summer 2026</Mini>
        <p className="font-display text-[34px] leading-none tracking-[-0.03em]">Three fellows, one rhythm</p>
      </motion.div>
      <div className="absolute left-[44px] top-[112px] flex gap-3">
        {mentees.map(({ u, p }, i) => (
          <Card key={u.id} i={1 + i} className="relative w-[176px]">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full text-[11px] font-semibold" style={{ background: `hsl(${u.avatarHue} 70% 84%)` }}>
                {initials(u.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{u.name}</span>
                <span className="block truncate text-[11.5px] text-muted">{u.ventureName}</span>
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ash">
              <div className="h-full rounded-full bg-jade" style={{ width: `${Math.max(6, p.pct)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted">{p.pct}% of track</p>
          </Card>
        ))}
      </div>
      <Card i={4} className="left-[44px] top-[262px] w-[420px]">
        <div className="flex items-center justify-between">
          <Mini>Diego Morales</Mini>
          <span className="flex items-center gap-1 text-[10.5px] text-muted">
            <ShieldCheck className="size-3" /> Staff can review
          </span>
        </div>
        <p className="mt-2 max-w-[300px] rounded-[10px] bg-fog px-3 py-2 text-[12.5px]">She&apos;d consider a discount if we send ten customers a month. Is that a good deal?</p>
        <p className="ml-auto mt-2 max-w-[260px] rounded-[10px] bg-void px-3 py-2 text-[12.5px] text-paper">Ask for a one-month trial first, and track how many actually book.</p>
      </Card>
      <Sticky i={5} color="#b4f5c8" rotate={-2.5} className="left-[500px] top-[268px]">
        Tue 4pm — walk through pop-up costs with Noah.
      </Sticky>
      <Card i={6} className="left-[720px] top-[300px] w-[220px]">
        <Mini>Next check-ins</Mini>
        <ul className="mt-2 space-y-1.5 text-[12.5px]">
          <li className="flex justify-between">
            <span>Noah</span>
            <span className="text-muted">Tue</span>
          </li>
          <li className="flex justify-between">
            <span>Lily</span>
            <span className="text-muted">Thu</span>
          </li>
          <li className="flex justify-between">
            <span>Diego</span>
            <span className="text-muted">Fri</span>
          </li>
        </ul>
      </Card>
    </>
  );
}

function ProgramBoard() {
  const db = useDb();
  const apps = Object.values(db.applications).filter((a) => a.cohortId === "c_winter27" && a.status !== "draft");
  const c = applicationStatusCounts(apps);
  const cols: [string, number, string[]][] = [
    ["Submitted", c.submitted, apps.filter((a) => a.status === "submitted").map((a) => db.users[a.applicantId]?.name)],
    ["In review", c.in_review + c.changes_requested, apps.filter((a) => a.status === "in_review" || a.status === "changes_requested").map((a) => db.users[a.applicantId]?.name)],
    ["Decided", c.approved + c.waitlisted + c.rejected, apps.filter((a) => ["approved", "waitlisted", "rejected"].includes(a.status)).map((a) => db.users[a.applicantId]?.name)],
  ];
  const sara = averageScore(db, "a_sara_w27");
  const openReports = Object.values(db.reports).filter((r) => r.status !== "resolved").length;
  return (
    <>
      <motion.div custom={0} variants={item} className="absolute left-[44px] top-[30px]">
        <Mini>Program team</Mini>
        <p className="font-display text-[34px] leading-none tracking-[-0.03em]">Winter 2027 intake</p>
      </motion.div>
      <div className="absolute left-[44px] top-[108px] flex gap-3">
        {cols.map(([label, n, names], i) => (
          <motion.div key={label} custom={1 + i} variants={item} className="w-[168px] rounded-[12px] bg-[#f1f1f1] p-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11.5px] font-medium">{label}</span>
              <span className="rounded-full bg-paper px-2 text-[11px] font-semibold tabular">{n}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {names.slice(0, 3).map((nm) => (
                <div key={nm} className="flex items-center gap-2 rounded-[8px] bg-paper px-2 py-1.5 text-[12px] shadow-sm">
                  <span className="grid size-5 place-items-center rounded-full bg-[#bed7ff] text-[9px] font-semibold">{initials(nm ?? "?")}</span>
                  <span className="truncate">{nm}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <Card i={4} className="left-[730px] top-[290px] w-[220px]">
        <Mini>Rubric · Sara Lindqvist</Mini>
        <p className="font-display text-[34px] leading-none tracking-[-0.03em] tabular">
          {sara ?? 75}
          <span className="text-[16px] text-muted">/100</span>
        </p>
        {[
          ["Motivation", 80],
          ["Venture idea", 80],
          ["Commitment", 60],
          ["Community", 80],
        ].map(([k, v]) => (
          <div key={k as string} className="mt-1.5 flex items-center gap-2 text-[11.5px]">
            <span className="w-20 text-muted">{k}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ash">
              <span className="block h-full rounded-full bg-void" style={{ width: `${v}%` }} />
            </span>
          </div>
        ))}
      </Card>
      <Card i={5} className="left-[590px] top-[108px] w-[150px]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          <p className="text-[13px] font-semibold">Safeguarding</p>
        </div>
        <p className="mt-1 text-[12.5px] text-muted">
          {openReports} open {openReports === 1 ? "report" : "reports"}
        </p>
      </Card>
      <Sticky i={6} color="#ffe146" rotate={-3} className="left-[200px] top-[380px]">
        Applications close Nov 15 — Spring 2027 early window runs in parallel.
      </Sticky>
    </>
  );
}

const BOARDS: Record<RoleKey, () => React.ReactElement> = { fellow: FellowBoard, instructor: InstructorBoard, mentor: MentorBoard, program: ProgramBoard };

const RAIL = [StickyNote, Type, Shapes, PenLine, ImageIcon, LayoutGrid, Table2, Archive];

/* ------------------------------ Showcase ------------------------------ */

export function WorkspaceShowcase() {
  const [role, setRole] = useState<RoleKey>("fellow");
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { margin: "-10% 0px" });
  const [scale, setScale] = useState(1);
  const current = ROLES.find((r) => r.key === role)!;
  const Board = BOARDS[role];

  useEffect(() => {
    const el = stageRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, (e.contentRect.width - 72) / 960)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const explore = () => {
    setPersona(current.userId);
    router.push(current.href);
  };

  const selector = useMemo(
    () => (
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Choose a role to preview">
        {ROLES.map((r) => {
          const active = r.key === role;
          return (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(r.key)}
              className={cn(
                "relative grid h-[92px] place-items-center rounded-[8px] bg-ash px-2 text-center text-[15px] font-semibold leading-tight text-void transition-colors duration-200 hover:bg-[#e6e6e6] sm:h-[108px]",
                active && "spectrum-ring bg-[#f7f7f7]",
              )}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    ),
    [role],
  );

  return (
    <div ref={wrapRef} className="relative">
      {/* Desktop / tablet composition */}
      <div className="relative hidden sm:block">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease, delay: 0.45 }}
          className="relative ml-[4%] mr-[2%] rounded-[24px] bg-[#fafafa] shadow-panel lg:ml-[6%]"
        >
          <div className="dots-light relative overflow-hidden rounded-[24px]" style={{ height: 60 + 520 * scale + 56 }}>
            <div ref={stageRef} className="absolute left-[56px] top-[60px] h-[520px] w-[960px] origin-top-left" style={{ transform: `scale(${scale})` }}>
              <AnimatePresence mode="wait">
                <motion.div key={role} initial="hidden" animate="show" exit="exit" className="absolute inset-0">
                  <Board />
                </motion.div>
              </AnimatePresence>
            </div>
            {/* avatar strip */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 1.1 }}
              className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-[14px] bg-paper px-3 py-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 lg:flex"
            >
              <MessageSquareText className="size-5" aria-hidden />
              <span className="mx-1 h-6 w-px bg-line" />
              {[
                ["Noah Williams", "#00c27a"],
                ["Aisha Bello", "#5887ff"],
                ["Daniel Brooks", "#ffaa00"],
                ["Elena Ruiz", "#be53ff"],
                ["Amira Hassan", "#ff4b4b"],
              ].map(([n, c]) => (
                <span key={n} className="grid size-9 place-items-center rounded-[10px] text-[11.5px] font-semibold" style={{ boxShadow: `inset 0 0 0 2.5px ${c}`, background: "#fff" }} title={n}>
                  {initials(n)}
                </span>
              ))}
            </motion.div>
          </div>
          {/* cursors */}
          <Cursor name="Noah" color="#00a86b" x={Math.round(56 + 470 * scale)} y={Math.round(60 + 250 * scale)} drift={[34, -18]} paused={!inView || reduced} />
          <Cursor name="Elena" color="#8b3fd9" x={Math.round(56 + 470 * scale)} y={Math.round(60 + 20 * scale)} drift={[-28, 14]} paused={!inView || reduced} />
          <Cursor name="Daniel" color="#3f6fe8" x={Math.round(56 + 780 * scale)} y={Math.round(60 + 430 * scale)} drift={[20, 16]} paused={!inView || reduced} />
        </motion.div>

        {/* floating toolbar pill */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.7 }}
          className="absolute -top-7 left-[2%] z-10 flex h-14 items-center gap-3 rounded-[14px] bg-paper pl-3 pr-4 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)] lg:left-[4%]"
        >
          <LogoMark className="size-7" />
          <span className="text-[16px] font-medium">{current.board}</span>
          <ChevronDown className="size-4" aria-hidden />
          <span className="h-6 w-px bg-line" />
          <Download className="size-[18px]" aria-hidden />
          <Search className="size-[18px]" aria-hidden />
        </motion.div>

        {/* dark tool rail */}
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.8 }}
          className="absolute left-[calc(4%-22px)] top-[120px] z-10 hidden flex-col items-center gap-4 rounded-[14px] bg-void px-2.5 py-4 text-paper shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)] md:flex lg:left-[calc(6%-22px)]"
          aria-hidden
        >
          {RAIL.map((Icon, i) => (
            <Icon key={i} className="size-[19px]" strokeWidth={1.8} />
          ))}
        </motion.div>

        {/* role selector card (observed pattern: 2×2 tiles + copy + black CTA) */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.6 }}
          className="absolute -top-[120px] right-[6%] z-20 hidden w-[300px] rounded-[16px] bg-paper p-4 shadow-float lg:block xl:right-[8%]"
        >
          <p className="px-1 pb-4 pt-3 text-center text-[17px] font-semibold">Which role are you exploring?</p>
          {selector}
          <AnimatePresence mode="wait">
            <motion.p key={role} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="mt-4 px-1 text-center text-[15px] leading-relaxed">
              {current.copy}
            </motion.p>
          </AnimatePresence>
          <div className="mt-4 flex justify-center pb-1">
            <button type="button" onClick={explore} className="group/b relative inline-flex h-10 items-center overflow-hidden rounded-[8px] bg-void px-4 text-[15px] font-medium text-paper">
              <span aria-hidden className="absolute inset-0 bg-white/12 opacity-0 transition-opacity duration-300 group-hover/b:opacity-100" />
              <span className="relative">Explore this workspace</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Tablet selector (below the canvas) and mobile layout */}
      <div className="mt-6 lg:hidden">
        <div className="mx-auto max-w-xl rounded-[16px] bg-paper p-4 shadow-float">
          <p className="pb-3 text-center text-[16px] font-semibold">Which role are you exploring?</p>
          {selector}
          <AnimatePresence mode="wait">
            <motion.div key={role} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <p className="mt-4 text-center text-[15px] leading-relaxed">{current.copy}</p>
              <MobilePreview role={role} />
            </motion.div>
          </AnimatePresence>
          <button type="button" onClick={explore} className="mt-4 h-11 w-full rounded-[8px] bg-void text-[15px] font-medium text-paper">
            Explore this workspace
          </button>
        </div>
      </div>
    </div>
  );
}

function MobilePreview({ role }: { role: RoleKey }) {
  const db = useDb();
  const rows: Record<RoleKey, [string, string][]> = {
    fellow: [
      ["Module 2", "Run five customer interviews — draft saved"],
      ["Mentor", "Daniel: “Nine strangers is a real signal.”"],
      ["Progress", `${trackProgress(db, "u_noah", "t_ff").pct}% of Founder Foundations`],
    ],
    instructor: [
      ["To review", `${Object.values(db.submissions).filter((s) => s.status === "submitted").length} submissions across tracks`],
      ["Drafts", "Session 4 — unpublished changes"],
      ["Office hours", "Thursday 5–6pm"],
    ],
    mentor: [
      ["Mentees", "Noah, Diego and Lily"],
      ["Diego", "“Is ten customers a month a good deal?”"],
      ["Oversight", "Program staff can review conversations"],
    ],
    program: [
      ["Winter 2027", `${Object.values(db.applications).filter((a) => a.cohortId === "c_winter27" && a.status !== "draft").length} applications received`],
      ["Rubric", "Four weighted criteria, 0–100"],
      ["Safeguarding", `${Object.values(db.reports).filter((r) => r.status !== "resolved").length} open report`],
    ],
  };
  return (
    <ul className="dots-light mt-4 space-y-2 rounded-[14px] bg-[#fafafa] p-3">
      {rows[role].map(([k, v], i) => (
        <li key={k} className="flex items-start gap-3 rounded-[10px] bg-paper p-3 shadow-sm">
          <span className={cn("mt-1 size-2.5 shrink-0 rounded-[3px]", ["bg-jade", "bg-[#5887ff]", "bg-[#ffaa00]"][i])} aria-hidden />
          <span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{k}</span>
            <span className="text-[14px]">{v}</span>
          </span>
          {i === 0 && <Check className="ml-auto size-4 text-leaf-ink" aria-hidden />}
        </li>
      ))}
    </ul>
  );
}
