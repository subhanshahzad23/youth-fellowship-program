"use client";

import { useState } from "react";
import { Clock, FileCheck2, Lightbulb, MapPin, MessageSquareText, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationForm, Cohort } from "@/lib/domain/types";
import { startApplication } from "@/lib/actions/applications";
import { createApplicantAccount } from "@/lib/actions/comms";
import { homeFor, roleLabel } from "@/lib/domain/permissions";
import { SECTION_LABEL, SECTION_ORDER } from "@/lib/domain/validation";
import { useNow } from "@/lib/hooks";
import { setPersona, useDb, useMe } from "@/lib/store/store";
import { fmtDateLong, sleep } from "@/lib/utils";
import { Avatar, Badge, Eyebrow, Panel, PanelHeader } from "@/components/ui/display";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { CohortFacts, daysLeftLabel } from "./window-states";

function IntakeHeader({ cohort, form }: { cohort: Cohort; form: ApplicationForm }) {
  const now = useNow();
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow>{cohort.name} · applications open</Eyebrow>
        <Badge tone="green" icon={<Clock className="size-3.5" aria-hidden />}>
          {daysLeftLabel(form.closesAt, now)}
        </Badge>
      </div>
      <h1 className="mt-3 font-display text-[36px] leading-[1.05] tracking-[-0.035em] sm:text-[48px]">{form.title}</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">{form.intro}</p>
    </div>
  );
}

/** No identity yet: simulated sign-up inline, or continue as the demo applicant. */
export function IdentityStep({ cohort, form }: { cohort: Cohort; form: ApplicationForm }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setError(null);
    setBusy(true);
    await sleep(450);
    const r = createApplicantAccount({ name, email, pronouns: pronouns.trim() || undefined });
    if (!r.ok) {
      setBusy(false);
      setError(r.error);
      return;
    }
    const s = startApplication(cohort.id);
    setBusy(false);
    if (!s.ok) {
      toast.error(s.error);
      return;
    }
    toast.success(r.value.existed ? "Welcome back — you're signed in." : "Account created (simulated). You're signed in.", { description: `Your ${cohort.name} application is ready.` });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <IntakeHeader cohort={cohort} form={form} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <Panel className="sm:p-8">
          <PanelHeader title="Create your applicant account" description="So you can save your answers and come back later. Sign-in is simulated — no password, no real email." />
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <Field label="Full name" htmlFor="acc-name" required error={error && /name/i.test(error) ? error : undefined}>
              <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Rivera" autoComplete="off" aria-invalid={(error && /name/i.test(error)) || undefined} />
            </Field>
            <Field label="Email" htmlFor="acc-email" required hint="Use a made-up address — this is a demo." error={error && /email/i.test(error) ? error : undefined}>
              <Input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.org" autoComplete="off" aria-invalid={(error && /email/i.test(error)) || undefined} />
            </Field>
            <Field label="Pronouns" htmlFor="acc-pronouns" optional>
              <Input id="acc-pronouns" value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="e.g. she/her, they/them" autoComplete="off" />
            </Field>
            {error && !/name|email/i.test(error) && (
              <p className="text-[13.5px] text-[#b00d28]" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" arrow loading={busy} className="w-full sm:w-auto">
              Create account & start
            </Button>
          </form>
        </Panel>
        <div className="flex flex-col gap-4">
          <section aria-label="Demo shortcut" className="dots-dark rounded-[20px] p-5 text-paper sm:p-8">
            <p className="eyebrow text-jade">Presenting the demo?</p>
            <p className="mt-3 font-display text-[28px] leading-[1.1] tracking-[-0.03em]">Pick up Maya&apos;s saved draft</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#c9c9c9]">Maya Chen is a fictional applicant with a Winter 2027 draft saved at the residence step.</p>
            <Button
              className="mt-5"
              variant="light"
              icon={<UserRound className="size-4" />}
              onClick={() => {
                setPersona("u_maya");
                toast.success("Signed in as Maya Chen (demo)");
              }}
            >
              Continue as Maya Chen (demo)
            </Button>
            <ButtonLink href="/demo" variant="ghost-dark" className="mt-2 sm:ml-2 sm:mt-5">
              All demo identities
            </ButtonLink>
          </section>
          <Panel>
            <PanelHeader title="Key dates" level={3} />
            <CohortFacts cohort={cohort} form={form} className="lg:grid-cols-1" />
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Staff identities can't apply — explain and give a way forward. */
export function StaffCannotApply({ cohort }: { cohort: Cohort }) {
  const db = useDb();
  const me = useMe()!;
  return (
    <div className="mx-auto max-w-xl rounded-[24px] bg-paper p-8">
      <span className="grid size-12 place-items-center rounded-full bg-fog">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-[32px] leading-tight tracking-[-0.03em]">Staff accounts can&apos;t apply</h1>
      <p className="mt-2 text-[15.5px] leading-relaxed text-muted">
        You&apos;re signed in as {me.name} ({roleLabel(db, me)}). Applications to {cohort.name} come from applicant accounts, and program staff review them from the admin portal. To try the applicant experience, switch to an applicant identity.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/demo" arrow>
          Switch demo identity
        </ButtonLink>
        <ButtonLink href={homeFor(db, me.id)} variant="outline">
          Go to your home
        </ButtonLink>
      </div>
    </div>
  );
}

const NEEDS = [
  { icon: UserRound, title: "About you", text: "Contact details and date of birth. Under 18 at the start? You'll add a parent or guardian contact." },
  { icon: Lightbulb, title: "Your idea", text: "The problem you've noticed and who has it. Early is fine." },
  { icon: MapPin, title: "Residence", text: "Your home address and a proof of residence document. Sample documents are available in this demo." },
  { icon: MessageSquareText, title: "A few questions", text: "Short answers plus the time you can give each week." },
];

/** Signed-in applicant without an application for this intake yet. */
export function StartScreen({ cohort, form }: { cohort: Cohort; form: ApplicationForm }) {
  const me = useMe()!;
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-5xl">
      <IntakeHeader cohort={cohort} form={form} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Panel className="sm:p-8">
          <div className="flex items-center gap-3">
            <Avatar name={me.name} hue={me.avatarHue} size={40} />
            <div className="min-w-0">
              <p className="text-[15px] font-medium">Applying as {me.name}</p>
              <p className="truncate text-[13px] text-muted">{me.email}</p>
            </div>
          </div>
          <h2 className="mt-6 text-[17px] font-semibold tracking-[-0.01em]">What you&apos;ll need</h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {NEEDS.map((n) => (
              <li key={n.title} className="rounded-[14px] bg-fog p-4">
                <n.icon className="size-5" aria-hidden />
                <p className="mt-2 text-[15px] font-medium">{n.title}</p>
                <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{n.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              arrow
              loading={busy}
              onClick={async () => {
                setBusy(true);
                await sleep(350);
                const r = startApplication(cohort.id);
                setBusy(false);
                if (!r.ok) toast.error(r.error);
              }}
            >
              Start application
            </Button>
            <p className="text-[13.5px] text-muted">About 25 minutes · saves as you go</p>
          </div>
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Five short steps" level={3} />
            <ol className="space-y-2.5">
              {SECTION_ORDER.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-[14.5px]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fog text-[12px] font-semibold tabular">{i + 1}</span>
                  {SECTION_LABEL[s]}
                </li>
              ))}
            </ol>
          </Panel>
          <Panel>
            <PanelHeader title="Key dates" level={3} />
            <dl className="space-y-3 text-[14.5px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Closes</dt>
                <dd className="font-medium">{fmtDateLong(form.closesAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Cohort starts</dt>
                <dd className="font-medium">{fmtDateLong(cohort.startDate)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Where</dt>
                <dd className="text-right font-medium">{cohort.location}</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-[13px] text-muted">
              <FileCheck2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              You can apply to more than one open intake. Each application is reviewed on its own.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
