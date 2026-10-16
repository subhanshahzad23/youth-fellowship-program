"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Clock, Globe, Video } from "lucide-react";
import { VISAS } from "@/lib/content/site";
import { useIsClient } from "@/lib/hooks";
import { EMAIL_RE, useLeads, type Booking } from "@/lib/leads";
import { cn, hashString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorSummary, Field, fieldId, Input, Select, Textarea } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/display";
import { FirstCaseOffer } from "./offer";

/*
 * Booking calendar embed (simulated scheduler, standing in for Calendly /
 * HubSpot Meetings). Goodcase works from Warsaw, so calls run 14:00–19:30 UTC —
 * 9:00 AM to 2:30 PM Eastern. Times show in the visitor's time zone. Nothing
 * is sent; the .ics file and Google Calendar link are real.
 */

const SLOT_UTC = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];
const DURATION_MIN = 30;
const HORIZON_DAYS = 56;
const HOST = "Marta Gronkiewicz, Onboarding Lead";

const ZONES = [
  ["America/New_York", "Eastern Time"],
  ["America/Chicago", "Central Time"],
  ["America/Denver", "Mountain Time"],
  ["America/Phoenix", "Arizona"],
  ["America/Los_Angeles", "Pacific Time"],
  ["America/Anchorage", "Alaska"],
  ["Pacific/Honolulu", "Hawaii"],
  ["Europe/Warsaw", "Central European Time"],
] as const;

const FIRM_SIZES = ["Solo practice", "2–5 attorneys", "6–20 attorneys", "20+ attorneys"];
const VOLUMES = ["1–2 cases a month", "3–5 cases a month", "6–15 cases a month", "16+ cases a month"];

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function slotsFor(key: string, now: number) {
  return SLOT_UTC.map((t, i) => {
    const iso = `${key}T${t}:00.000Z`;
    const ms = Date.parse(iso);
    const taken = hashString(`${key}#${i}`) % 3 === 0;
    return { iso, available: !taken && ms > now + 12 * 3600 * 1000 };
  });
}

function isWorkday(d: Date) {
  const w = d.getUTCDay();
  return w !== 0 && w !== 6;
}

export function icsFor(b: Pick<Booking, "id" | "startISO" | "name" | "firm">) {
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(b.startISO);
  const end = new Date(start.getTime() + DURATION_MIN * 60000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Goodcase//Booking concept//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@goodcase.io`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(start.toISOString())}`,
    `DTEND:${fmt(end.toISOString())}`,
    "SUMMARY:Goodcase intro call (30 min)",
    `DESCRIPTION:30-minute intro call with ${HOST}.\\nWe'll cover your case types\\, volume and what your first case would cost (first case at half price).\\nDesign concept: this booking was simulated.`,
    "LOCATION:Video call — link sent by email",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function googleCalendarUrl(startISO: string) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const s = new Date(startISO);
  const e = new Date(s.getTime() + DURATION_MIN * 60000);
  const p = new URLSearchParams({ action: "TEMPLATE", text: "Goodcase intro call (30 min)", dates: `${fmt(s)}/${fmt(e)}`, details: `30-minute intro call with ${HOST}.`, location: "Video call" });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function downloadIcs(b: Booking) {
  const blob = new Blob([icsFor(b)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "goodcase-intro-call.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BookingWidget() {
  const isClient = useIsClient();
  if (!isClient)
    return (
      <div className="rounded-[24px] bg-paper p-6 shadow-panel" aria-busy="true" aria-label="Loading the booking calendar">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-[300px] w-full" />
      </div>
    );
  return <Scheduler />;
}

type Details = { name: string; email: string; firm: string; firmSize: string; casesPerMonth: string; visas: string[]; notes: string };
const EMPTY: Details = { name: "", email: "", firm: "", firmSize: "", casesPerMonth: "", visas: [], notes: "" };

function validate(d: Details) {
  const out: { field: keyof Details; message: string }[] = [];
  if (!d.name.trim()) out.push({ field: "name", message: "Enter your name" });
  if (!EMAIL_RE.test(d.email.trim())) out.push({ field: "email", message: "Enter a valid work email" });
  if (!d.firm.trim()) out.push({ field: "firm", message: "Enter your firm's name" });
  if (!d.firmSize) out.push({ field: "firmSize", message: "Choose your firm size" });
  if (!d.casesPerMonth) out.push({ field: "casesPerMonth", message: "Choose your typical monthly volume" });
  return out;
}

function Scheduler() {
  const [now] = useState(() => Date.now());
  const detected = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const zones = useMemo(() => (ZONES.some(([z]) => z === detected) ? ZONES.map(([z, l]) => [z, l] as const) : [[detected, "Your time zone"] as const, ...ZONES]), [detected]);
  const [tz, setTz] = useState<string>(ZONES.some(([z]) => z === detected) ? detected : detected || "America/New_York");
  const [h24, setH24] = useState(false);
  const today = useMemo(() => {
    const d = new Date(now);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }, [now]);
  const [month, setMonth] = useState(() => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "details" | "done">("pick");
  const [d, setD] = useState<Details>(EMPTY);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const bookings = useLeads((s) => s.bookings);
  const addBooking = useLeads((s) => s.addBooking);
  const cancelBooking = useLeads((s) => s.cancelBooking);
  const done = bookings.find((b) => b.id === doneId) ?? null;
  const upcoming = bookings.find((b) => Date.parse(b.startISO) > now);

  const timeFmt = useMemo(() => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: !h24 }), [tz, h24]);
  const longFmt = useMemo(() => new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }), [tz]);
  const tzName = useMemo(() => new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date(now)).find((p) => p.type === "timeZoneName")?.value ?? tz, [tz, now]);

  const maxDay = today.getTime() + HORIZON_DAYS * 86400000;
  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getUTCDay() + 6) % 7; // Monday first
    const daysIn = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const out: ({ key: string; n: number; enabled: boolean } | null)[] = Array.from({ length: offset }, () => null);
    for (let n = 1; n <= daysIn; n++) {
      const dt = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), n));
      const key = dayKey(dt);
      const inRange = dt.getTime() > today.getTime() && dt.getTime() <= maxDay;
      const enabled = inRange && isWorkday(dt) && slotsFor(key, now).some((s) => s.available);
      out.push({ key, n, enabled });
    }
    return out;
  }, [month, today, maxDay, now]);

  const canPrev = month.getTime() > Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1);
  const canNext = Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1) <= maxDay;
  const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(month);
  const slots = day ? slotsFor(day, now) : [];

  const issues = tried ? validate(d) : [];
  const err = (f: keyof Details) => issues.find((i) => i.field === f)?.message;
  const set = <K extends keyof Details>(k: K) => (v: Details[K]) => setD((s) => ({ ...s, [k]: v }));

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (validate(d).length || !slot) {
      requestAnimationFrame(() => document.getElementById("booking-errors")?.focus());
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    const b = addBooking({ startISO: slot, timezone: tz, name: d.name.trim(), email: d.email.trim(), firm: d.firm.trim(), firmSize: d.firmSize, casesPerMonth: d.casesPerMonth, visas: d.visas, notes: d.notes.trim() });
    setBusy(false);
    setDoneId(b.id);
    setStep("done");
    toast.success("Call booked", { description: `${longFmt.format(new Date(slot))} · ${timeFmt.format(new Date(slot))}` });
  };

  const restart = () => {
    setStep("pick");
    setSlot(null);
    setDay(null);
    setTried(false);
    setDoneId(null);
  };

  return (
    <div className="overflow-hidden rounded-[24px] bg-paper shadow-panel" data-testid="booking">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <p className="text-[17px] font-semibold tracking-[-0.01em]">Intro call with Goodcase</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> 30 min
            </span>
            <span className="inline-flex items-center gap-1">
              <Video className="size-3.5" aria-hidden /> Video call
            </span>
            <span>with {HOST}</span>
          </p>
        </div>
        <ol className="flex items-center gap-1.5 text-[12px]" aria-label="Booking steps">
          {(["pick", "details", "done"] as const).map((s, i) => (
            <li key={s} aria-current={step === s ? "step" : undefined} className={cn("rounded-full px-2.5 py-1 font-medium", step === s ? "bg-void text-paper" : "bg-fog text-muted")}>
              {i + 1}. {s === "pick" ? "Time" : s === "details" ? "Details" : "Booked"}
            </li>
          ))}
        </ol>
      </div>

      {upcoming && step === "pick" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-leaf px-5 py-3 text-[13.5px] text-leaf-ink sm:px-7">
          <span>
            You already have a call on {new Intl.DateTimeFormat("en-US", { timeZone: upcoming.timezone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(upcoming.startISO))}.
          </span>
          <button
            type="button"
            className="font-medium underline underline-offset-4"
            onClick={() => {
              setDoneId(upcoming.id);
              setStep("done");
            }}
          >
            View booking
          </button>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {step === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
            <div className="min-w-0 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-semibold" aria-live="polite">
                  {monthLabel}
                </p>
                <div className="flex gap-1">
                  <button type="button" disabled={!canPrev} onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))} className="grid size-9 place-items-center rounded-full hover:bg-fog disabled:opacity-30" aria-label="Previous month">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" disabled={!canNext} onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))} className="grid size-9 place-items-center rounded-full hover:bg-fog disabled:opacity-30" aria-label="Next month">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`Available days in ${monthLabel}`}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                  <span key={w} className="pb-1 text-[11.5px] font-medium uppercase tracking-[0.08em] text-muted" role="columnheader">
                    {w.slice(0, 2)}
                  </span>
                ))}
                {cells.map((c, i) =>
                  c ? (
                    <button
                      key={c.key}
                      type="button"
                      disabled={!c.enabled}
                      onClick={() => {
                        setDay(c.key);
                        setSlot(null);
                        // On phones the times sit below the calendar — bring them into view.
                        if (window.matchMedia("(max-width: 767px)").matches) requestAnimationFrame(() => document.getElementById("booking-times")?.scrollIntoView({ behavior: "smooth", block: "start" }));
                      }}
                      aria-pressed={day === c.key}
                      aria-label={`${new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(new Date(c.key))}${c.enabled ? "" : ", unavailable"}`}
                      data-day={c.key}
                      className={cn(
                        "relative grid aspect-square place-items-center rounded-full text-[14.5px] tabular transition-colors",
                        c.enabled ? "bg-leaf/60 font-semibold text-void hover:bg-mint" : "text-[#bdbdbd]",
                        day === c.key && "bg-void! text-paper",
                      )}
                    >
                      {c.n}
                    </button>
                  ) : (
                    <span key={`e${i}`} aria-hidden />
                  ),
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <label htmlFor="tz" className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                  <Globe className="size-3.5" aria-hidden /> Time zone
                </label>
                <select id="tz" value={tz} onChange={(e) => setTz(e.target.value)} className="h-9 min-w-0 max-w-full rounded-[8px] border-[1.5px] border-line bg-paper px-2 text-[13.5px]">
                  {zones.map(([z, l]) => (
                    <option key={z} value={z}>
                      {l} ({z.split("/").pop()?.replace("_", " ")})
                    </option>
                  ))}
                </select>
                <div className="ml-auto flex rounded-[8px] bg-fog p-0.5 text-[12px]" role="radiogroup" aria-label="Clock format">
                  {[false, true].map((v) => (
                    <button key={String(v)} type="button" role="radio" aria-checked={h24 === v} onClick={() => setH24(v)} className={cn("h-7 rounded-[6px] px-2", h24 === v ? "bg-paper font-medium shadow-sm" : "text-muted")}>
                      {v ? "24h" : "am/pm"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div id="booking-times" className="min-w-0 scroll-mt-28 border-t border-line bg-[#fafafa] p-5 sm:p-7 md:border-l md:border-t-0">
              {day ? (
                <>
                  <p className="text-[15px] font-semibold">{longFmt.format(new Date(`${day}T15:00:00Z`))}</p>
                  <p className="text-[12.5px] text-muted">Times in {tzName}</p>
                  <ul className="mt-4 grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-1" aria-label="Available times">
                    {slots.map((s) => (
                      <li key={s.iso}>
                        <button
                          type="button"
                          disabled={!s.available}
                          onClick={() => setSlot(s.iso)}
                          aria-pressed={slot === s.iso}
                          className={cn(
                            "h-11 w-full rounded-[8px] border-[1.5px] text-[14px] font-medium tabular transition-colors",
                            !s.available && "border-transparent bg-transparent text-[#c4c4c4] line-through",
                            s.available && slot !== s.iso && "border-line bg-paper hover:border-void",
                            slot === s.iso && "border-void bg-void text-paper",
                          )}
                        >
                          {timeFmt.format(new Date(s.iso))}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-5 w-full" size="lg" arrow disabled={!slot} onClick={() => setStep("details")}>
                    {slot ? `Continue with ${timeFmt.format(new Date(slot))}` : "Choose a time"}
                  </Button>
                </>
              ) : (
                <div className="grid h-full min-h-[140px] place-items-center text-center md:min-h-[220px]">
                  <div>
                    <CalendarPlus className="mx-auto size-8 text-muted" aria-hidden />
                    <p className="mt-3 text-[15px] font-medium">Pick a highlighted day</p>
                    <p className="mt-1 text-[13.5px] text-muted">Calls run weekdays, 9:00 AM – 2:30 PM Eastern.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === "details" && slot && (
          <motion.form key="details" onSubmit={confirm} noValidate initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-5 p-5 sm:p-7" aria-label="Your details">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-fog px-4 py-3">
              <p className="text-[14.5px]">
                <span className="font-semibold">{longFmt.format(new Date(slot))}</span> · {timeFmt.format(new Date(slot))} {tzName}
              </p>
              <button type="button" className="text-[13.5px] font-medium underline underline-offset-4" onClick={() => setStep("pick")}>
                Change time
              </button>
            </div>
            {issues.length > 0 && (
              <div id="booking-errors" tabIndex={-1}>
                <ErrorSummary issues={issues.map((i) => ({ field: `booking.${i.field}`, message: i.message }))} />
              </div>
            )}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div id={fieldId("booking.name")}>
                <Field label="Your name" required htmlFor="b-name" error={err("name")}>
                  <Input id="b-name" autoComplete="name" value={d.name} onChange={(e) => set("name")(e.target.value)} aria-invalid={!!err("name") || undefined} aria-describedby={err("name") ? "b-name-error" : undefined} />
                </Field>
              </div>
              <div id={fieldId("booking.email")}>
                <Field label="Work email" required htmlFor="b-email" error={err("email")}>
                  <Input id="b-email" type="email" inputMode="email" autoComplete="email" value={d.email} onChange={(e) => set("email")(e.target.value)} aria-invalid={!!err("email") || undefined} aria-describedby={err("email") ? "b-email-error" : undefined} />
                </Field>
              </div>
              <div id={fieldId("booking.firm")}>
                <Field label="Firm" required htmlFor="b-firm" error={err("firm")}>
                  <Input id="b-firm" autoComplete="organization" value={d.firm} onChange={(e) => set("firm")(e.target.value)} aria-invalid={!!err("firm") || undefined} aria-describedby={err("firm") ? "b-firm-error" : undefined} />
                </Field>
              </div>
              <div id={fieldId("booking.firmSize")}>
                <Field label="Firm size" required htmlFor="b-size" error={err("firmSize")}>
                  <Select id="b-size" value={d.firmSize} onChange={(e) => set("firmSize")(e.target.value)} aria-invalid={!!err("firmSize") || undefined} aria-describedby={err("firmSize") ? "b-size-error" : undefined}>
                    <option value="">Choose one</option>
                    {FIRM_SIZES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div id={fieldId("booking.casesPerMonth")} className="sm:col-span-2">
                <Field label="Typical volume" required htmlFor="b-vol" error={err("casesPerMonth")}>
                  <Select id="b-vol" value={d.casesPerMonth} onChange={(e) => set("casesPerMonth")(e.target.value)} aria-invalid={!!err("casesPerMonth") || undefined} aria-describedby={err("casesPerMonth") ? "b-vol-error" : undefined}>
                    <option value="">Choose one</option>
                    {VOLUMES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
            <fieldset>
              <legend className="text-[14.5px] font-medium">
                Case types <span className="ml-1 text-[13px] font-normal text-muted">(optional)</span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {VISAS.map((v) => {
                  const on = d.visas.includes(v.code);
                  return (
                    <button
                      key={v.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("visas")(on ? d.visas.filter((x) => x !== v.code) : [...d.visas, v.code])}
                      className={cn("h-9 rounded-full border-[1.5px] px-3.5 text-[14px] font-medium transition-colors", on ? "border-void bg-void text-paper" : "border-line hover:border-void")}
                    >
                      {v.code}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Field label="Anything we should know?" optional htmlFor="b-notes">
              <Textarea id="b-notes" className="min-h-[90px]" value={d.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Deadlines, RFEs, the templates you use…" />
            </Field>
            <FirstCaseOffer compact />
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" variant="dark" arrow loading={busy}>
                Confirm booking
              </Button>
              <p className="text-[12.5px] text-muted">Concept site: nothing is sent. Please don&apos;t enter client data.</p>
            </div>
          </motion.form>
        )}

        {step === "done" && done && (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="p-5 sm:p-8" role="status" data-testid="booking-done">
            <CheckCircle2 className="size-9 text-jade" aria-hidden />
            <p className="mt-3 font-display text-[34px] font-light leading-tight tracking-[-0.03em]">You&apos;re booked, {done.name.split(" ")[0]}.</p>
            <p className="mt-2 text-[16px]">
              {new Intl.DateTimeFormat("en-US", { timeZone: done.timezone, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(done.startISO))} · 30 min with {HOST}
            </p>
            <p className="mt-1 text-[14px] text-muted">A video link would arrive at {done.email}. In this concept, nothing is sent.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button arrow onClick={() => downloadIcs(done)} data-testid="ics">
                Add to calendar (.ics)
              </Button>
              <a href={googleCalendarUrl(done.startISO)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[8px] border-[1.5px] border-line px-4 text-[15px] font-medium hover:border-void">
                Google Calendar
              </a>
              <Button variant="ghost" onClick={restart}>
                Reschedule
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  cancelBooking(done.id);
                  toast("Booking cancelled");
                  restart();
                }}
              >
                Cancel booking
              </Button>
            </div>
            <div className="mt-8 rounded-[16px] bg-fog p-5">
              <p className="text-[14.5px] font-medium">Before the call (optional)</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-ink">
                <li>A redacted petition you liked, so we can match the format</li>
                <li>Your house templates and citation preferences</li>
                <li>The case types you&apos;d like to hand off first</li>
              </ul>
              <FirstCaseOffer compact className="mt-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
