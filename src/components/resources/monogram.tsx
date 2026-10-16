import { cn, hashString, initials } from "@/lib/utils";

/* Same tone pairs as the team Portrait, so a person keeps one colour across the site. */
const TONES = [
  ["#d5f8e0", "#007b3b"],
  ["#bed7ff", "#195ad7"],
  ["#ffe7a3", "#7a4b00"],
  ["#f3d9ff", "#7b2fb0"],
  ["#ffd6d6", "#a31f1f"],
  ["#e7e7e7", "#333333"],
] as const;

/** Round monogram avatar standing in for a team photo (Goodcase to supply portraits). */
export function Monogram({ name, size = 40, className, ring }: { name: string; size?: number; className?: string; ring?: boolean }) {
  const [bg, ink] = TONES[hashString(name) % TONES.length];
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-display font-normal tracking-[-0.03em]", ring && "ring-2 ring-paper", className)}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)), backgroundColor: bg, color: ink }}
    >
      {initials(name)}
    </span>
  );
}
