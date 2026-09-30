/**
 * Injectable demo clock.
 *
 * The demo always starts on October 30, 2026 (10:00 UTC) regardless of the
 * real date, then advances in real time so ordering of new events is natural.
 * The anchor lives in the persisted store; resetting the demo re-anchors it.
 * Server rendering and the first client render both use DEMO_BASE so there
 * is never a hydration mismatch.
 */
export const DEMO_BASE_ISO = "2026-10-30T10:00:00.000Z";
export const DEMO_BASE_MS = Date.parse(DEMO_BASE_ISO);

export interface ClockAnchor {
  demoMs: number;
  realMs: number;
}

let anchor: ClockAnchor | null = null;

export function setClockAnchor(a: ClockAnchor | null) {
  anchor = a;
  refreshNow();
}

export function freshAnchor(): ClockAnchor {
  return { demoMs: DEMO_BASE_MS, realMs: Date.now() };
}

/*
 * The demo clock only advances while the demo is open: the last seen demo time
 * is saved periodically and resumed on the next visit. Reopening the demo days
 * later therefore still shows the October 30, 2026 scenario.
 */
const CLOCK_KEY = "launchpad-demo-clock";

export function resumeAnchor(): ClockAnchor {
  try {
    const raw = window.localStorage.getItem(CLOCK_KEY);
    const saved = raw ? (JSON.parse(raw) as { demoMs?: number }) : null;
    if (saved && typeof saved.demoMs === "number" && saved.demoMs >= DEMO_BASE_MS) return { demoMs: saved.demoMs, realMs: Date.now() };
  } catch {
    /* storage unavailable — start from the base */
  }
  return freshAnchor();
}

export function saveClock(demoMs = nowMs()) {
  try {
    window.localStorage.setItem(CLOCK_KEY, JSON.stringify({ demoMs }));
  } catch {
    /* ignore */
  }
}

export function nowMs(): number {
  if (!anchor || typeof window === "undefined") return DEMO_BASE_MS;
  return anchor.demoMs + (Date.now() - anchor.realMs);
}

export function nowISO(): string {
  return new Date(nowMs()).toISOString();
}

/** Seed helper: ISO string relative to the demo base. */
export function ago(days: number, hours = 0, minutes = 0): string {
  return new Date(DEMO_BASE_MS - ((days * 24 + hours) * 60 + minutes) * 60000).toISOString();
}
export function ahead(days: number, hours = 0): string {
  return new Date(DEMO_BASE_MS + (days * 24 + hours) * 3600000).toISOString();
}

/* ------------------------------------------------------------------ */
/* Subscription for React (useSyncExternalStore)                       */
/* ------------------------------------------------------------------ */

let nowCache = DEMO_BASE_ISO;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

/** Recompute the cached "now" (minute-level precision is enough for the UI). */
export function refreshNow() {
  const next = nowISO();
  if (next.slice(0, 16) !== nowCache.slice(0, 16) || !anchor) {
    nowCache = next;
    listeners.forEach((l) => l());
  }
}

export function subscribeNow(cb: () => void) {
  listeners.add(cb);
  if (!timer && typeof window !== "undefined") timer = setInterval(refreshNow, 15000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export const getNowSnapshot = () => nowCache;
export const getNowServerSnapshot = () => DEMO_BASE_ISO;
