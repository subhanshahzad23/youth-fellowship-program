import { cn } from "@/lib/utils";

/**
 * Launchpad wordmark. The mark is three ascending steps with a jade launch
 * point — an original mark (Mural's logo and colours are not reused).
 */
export function LogoMark({ className, dark }: { className?: string; dark?: boolean }) {
  const fg = dark ? "#ffffff" : "#000000";
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect x="3" y="19" width="7" height="10" rx="1.6" fill={fg} opacity={0.35} />
      <rect x="12.5" y="12" width="7" height="17" rx="1.6" fill={fg} opacity={0.65} />
      <rect x="22" y="5" width="7" height="24" rx="1.6" fill={fg} />
      <path d="M22.2 2.5 L28.8 2.5" stroke="#00c27a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, dark, compact, responsive }: { className?: string; dark?: boolean; compact?: boolean; responsive?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark dark={dark} />
      {!compact && (
        <span className={cn("flex items-baseline gap-1.5 text-[19px] leading-none tracking-[-0.02em]", dark ? "text-paper" : "text-void")}>
          <span className="font-semibold">Launchpad</span>
          <span className={cn("font-display text-[20px] font-light italic", dark ? "text-muted-display" : "text-muted", responsive && "hidden min-[430px]:inline")}>Fellowship</span>
        </span>
      )}
    </span>
  );
}
