import { cn } from "@/lib/utils";

/**
 * Goodcase mark — a refreshed take on the current "G" in a rounded square:
 * ink tile, open G stroke, and the crossbar in the jade accent (the
 * "signature" stroke: the attorney's mark that finishes every petition).
 */
export function LogoMark({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill={dark ? "#ffffff" : "#000000"} />
      <path d="M22.1 9.9 A8.6 8.6 0 1 0 24.6 16" fill="none" stroke={dark ? "#000000" : "#ffffff"} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M24.6 16 L17.2 16" fill="none" stroke="#00c27a" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, dark, compact }: { className?: string; dark?: boolean; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark dark={dark} />
      {!compact && <span className={cn("text-[21px] font-semibold leading-none tracking-[-0.035em]", dark ? "text-paper" : "text-void")}>Goodcase</span>}
    </span>
  );
}
