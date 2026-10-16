"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { AlertTriangle, CircleDashed, Lock } from "lucide-react";
import { cn, initials } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Panel({ className, children, as: As = "section", ...rest }: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "aside" }) {
  return (
    <As className={cn("min-w-0 rounded-[20px] bg-paper p-5 sm:p-6", className)} {...rest}>
      {children}
    </As>
  );
}

export function PanelHeader({ title, description, actions, className, level = 2 }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <H className="text-[17px] font-semibold tracking-[-0.01em]">{title}</H>
        {description && <p className="mt-0.5 text-[14px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow text-muted", className)}>{children}</p>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.035em] sm:text-[42px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "purple" | "dark";

const tones: Record<Tone, string> = {
  neutral: "bg-fog text-ink",
  green: "bg-leaf text-leaf-ink",
  amber: "bg-[#fff1cc] text-[#7a4b00]",
  red: "bg-[#ffe4e6] text-[#9f1239]",
  blue: "bg-[#e3edff] text-[#1e40af]",
  purple: "bg-[#f3e8ff] text-[#6b21a8]",
  dark: "bg-void text-paper",
};

export function Badge({ tone = "neutral", children, className, icon }: { tone?: Tone; children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-[26px] px-2.5 text-[12.5px] font-medium", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

export function Avatar({ name, hue = 160, size = 36, className, ring }: { name: string; hue?: number; size?: number; className?: string; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-void", ring && "ring-2 ring-paper", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36), background: `hsl(${hue} 70% 84%)` }}
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function ProgressBar({ value, className, label, tone = "jade" }: { value: number; className?: string; label?: string; tone?: "jade" | "dark" }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ash", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label}>
      <motion.div
        className={cn("h-full rounded-full", tone === "jade" ? "bg-jade" : "bg-void")}
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}

export function ProgressRing({ value, size = 64, stroke = 6, label, children }: { value: number; size?: number; stroke?: number; label?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${v}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eeeeee" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#00c27a"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (v / 100) * c }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>
      <span className="absolute text-[13px] font-semibold tabular">{children ?? `${v}%`}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export function Stat({ label, value, detail, href, className }: { label: string; value: React.ReactNode; detail?: React.ReactNode; href?: string; className?: string }) {
  const inner = (
    <>
      <p className="text-[13.5px] text-muted">{label}</p>
      <p className="mt-1 font-display text-[40px] leading-none tracking-[-0.04em] tabular">{value}</p>
      {detail && <p className="mt-2 text-[13px] text-muted">{detail}</p>}
    </>
  );
  const cls = cn("block rounded-[16px] bg-paper p-5 transition-colors", href && "hover:bg-[#fafafa] focus-visible:outline-2", className);
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty, restricted, not found                                        */
/* ------------------------------------------------------------------ */

export function EmptyState({ icon, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[16px] border-[1.5px] border-dashed border-line px-6 py-10 text-center", className)}>
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-full bg-fog text-void">{icon}</div>}
      <p className="text-[16px] font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-md text-[14px] text-muted">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "neutral", icon, title, children, className, action }: { tone?: Tone; icon?: React.ReactNode; title?: React.ReactNode; children?: React.ReactNode; className?: string; action?: React.ReactNode }) {
  const bg: Record<Tone, string> = {
    neutral: "bg-fog",
    green: "bg-leaf",
    amber: "bg-[#fff6dd]",
    red: "bg-[#fff1f2]",
    blue: "bg-[#eef4ff]",
    purple: "bg-[#f7f0ff]",
    dark: "bg-void text-paper",
  };
  return (
    <div className={cn("flex items-start gap-3 rounded-[12px] px-4 py-3 text-[14px]", bg[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "leading-relaxed")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function RestrictedState({ title = "Restricted", reason, action }: { title?: string; reason: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border-[1.5px] border-dashed border-line bg-[#fafafa] p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ash">
        <Lock className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[14.5px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted">{reason}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

export function WarningLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[13.5px] text-[#7a4b00]">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[10px]", className)} aria-hidden />;
}

export function Pending({ label = "Not started" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      <CircleDashed className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-[5px] border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-muted">{children}</kbd>;
}
