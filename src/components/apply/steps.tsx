"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ImageIcon, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import type { FormQuestion } from "@/lib/domain/types";
import { attachSampleToQuestion, attachUploadedDocument, removeDocument } from "@/lib/actions/applications";
import { questionsForApplication, visibleQuestions } from "@/lib/domain/selectors";
import { ageOn, WORD_LIMITS, MIN_PROBLEM_WORDS } from "@/lib/domain/validation";
import { deleteFileBytes } from "@/lib/files";
import { useDb } from "@/lib/store/store";
import { cn, fmtDateLong } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/display";
import { Checkbox, Input, RadioCards, Select, Textarea, WordCounter } from "@/components/ui/form";
import { DocumentRow, FileDrop } from "@/components/ui/files";
import { AVAILABILITY_OPTIONS, COMMUNITY_STANDARDS, HOURS_OPTIONS, STAGE_OPTIONS } from "./answers";
import { controlProps, errorFor, Q, type StepProps } from "./fields";

const EASE = [0.23, 1, 0.32, 1] as const;

/* ------------------------------------------------------------------ */
/* About you                                                           */
/* ------------------------------------------------------------------ */

export function AboutStep(p: StepProps) {
  const a = p.view.about;
  const set = (k: keyof typeof a, v: string) => p.edit({ about: { [k]: v } });
  const age = a.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(a.dateOfBirth) ? ageOn(a.dateOfBirth, p.cohort.startDate) : NaN;
  const needsGuardian = !Number.isNaN(age) && age >= 16 && age < 18;
  const ageHint = Number.isNaN(age)
    ? `The fellowship is for people aged 16–24 when ${p.cohort.name} starts on ${fmtDateLong(p.cohort.startDate)}.`
    : age >= 16 && age <= 24
      ? `You'll be ${age} when ${p.cohort.name} starts on ${fmtDateLong(p.cohort.startDate)}.`
      : `You'd be ${age} when ${p.cohort.name} starts — the fellowship is for people aged 16–24.`;

  return (
    <Panel className="sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Q k="about.fullName" p={p} label="Full name" required>
          <Input {...controlProps(p, "about.fullName")} value={a.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" />
        </Q>
        <Q k="about.preferredName" p={p} label="Preferred name" optional>
          <Input {...controlProps(p, "about.preferredName")} value={a.preferredName ?? ""} onChange={(e) => set("preferredName", e.target.value)} placeholder="What should we call you?" />
        </Q>
        <Q k="about.email" p={p} label="Email" required>
          <Input {...controlProps(p, "about.email")} type="email" value={a.email ?? ""} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        </Q>
        <Q k="about.phone" p={p} label="Phone" optional>
          <Input {...controlProps(p, "about.phone")} type="tel" value={a.phone ?? ""} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="Only used about your application" />
        </Q>
        <Q k="about.dateOfBirth" p={p} label="Date of birth" required hint={ageHint}>
          <Input {...controlProps(p, "about.dateOfBirth", true)} type="date" value={a.dateOfBirth ?? ""} max="2012-12-31" min="1995-01-01" onChange={(e) => set("dateOfBirth", e.target.value)} />
        </Q>
        <Q k="about.pronouns" p={p} label="Pronouns" optional>
          <Input {...controlProps(p, "about.pronouns")} value={a.pronouns ?? ""} onChange={(e) => set("pronouns", e.target.value)} placeholder="e.g. she/her, he/him, they/them" list="pronoun-options" />
          <datalist id="pronoun-options">
            <option value="she/her" />
            <option value="he/him" />
            <option value="they/them" />
          </datalist>
        </Q>
        <Q k="about.school" p={p} label="School, college or workplace" optional className="sm:col-span-2">
          <Input {...controlProps(p, "about.school")} value={a.school ?? ""} onChange={(e) => set("school", e.target.value)} placeholder="e.g. Eastbank High School" />
        </Q>
      </div>

      <AnimatePresence initial={false}>
        {needsGuardian && (
          <motion.div
            key="guardian"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="mt-6 rounded-[16px] bg-fog p-4 sm:p-5"
          >
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              <ShieldCheck className="size-4" aria-hidden /> Parent or guardian contact
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">
              You&apos;ll be under 18 when the cohort starts, so we need a parent or guardian we can contact about your place. We won&apos;t share your answers with them.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Q k="about.guardianName" p={p} label="Their name" required>
                <Input {...controlProps(p, "about.guardianName")} value={a.guardianName ?? ""} onChange={(e) => set("guardianName", e.target.value)} />
              </Q>
              <Q k="about.guardianEmail" p={p} label="Their email" required>
                <Input {...controlProps(p, "about.guardianEmail")} type="email" value={a.guardianEmail ?? ""} onChange={(e) => set("guardianEmail", e.target.value)} />
              </Q>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Your idea                                                           */
/* ------------------------------------------------------------------ */

export function IdeaStep(p: StepProps) {
  const db = useDb();
  const i = p.view.idea;
  const set = (k: keyof typeof i, v: string) => p.edit({ idea: { [k]: v } });
  const tracks = p.cohort.trackIds.map((id) => db.tracks[id]).filter(Boolean);
  return (
    <div className="space-y-4">
      <Panel className="space-y-6 sm:p-8">
        <Q k="idea.ventureName" p={p} label="Working name" required hint="It can change later — plenty of fellows rename in month two.">
          <Input {...controlProps(p, "idea.ventureName", true)} value={i.ventureName ?? ""} onChange={(e) => set("ventureName", e.target.value)} placeholder="e.g. Second Shelf" />
        </Q>
        <Q
          k="idea.problem"
          p={p}
          label="What problem do you want to solve?"
          required
          hint={`What happens, to whom, and how often? At least ${MIN_PROBLEM_WORDS} words.`}
          counter={<WordCounter text={i.problem} limit={WORD_LIMITS.problem} />}
        >
          <Textarea {...controlProps(p, "idea.problem", true)} rows={6} value={i.problem ?? ""} onChange={(e) => set("problem", e.target.value)} />
        </Q>
        <Q k="idea.customer" p={p} label="Who has this problem?" required hint="Be specific: age, place, situation." counter={<WordCounter text={i.customer} limit={WORD_LIMITS.customer} />}>
          <Textarea {...controlProps(p, "idea.customer", true)} rows={3} className="min-h-[88px]" value={i.customer ?? ""} onChange={(e) => set("customer", e.target.value)} />
        </Q>
        <Q k="idea.whyNow" p={p} label="Why is now the right time for you?" required counter={<WordCounter text={i.whyNow} limit={WORD_LIMITS.whyNow} />}>
          <Textarea {...controlProps(p, "idea.whyNow")} rows={4} value={i.whyNow ?? ""} onChange={(e) => set("whyNow", e.target.value)} />
        </Q>
      </Panel>
      <Panel className="space-y-6 sm:p-8">
        <Q k="idea.stage" p={p} label="How far along is it?" required labelFor={false}>
          <RadioCards
            name="idea-stage"
            value={i.stage}
            onChange={(v) => set("stage", v)}
            options={STAGE_OPTIONS}
            columns={3}
            invalid={!!errorFor(p, "idea.stage")}
            disabled={!p.canEdit("idea.stage")}
          />
        </Q>
        <Q k="idea.trackPreference" p={p} label="Which track fits you best?" required hint="Everyone shares the same cohort; your track shapes your learning sessions." labelFor={false}>
          <RadioCards
            name="idea-track"
            value={i.trackPreference}
            onChange={(v) => set("trackPreference", v)}
            options={tracks.map((t) => ({ value: t.id, label: t.name, description: t.tagline }))}
            columns={3}
            invalid={!!errorFor(p, "idea.trackPreference")}
            disabled={!p.canEdit("idea.trackPreference")}
          />
        </Q>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Questions & documents                                               */
/* ------------------------------------------------------------------ */

function FileQuestion({ q, p }: { q: FormQuestion; p: StepProps }) {
  const db = useDb();
  const key = `custom.${q.id}`;
  const v = p.view.custom[q.id];
  const doc = typeof v === "string" ? db.documents[v] : undefined;
  const attached = doc && !doc.removedAt ? doc : undefined;
  const [replacing, setReplacing] = useState(false);
  const editable = p.canEdit(key);

  const attachSample = () => {
    // Retire the current file first (while it's still linked to this question), then attach the sample.
    if (attached) {
      const rm = removeDocument(p.app.id, attached.id);
      if (!rm.ok) return toast.error(rm.error);
      if (rm.value) void deleteFileBytes(rm.value);
    }
    const r = attachSampleToQuestion(p.app.id, q.id);
    if (!r.ok) return toast.error(r.error);
    setReplacing(false);
    toast.success("Sample sketch attached", { description: "A fictional, watermarked image bundled with the demo." });
  };

  return (
    <div className="space-y-3">
      {attached && (
        <DocumentRow
          doc={attached}
          onReplace={editable ? () => setReplacing((x) => !x) : undefined}
          removable={editable}
          onRemove={() => {
            const r = removeDocument(p.app.id, attached.id);
            if (!r.ok) return toast.error(r.error);
            if (r.value) void deleteFileBytes(r.value);
            setReplacing(false);
            toast.success(`Removed ${attached.name}`);
          }}
        />
      )}
      {editable && (!attached || replacing) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr] sm:items-stretch">
          <Button variant="soft" className="h-auto min-h-12 justify-start py-2" icon={<ImageIcon className="size-4" />} onClick={attachSample}>
            Use a sample sketch
          </Button>
          <FileDrop
            compact
            label={attached ? "Upload a replacement" : "Upload a file"}
            onStored={(file) => {
              const prevBlob = attached?.blobKey;
              // The action retires the previous file record; we clear its stored bytes.
              const r = attachUploadedDocument(p.app.id, file, { kind: "question", questionId: q.id });
              if (!r.ok) {
                void deleteFileBytes(file.blobKey);
                return toast.error(r.error);
              }
              if (prevBlob) void deleteFileBytes(prevBlob);
              setReplacing(false);
              toast.success(`${file.name} uploaded`, { description: "Stored in this browser only." });
            }}
          />
        </div>
      )}
      {!editable && !attached && <p className="text-[14px] text-muted">No file attached.</p>}
    </div>
  );
}

function CustomQuestion({ q, p }: { q: FormQuestion; p: StepProps }) {
  const key = `custom.${q.id}`;
  const v = p.view.custom[q.id];
  const set = (val: string | string[]) => p.edit({ custom: { [q.id]: val } });
  const ctrl = controlProps(p, key, !!q.help);
  const common = { k: key, p, label: q.label, required: q.required, optional: !q.required, hint: q.help };

  switch (q.kind) {
    case "short":
      return (
        <Q {...common}>
          <Input {...ctrl} value={typeof v === "string" ? v : ""} onChange={(e) => set(e.target.value)} />
        </Q>
      );
    case "long":
      return (
        <Q {...common} counter={<WordCounter text={typeof v === "string" ? v : ""} limit={q.wordLimit} />}>
          <Textarea {...ctrl} rows={5} value={typeof v === "string" ? v : ""} onChange={(e) => set(e.target.value)} />
        </Q>
      );
    case "select":
      return (
        <Q {...common}>
          <Select {...ctrl} value={typeof v === "string" ? v : ""} onChange={(e) => set(e.target.value)}>
            <option value="">Choose one…</option>
            {(q.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Q>
      );
    case "yesno":
      return (
        <Q {...common} labelFor={false}>
          <RadioCards
            name={key}
            value={typeof v === "string" ? v : undefined}
            onChange={(val) => set(val)}
            options={(q.options ?? ["Yes", "No"]).map((o) => ({ value: o, label: o }))}
            columns={2}
            invalid={!!ctrl["aria-invalid"]}
            disabled={ctrl.disabled}
          />
        </Q>
      );
    case "multi": {
      const chosen = Array.isArray(v) ? v : [];
      const max = q.maxChoices;
      return (
        <Q {...common} labelFor={false} counter={max ? <span className={cn("tabular text-[12.5px]", chosen.length > max ? "font-medium text-[#b00d28]" : "text-muted")}>{chosen.length} / {max} chosen</span> : undefined}>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-[12px] border-[1.5px] border-line p-3 sm:grid-cols-2" role="group" aria-label={q.label}>
            {(q.options ?? []).map((o, idx) => {
              const on = chosen.includes(o);
              const atMax = !!max && chosen.length >= max && !on;
              return (
                <Checkbox
                  key={o}
                  id={idx === 0 ? ctrl.id : undefined}
                  checked={on}
                  disabled={ctrl.disabled || atMax}
                  invalid={!!ctrl["aria-invalid"]}
                  onChange={(c) => set(c ? [...chosen, o] : chosen.filter((x) => x !== o))}
                  label={o}
                />
              );
            })}
          </div>
        </Q>
      );
    }
    case "file":
      return (
        <Q {...common} labelFor={false} hint={q.help ?? "PDF, PNG, JPG or WebP up to 8 MB. Only you and your assigned reviewers can open it."}>
          <FileQuestion q={q} p={p} />
        </Q>
      );
  }
}

export function QuestionsStep(p: StepProps) {
  const db = useDb();
  const questions = useMemo(() => visibleQuestions(questionsForApplication(db, p.app), p.view.custom), [db, p.app, p.view.custom]);
  const c = p.view.commitment ?? {};
  const setC = (patch: NonNullable<StepProps["view"]["commitment"]>) => p.edit({ commitment: patch });
  const avail = c.availability ?? [];
  return (
    <div className="space-y-4">
      <Panel className="sm:p-8">
        <PanelHeader title={`From the ${p.cohort.name} team`} description="These questions are specific to this intake." />
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {questions.map((q) => (
              <motion.div key={q.id} layout="position" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}>
                <CustomQuestion q={q} p={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Panel>

      <Panel className="sm:p-8">
        <PanelHeader title="Your commitment" description="The fellowship runs for 18 months with weekly sessions. Be realistic — it helps us support you." />
        <div className="space-y-6">
          <Q k="commitment.hoursPerWeek" p={p} label="How many hours a week can you give?" required>
            <Select {...controlProps(p, "commitment.hoursPerWeek")} value={c.hoursPerWeek ?? ""} onChange={(e) => setC({ hoursPerWeek: e.target.value })}>
              <option value="">Choose one…</option>
              {HOURS_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </Q>
          <Q k="commitment.availability" p={p} label="When are you usually free?" required hint="Choose every time that usually works." labelFor={false}>
            <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-[12px] border-[1.5px] border-line p-3 sm:grid-cols-2" role="group" aria-label="When are you usually free?">
              {AVAILABILITY_OPTIONS.map((o, idx) => (
                <Checkbox
                  key={o}
                  id={idx === 0 ? controlProps(p, "commitment.availability").id : undefined}
                  checked={avail.includes(o)}
                  disabled={!p.canEdit("commitment.availability")}
                  invalid={!!errorFor(p, "commitment.availability")}
                  onChange={(on) => setC({ availability: on ? [...avail, o] : avail.filter((x) => x !== o) })}
                  label={o}
                />
              ))}
            </div>
          </Q>
          <Q k="commitment.agreeToCommunityStandards" p={p} label="Community standards" required labelFor={false}>
            <div className="rounded-[12px] bg-fog p-4">
              <p className="flex items-center gap-2 text-[14px] font-medium">
                <Users className="size-4" aria-hidden /> As a fellow, you agree to:
              </p>
              <ul className="mt-2 space-y-1 pl-5 text-[14px] leading-relaxed text-ink">
                {COMMUNITY_STANDARDS.map((s) => (
                  <li key={s} className="list-disc">
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-line pt-3">
                <Checkbox
                  id={controlProps(p, "commitment.agreeToCommunityStandards").id}
                  checked={!!c.agreeToCommunityStandards}
                  disabled={!p.canEdit("commitment.agreeToCommunityStandards")}
                  invalid={!!errorFor(p, "commitment.agreeToCommunityStandards")}
                  onChange={(v) => setC({ agreeToCommunityStandards: v })}
                  label="I'll follow the Launchpad community standards"
                />
              </div>
            </div>
          </Q>
        </div>
      </Panel>
    </div>
  );
}
