"use client";

import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { toast } from "sonner";
import type { Cohort } from "@/lib/domain/types";
import { createCohort, updateCohort } from "@/lib/actions/admin";
import { useNow } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { addMonthsISO, fmtDateLong, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/display";
import { ErrorSummary, Field, Input, Select, Textarea, fieldId } from "@/components/ui/form";
import { DialogClose, DialogContent, DialogRoot } from "@/components/ui/overlay";
import { COHORT_STATUS_LABEL } from "./cohort-badges";

interface Values {
  name: string;
  startDate: string; // yyyy-mm-dd
  capacity: string;
  location: string;
  description: string;
  status: Cohort["status"];
}

function validate(v: Values, others: Cohort[], opts: { now: string; requireFuture: boolean }) {
  const errors: Partial<Record<keyof Values, string>> = {};
  const name = v.name.trim();
  if (!name) errors.name = "Give the cohort a name, for example “Autumn 2027”.";
  else if (name.length > 40) errors.name = "Keep the name under 40 characters.";
  else if (others.some((c) => c.name.toLowerCase() === name.toLowerCase())) errors.name = "A cohort with that name already exists.";
  if (!v.startDate || Number.isNaN(Date.parse(v.startDate + "T00:00:00Z"))) errors.startDate = "Choose a start date.";
  else if (opts.requireFuture && v.startDate + "T00:00:00.000Z" <= opts.now) errors.startDate = "New cohorts need a start date in the future.";
  const cap = Number(v.capacity);
  if (!v.capacity.trim() || !Number.isInteger(cap)) errors.capacity = "Enter a whole number of places.";
  else if (cap < 4 || cap > 40) errors.capacity = "Capacity must be between 4 and 40 fellows.";
  if (v.description.length > 400) errors.description = "Keep the description under 400 characters.";
  return errors;
}

function EndDatePreview({ startDate }: { startDate: string }) {
  const valid = !!startDate && !Number.isNaN(Date.parse(startDate + "T00:00:00Z"));
  const start = valid ? new Date(startDate + "T00:00:00Z").toISOString() : undefined;
  return (
    <Notice tone={valid ? "green" : "neutral"} icon={<CalendarRange className="size-4" aria-hidden />}>
      {valid ? (
        <>
          Runs 18 months: <span className="font-semibold">{fmtDateLong(start)}</span> to <span className="font-semibold">{fmtDateLong(addMonthsISO(start!, 18))}</span>.
        </>
      ) : (
        "Every cohort runs for 18 months. Choose a start date to see the end date."
      )}
    </Notice>
  );
}

function CohortFields({ v, set, errors, showStatus }: { v: Values; set: (p: Partial<Values>) => void; errors: Partial<Record<keyof Values, string>>; showStatus?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Field label="Cohort name" required htmlFor={fieldId("name")} error={errors.name}>
        <Input id={fieldId("name")} value={v.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={!!errors.name} placeholder="Autumn 2027" autoComplete="off" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Start date" required htmlFor={fieldId("startDate")} error={errors.startDate}>
          <Input id={fieldId("startDate")} type="date" value={v.startDate} onChange={(e) => set({ startDate: e.target.value })} aria-invalid={!!errors.startDate} />
        </Field>
        <Field label="Capacity" required hint="Fellows, 4–40" htmlFor={fieldId("capacity")} error={errors.capacity}>
          <Input id={fieldId("capacity")} type="number" inputMode="numeric" min={4} max={40} value={v.capacity} onChange={(e) => set({ capacity: e.target.value })} aria-invalid={!!errors.capacity} />
        </Field>
      </div>
      <EndDatePreview startDate={v.startDate} />
      {showStatus && (
        <Field label="Status" htmlFor={fieldId("status")}>
          <Select id={fieldId("status")} value={v.status} onChange={(e) => set({ status: e.target.value as Cohort["status"] })}>
            {(Object.keys(COHORT_STATUS_LABEL) as Cohort["status"][]).map((s) => (
              <option key={s} value={s}>
                {COHORT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Location" optional htmlFor={fieldId("location")}>
        <Input id={fieldId("location")} value={v.location} onChange={(e) => set({ location: e.target.value })} placeholder="Larkhaven Makers Hall + online" />
      </Field>
      <Field label="Description" optional hint="Shown on the public cohort page and to fellows." htmlFor={fieldId("description")} error={errors.description}>
        <Textarea id={fieldId("description")} value={v.description} onChange={(e) => set({ description: e.target.value })} className="min-h-[96px]" aria-invalid={!!errors.description} />
      </Field>
    </div>
  );
}

const LABELS: Record<string, string> = { name: "Cohort name", startDate: "Start date", capacity: "Capacity", description: "Description" };

export function NewCohortDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <DialogRoot open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      {open && <NewCohortBody busy={busy} setBusy={setBusy} onDone={(id) => (onOpenChange(false), onCreated(id))} />}
    </DialogRoot>
  );
}

function NewCohortBody({ busy, setBusy, onDone }: { busy: boolean; setBusy: (b: boolean) => void; onDone: (id: string) => void }) {
  const db = useDb();
  const now = useNow();
  const [v, setV] = useState<Values>({ name: "", startDate: "", capacity: "14", location: "", description: "", status: "announced" });
  const [tried, setTried] = useState(false);
  const errors = useMemo(() => validate(v, Object.values(db.cohorts), { now, requireFuture: true }), [v, db.cohorts, now]);
  const shown = tried ? errors : {};

  const submit = async () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    setBusy(true);
    await sleep(500);
    const r = createCohort({ name: v.name, startDate: v.startDate, capacity: Number(v.capacity), description: v.description, location: v.location });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(`${v.name.trim()} created`, { description: "It starts as “Announced”. Add staff and an application form next." });
    onDone(r.value);
  };

  return (
    <DialogContent
      title="New cohort"
      description="Cohorts run for 18 months. Tracks, staff and the application form are set up after creation."
      footer={
        <>
          <DialogClose asChild>
            <Button variant="ghost" disabled={busy}>
              Cancel
            </Button>
          </DialogClose>
          <Button loading={busy} onClick={submit}>
            Create cohort
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="grid grid-cols-1 gap-4"
      >
        {tried && Object.keys(errors).length > 0 && (
          <ErrorSummary issues={Object.entries(errors).map(([k, m]) => ({ field: k, message: `${LABELS[k] ?? k}: ${m}` }))} title="Check these details" />
        )}
        <CohortFields v={v} set={(p) => setV((s) => ({ ...s, ...p }))} errors={shown} />
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
          Create cohort
        </button>
      </form>
    </DialogContent>
  );
}

export function EditCohortDialog({ cohort, open, onOpenChange }: { cohort: Cohort; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <DialogRoot open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      {open && <EditCohortBody cohort={cohort} busy={busy} setBusy={setBusy} onDone={() => onOpenChange(false)} />}
    </DialogRoot>
  );
}

function EditCohortBody({ cohort, busy, setBusy, onDone }: { cohort: Cohort; busy: boolean; setBusy: (b: boolean) => void; onDone: () => void }) {
  const db = useDb();
  const now = useNow();
  const [v, setV] = useState<Values>(() => ({
    name: cohort.name,
    startDate: cohort.startDate.slice(0, 10),
    capacity: String(cohort.capacity),
    location: cohort.location,
    description: cohort.description,
    status: cohort.status,
  }));
  const [tried, setTried] = useState(false);
  const others = useMemo(() => Object.values(db.cohorts).filter((c) => c.id !== cohort.id), [db.cohorts, cohort.id]);
  const errors = useMemo(() => validate(v, others, { now, requireFuture: false }), [v, others, now]);
  const shown = tried ? errors : {};
  const enrolled = Object.values(db.memberships).filter((m) => m.cohortId === cohort.id && m.role === "fellow" && m.status === "active").length;
  const capErr = !errors.capacity && Number(v.capacity) < enrolled ? `${enrolled} fellows are already enrolled — capacity can't be lower.` : undefined;

  const submit = async () => {
    setTried(true);
    if (Object.keys(errors).length || capErr) return;
    setBusy(true);
    await sleep(400);
    const r = updateCohort(cohort.id, {
      name: v.name,
      startDate: v.startDate !== cohort.startDate.slice(0, 10) ? v.startDate : undefined,
      capacity: Number(v.capacity),
      location: v.location.trim(),
      description: v.description.trim(),
      status: v.status,
    });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Cohort details saved");
    onDone();
  };

  return (
    <DialogContent
      title={`Edit ${cohort.name}`}
      description="Changes apply everywhere this cohort appears, including the public site."
      footer={
        <>
          <DialogClose asChild>
            <Button variant="ghost" disabled={busy}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="dark" loading={busy} onClick={submit}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <CohortFields v={v} set={(p) => setV((s) => ({ ...s, ...p }))} errors={{ ...shown, capacity: shown.capacity ?? (tried ? capErr : undefined) }} showStatus />
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
          Save changes
        </button>
      </form>
    </DialogContent>
  );
}
