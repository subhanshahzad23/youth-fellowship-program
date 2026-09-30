"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarDays, CalendarX2, CheckCircle2, Clock, FileQuestion, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationForm, Cohort } from "@/lib/domain/types";
import { registerInterest } from "@/lib/actions/comms";
import { applicationsOf, openForms, sortedCohorts, formForCohort, windowState } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, daysBetween, fmtDate, fmtDateLong, fmtMonthYear, plural, sleep } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Eyebrow, Notice, Panel, PanelHeader, Skeleton } from "@/components/ui/display";
import { Field, Input, Select } from "@/components/ui/form";

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

export function daysLeftLabel(closesAt: string, now: string) {
  const d = daysBetween(now, closesAt);
  if (d <= 0) return "Closes today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

export function CohortFacts({ cohort, form, className }: { cohort: Cohort; form?: ApplicationForm; className?: string }) {
  const facts: { label: string; value: string }[] = [];
  if (form) {
    facts.push({ label: "Applications open", value: fmtDateLong(form.opensAt) });
    facts.push({ label: "Applications close", value: fmtDateLong(form.closesAt) });
  }
  facts.push({ label: "Cohort starts", value: fmtDateLong(cohort.startDate) });
  facts.push({ label: "Program", value: `18 months · until ${fmtMonthYear(cohort.endDate)}` });
  facts.push({ label: "Where", value: cohort.location });
  return (
    <dl className={cn("grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {facts.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="eyebrow text-muted">{f.label}</dt>
          <dd className="mt-1 text-[15.5px] font-medium">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Simulated "tell me when applications open" registration. */
export function InterestForm({ cohorts, title = "Get notified when applications open", compact, stack }: { cohorts: Cohort[]; title?: string; compact?: boolean; stack?: boolean }) {
  const db = useDb();
  const me = useMe();
  const [cohortId, setCohortId] = useState(cohorts[0]?.id ?? "");
  const [name, setName] = useState(me?.name ?? "");
  const [email, setEmail] = useState(me?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field: "name" | "email" | "other"; message: string } | null>(null);
  const [done, setDone] = useState<{ duplicate: boolean; email: string; cohortId: string } | null>(null);
  const target = db.cohorts[cohortId] ?? cohorts[0];
  const targetForm = target ? formForCohort(db, target.id) : undefined;

  if (!target) return null;

  if (done) {
    const c = db.cohorts[done.cohortId];
    return (
      <div className="rounded-[14px] bg-leaf p-4" role="status">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-leaf-ink">
          <CheckCircle2 className="size-4" aria-hidden />
          {done.duplicate ? "You're already on the list" : `You're on the list for ${c?.name}`}
        </p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink">
          {done.duplicate
            ? `${done.email} is already registered for ${c?.name}. We'll email you the day applications open.`
            : `We'll email ${done.email} the day applications open${targetForm && done.cohortId === target.id ? ` on ${fmtDateLong(targetForm.opensAt)}` : ""}. This is a demo, so the email goes to the simulated outbox only.`}
        </p>
        <Button
          className="mt-3"
          size="sm"
          variant="light"
          onClick={() => {
            setDone(null);
            setName("");
            setEmail("");
          }}
        >
          Register someone else
        </Button>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    setBusy(true);
    await sleep(400);
    const r = registerInterest(target.id, name, email);
    setBusy(false);
    if (!r.ok) {
      setError({ field: /name/i.test(r.error) ? "name" : /email/i.test(r.error) ? "email" : "other", message: r.error });
      return;
    }
    setDone({ duplicate: r.value.duplicate, email: email.trim(), cohortId: target.id });
    if (!r.value.duplicate) toast.success(`Registered for ${target.name} updates`, { description: "Simulated — no real email is sent." });
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-3"
      aria-label={title}
    >
      {!compact && <p className="text-[15px] font-semibold">{title}</p>}
      {cohorts.length > 1 && (
        <Field label="Intake" htmlFor={`int-cohort-${target.id}`}>
          <Select id={`int-cohort-${target.id}`} value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className={cn("grid gap-3", !stack && "sm:grid-cols-2")}>
        <Field label="Your name" htmlFor={`int-name-${target.id}`} error={error?.field === "name" ? error.message : undefined}>
          <Input id={`int-name-${target.id}`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="e.g. Jordan Rivera" aria-invalid={error?.field === "name" || undefined} />
        </Field>
        <Field label="Email" htmlFor={`int-email-${target.id}`} error={error?.field === "email" ? error.message : undefined}>
          <Input id={`int-email-${target.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" placeholder="you@example.org" aria-invalid={error?.field === "email" || undefined} />
        </Field>
      </div>
      {error?.field === "other" && <p className="text-[13.5px] text-[#b00d28]" role="alert">{error.message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="dark" loading={busy} icon={<BellRing className="size-4" />}>
          Notify me
        </Button>
        <p className="text-[12.5px] text-muted">Simulated — nothing leaves this browser.</p>
      </div>
    </form>
  );
}

/** Intakes that are open right now (optionally excluding one cohort). */
export function OpenIntakeList({ exclude, emptyText = "No intakes are open right now." }: { exclude?: string; emptyText?: string }) {
  const db = useDb();
  const me = useMe();
  const now = useNow();
  const forms = useMemo(() => openForms(db, now).filter((f) => f.cohortId !== exclude).sort((a, b) => (a.closesAt < b.closesAt ? -1 : 1)), [db, now, exclude]);
  const mine = useMemo(() => (me ? applicationsOf(db, me.id) : []), [db, me]);
  if (!forms.length) return <p className="text-[14px] text-muted">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {forms.map((f) => {
        const c = db.cohorts[f.cohortId];
        const app = mine.find((a) => a.cohortId === f.cohortId);
        const label = !app ? "Apply" : app.status === "draft" || app.status === "changes_requested" ? "Continue" : "View";
        return (
          <li key={f.id} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-fog p-3 sm:flex-nowrap">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-paper">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">{c?.name}</span>
              <span className="block text-[13px] text-muted">
                {app ? "You've started this one · " : ""}Closes {fmtDate(f.closesAt)} · {daysLeftLabel(f.closesAt, now)}
              </span>
            </span>
            <ButtonLink href={`/apply/${c?.slug}`} size="sm" arrow variant={label === "Apply" ? "primary" : "outline"}>
              {label}
            </ButtonLink>
          </li>
        );
      })}
    </ul>
  );
}

function StateHero({ eyebrow, badge, title, children, icon }: { eyebrow: string; badge?: React.ReactNode; title: string; children?: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Panel className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        {badge}
      </div>
      <div className="mt-4 flex items-start gap-4">
        <span className="hidden size-12 shrink-0 place-items-center rounded-full bg-fog sm:grid">{icon}</span>
        <div className="min-w-0">
          <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.035em] sm:text-[44px]">{title}</h1>
          {children}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Window states                                                       */
/* ------------------------------------------------------------------ */

export function UpcomingState({ cohort, form }: { cohort: Cohort; form: ApplicationForm }) {
  const now = useNow();
  const days = Math.max(1, daysBetween(now, form.opensAt));
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <StateHero
        eyebrow={`${cohort.name} intake`}
        badge={<Badge tone="blue" icon={<Clock className="size-3.5" aria-hidden />}>Opens in {plural(days, "day")}</Badge>}
        title={`Applications open ${fmtDateLong(form.opensAt)}`}
        icon={<CalendarDays className="size-5" aria-hidden />}
      >
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
          {cohort.description} The application form isn&apos;t accepting answers yet.
        </p>
      </StateHero>
      <Panel>
        <PanelHeader title="Key dates" />
        <CohortFacts cohort={cohort} form={form} />
      </Panel>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel>
          <PanelHeader title={`Hear when ${cohort.name} opens`} description="One email on opening day. No newsletters." />
          <InterestForm cohorts={[cohort]} compact stack />
        </Panel>
        <Panel>
          <PanelHeader title="Open right now" description="You can apply to an intake that's already open — and to more than one." />
          <OpenIntakeList exclude={cohort.id} />
        </Panel>
      </div>
    </div>
  );
}

export function ClosedState({ cohort, form, hasDraft }: { cohort: Cohort; form: ApplicationForm; hasDraft?: boolean }) {
  const db = useDb();
  const now = useNow();
  const future = useMemo(() => sortedCohorts(db).filter((c) => windowState(formForCohort(db, c.id), now) === "upcoming"), [db, now]);
  const started = now >= cohort.startDate;
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <StateHero
        eyebrow={`${cohort.name} intake`}
        badge={<Badge icon={<CalendarX2 className="size-3.5" aria-hidden />}>Closed</Badge>}
        title={`Applications for ${cohort.name} closed on ${fmtDateLong(form.closesAt)}`}
        icon={<CalendarX2 className="size-5" aria-hidden />}
      >
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
          {started ? `This cohort started on ${fmtDateLong(cohort.startDate)} and isn't taking new fellows.` : `Decisions for this intake are being made now, and the cohort starts on ${fmtDateLong(cohort.startDate)}.`} You can still apply to an open intake, or ask to hear when the next one opens.
        </p>
        {hasDraft && (
          <Notice tone="amber" className="mt-4">
            Your draft for {cohort.name} was saved, but it can&apos;t be submitted now that the window has closed. Your answers are a good head start for the next intake.
          </Notice>
        )}
      </StateHero>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel>
          <PanelHeader title="Open right now" description="Applications you can start today." />
          <OpenIntakeList exclude={cohort.id} emptyText="No other intakes are open right now — register interest and we'll tell you when one opens." />
        </Panel>
        <Panel>
          <PanelHeader
            title={future.length === 1 ? `Hear when ${future[0].name} opens` : "Future intakes"}
            description={
              future.length === 1
                ? `Applications open ${fmtDateLong(formForCohort(db, future[0].id)?.opensAt)}. One email on opening day.`
                : future.length
                  ? "Choose an intake — we'll email you the day it opens."
                  : undefined
            }
          />
          {future.length ? <InterestForm cohorts={future} compact stack /> : <p className="text-[14px] text-muted">No future intakes have been announced yet.</p>}
        </Panel>
      </div>
    </div>
  );
}

export function UnpublishedState({ cohort }: { cohort: Cohort }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <StateHero eyebrow={`${cohort.name} intake`} title="This application form isn't published yet" icon={<FileQuestion className="size-5" aria-hidden />}>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
          The program team is still preparing the {cohort.name} application. Once it&apos;s published, the dates will appear here.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href="/apply" arrow>
            See open intakes
          </ButtonLink>
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
        </div>
      </StateHero>
    </div>
  );
}

export function CohortMissing({ cohortKey }: { cohortKey: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-[24px] bg-paper p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-fog">
        <MapPin className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-[30px] leading-tight tracking-[-0.03em]">We couldn&apos;t find that intake</h1>
      <p className="mt-2 text-[15px] text-muted">
        There&apos;s no cohort called “{cohortKey}”. The link may be mistyped, or the demo data may have been reset.
      </p>
      <div className="mt-6 flex justify-center">
        <ButtonLink href="/apply" arrow>
          See open intakes
        </ButtonLink>
      </div>
    </div>
  );
}

export function ApplySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]" aria-busy="true" aria-label="Loading your application">
      <div className="hidden space-y-3 rounded-[20px] bg-paper p-5 lg:block">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-44" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-64 w-full rounded-[20px]" />
        <Skeleton className="h-40 w-full rounded-[20px]" />
      </div>
    </div>
  );
}

/** Link list of every intake with its current window, used by /apply. */
export function IntakeIndex() {
  const db = useDb();
  const now = useNow();
  const rows = useMemo(
    () =>
      sortedCohorts(db)
        .map((c) => ({ c, form: formForCohort(db, c.id) }))
        .map((x) => ({ ...x, ws: windowState(x.form, now) }))
        .filter((x) => x.ws !== "closed" || now < x.c.startDate),
    [db, now],
  );
  return (
    <div className="mx-auto max-w-4xl">
      <Eyebrow>Apply</Eyebrow>
      <h1 className="mt-2 font-display text-[38px] leading-[1.05] tracking-[-0.035em] sm:text-[48px]">Choose an intake</h1>
      <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted">
        Launchpad is an 18-month fellowship for 16–24 year olds in Greater Larkhaven. You can apply to more than one open intake.
      </p>
      <ul className="mt-6 space-y-3">
        {rows.map(({ c, form, ws }) => (
          <li key={c.id}>
            <Link href={`/apply/${c.slug}`} className="group flex flex-wrap items-center gap-4 rounded-[20px] bg-paper p-5 transition-colors hover:bg-[#fafafa] sm:flex-nowrap">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[18px] font-semibold tracking-[-0.01em]">{c.name}</span>
                  {ws === "open" && <Badge tone="green">Open</Badge>}
                  {ws === "upcoming" && <Badge tone="blue">Opens {fmtDateLong(form?.opensAt)}</Badge>}
                  {ws === "closed" && <Badge>Closed</Badge>}
                  {ws === "unpublished" && <Badge>Not published</Badge>}
                </span>
                <span className="mt-1 block text-[14px] text-muted">
                  Starts {fmtDateLong(c.startDate)} · {c.location}
                  {ws === "open" && form ? ` · closes ${fmtDateLong(form.closesAt)}` : ""}
                </span>
              </span>
              <span className="text-[14px] font-medium underline-offset-2 group-hover:underline">{ws === "open" ? "Start or continue" : "Details"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
