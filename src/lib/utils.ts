import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
 * All demo timestamps are UTC ISO strings. Formatting always pins the UTC
 * time zone so server-rendered and client-rendered output match exactly.
 */
const TZ = "UTC";

const dateFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" });
const dateShortFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" });
const monthYearFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long", year: "numeric" });
const monthShortYearFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
const longDateFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long", day: "numeric", year: "numeric" });

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  return dateFmt.format(new Date(iso));
}
export function fmtDateLong(iso?: string) {
  if (!iso) return "—";
  return longDateFmt.format(new Date(iso));
}
export function fmtDateShort(iso?: string) {
  if (!iso) return "—";
  return dateShortFmt.format(new Date(iso));
}
export function fmtMonthYear(iso?: string) {
  if (!iso) return "—";
  return monthYearFmt.format(new Date(iso));
}
export function fmtMonthShortYear(iso?: string) {
  if (!iso) return "—";
  return monthShortYearFmt.format(new Date(iso));
}
export function fmtTime(iso?: string) {
  if (!iso) return "—";
  return timeFmt.format(new Date(iso));
}
export function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  return `${fmtDate(iso)}, ${fmtTime(iso)}`;
}
export function fmtWeekday(iso?: string) {
  if (!iso) return "—";
  return weekdayFmt.format(new Date(iso));
}

/** Relative time against the demo clock ("just now", "12 min ago", "Yesterday", "Oct 12"). */
export function fmtRelative(iso: string | undefined, nowIso: string) {
  if (!iso) return "—";
  const diff = new Date(nowIso).getTime() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  // useNow() refreshes periodically, so an event recorded moments ago can be
  // slightly ahead of the cached "now" — that is "just now", not the future.
  if (diff < 0 && diff > -90000) return "just now";
  if (diff < 0) {
    const ahead = Math.abs(min);
    if (ahead < 60) return `in ${Math.max(1, ahead)} min`;
    const h = Math.round(ahead / 60);
    if (h < 24) return `in ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? "tomorrow" : `in ${d} days`;
  }
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return fmtDateShort(iso);
}

/** Whole days between two ISO dates (b - a). */
export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function addMonthsISO(iso: string, months: number) {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

export function addDaysISO(iso: string, days: number) {
  return new Date(new Date(iso).getTime() + days * 86400000).toISOString();
}

export function plural(n: number, one: string, many?: string) {
  return `${n} ${n === 1 ? one : many ?? one + "s"}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function wordCount(text?: string) {
  if (!text) return 0;
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function uid(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${rand}`;
}

export function sortBy<T>(arr: T[], key: (t: T) => string | number, dir: "asc" | "desc" = "asc") {
  const m = dir === "asc" ? 1 : -1;
  return [...arr].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka < kb ? -1 * m : ka > kb ? 1 * m : 0;
  });
}

export function groupBy<T>(arr: T[], key: (t: T) => string) {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

/** Tiny deterministic PRNG for seed data (mulberry32). */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Render lightweight markdown (**bold**, *italic*, [text](url)) into safe segments. */
export type InlineSegment = { kind: "text" | "bold" | "italic" | "link"; text: string; href?: string };
export function parseInline(text: string): InlineSegment[] {
  const out: InlineSegment[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[2]) out.push({ kind: "bold", text: m[2] });
    else if (m[3]) out.push({ kind: "italic", text: m[3] });
    else if (m[4]) out.push({ kind: "link", text: m[4], href: m[5] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}
