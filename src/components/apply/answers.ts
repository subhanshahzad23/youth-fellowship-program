import type { AnswersPatch } from "@/lib/actions/applications";
import type { Application, ApplicationAnswers, ApplicationSection, Database, FormQuestion } from "@/lib/domain/types";
import { questionsForApplication } from "@/lib/domain/selectors";
import { CHANGEABLE_FIELDS } from "@/lib/domain/validation";

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */

export const HOURS_OPTIONS = ["3–5 hours", "6–8 hours", "9–12 hours", "More than 12 hours"];

export const AVAILABILITY_OPTIONS = ["Tuesday evenings", "Thursday evenings", "Saturday mornings", "Saturday afternoons", "Sunday afternoons"];

export const STAGE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "Idea", label: "Idea", description: "I've spotted a problem and I'm thinking about it." },
  { value: "Testing", label: "Testing", description: "I've talked to people or tried a small experiment." },
  { value: "Prototype", label: "Prototype", description: "I've made a first version people can try." },
  { value: "First customers", label: "First customers", description: "Someone has paid or signed up." },
  { value: "Growing", label: "Growing", description: "It's running and I want it to grow." },
];

export const PROOF_TYPES = ["Utility bill", "Tenancy letter", "School enrollment letter", "Bank or benefits letter", "Other official letter", "Uploaded document"];

export const COMMUNITY_STANDARDS = [
  "Treat fellows, mentors and staff with respect — online and in person.",
  "Keep other people's ideas and stories confidential unless they say otherwise.",
  "Show up, or let your program manager know when you can't.",
  "Use fellowship messaging for fellowship work; staff can review conversations to keep everyone safe.",
];

export const SECTION_COPY: Record<ApplicationSection, string> = {
  about: "The basics, so we know who we're talking to. Your contact details are only visible to reviewers assigned to your application.",
  idea: "It's fine if it's early. We care more about the problem you've noticed than a polished plan.",
  residence: "Launchpad serves young people who live in Greater Larkhaven. We check where your address is, and a reviewer checks a proof of residence document — two separate steps.",
  questions: "A few questions from the program team, plus how much time you can give over 18 months.",
  review: "Check everything once more. After you submit, your answers are locked unless a reviewer asks for changes.",
};

/* ------------------------------------------------------------------ */
/* Patch helpers                                                       */
/* ------------------------------------------------------------------ */

type PatchSection = keyof AnswersPatch;
const PATCH_SECTIONS: PatchSection[] = ["about", "idea", "residence", "custom", "commitment"];

export function isEmptyPatch(p: AnswersPatch) {
  return PATCH_SECTIONS.every((s) => !p[s] || Object.keys(p[s] as object).length === 0);
}

export function mergePatch(a: AnswersPatch, b: AnswersPatch): AnswersPatch {
  const out: AnswersPatch = { ...a };
  for (const s of PATCH_SECTIONS) {
    if (!b[s]) continue;
    (out as Record<string, unknown>)[s] = { ...((a[s] as object) ?? {}), ...(b[s] as object) };
  }
  return out;
}

/** Drop pending keys (e.g. "residence.address") once the store owns their value. */
export function withoutKeys(p: AnswersPatch, keys: string[]): AnswersPatch {
  const out: AnswersPatch = {};
  for (const s of PATCH_SECTIONS) {
    const fields = p[s] as Record<string, unknown> | undefined;
    if (!fields) continue;
    const kept = Object.fromEntries(Object.entries(fields).filter(([k]) => !keys.includes(`${s}.${k}`)));
    if (Object.keys(kept).length) (out as Record<string, unknown>)[s] = kept;
  }
  return out;
}

/** What the applicant sees: stored answers with unsaved edits layered on top. */
export function mergeAnswers(base: ApplicationAnswers, p: AnswersPatch): ApplicationAnswers {
  const residence = { ...base.residence, ...p.residence };
  // An edited (not yet re-checked) address invalidates the previous location check.
  if (p.residence?.address !== undefined && p.residence.address !== base.residence.address && !p.residence.check) residence.check = undefined;
  return {
    about: { ...base.about, ...p.about },
    idea: { ...base.idea, ...p.idea },
    residence,
    custom: { ...base.custom, ...p.custom },
    commitment: p.commitment ? { ...(base.commitment ?? {}), ...p.commitment } : base.commitment,
  };
}

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

const STATIC_LABELS: Record<string, string> = {
  "about.fullName": "Full name",
  "about.preferredName": "Preferred name",
  "about.email": "Email",
  "about.phone": "Phone",
  "about.dateOfBirth": "Date of birth",
  "about.pronouns": "Pronouns",
  "about.school": "School, college or workplace",
  "about.guardianName": "Parent or guardian name",
  "about.guardianEmail": "Parent or guardian email",
  "idea.ventureName": "Working name",
  "idea.problem": "The problem",
  "idea.customer": "Who has the problem",
  "idea.stage": "How far along",
  "idea.trackPreference": "Track preference",
  "idea.whyNow": "Why now",
  "residence.address": "Home address",
  "residence.proof": "Proof of residence",
  "commitment.hoursPerWeek": "Hours per week",
  "commitment.availability": "Availability",
  "commitment.agreeToCommunityStandards": "Community standards",
};

export function fieldLabel(db: Database, app: Application, key: string) {
  if (key.startsWith("custom.")) {
    const q = questionsForApplication(db, app).find((x) => x.id === key.slice(7));
    return q?.label ?? "Custom question";
  }
  return CHANGEABLE_FIELDS.find((f) => f.key === key)?.label ?? STATIC_LABELS[key] ?? key;
}

export function questionShortLabel(q: FormQuestion) {
  return q.label.length > 64 ? q.label.slice(0, 61).trimEnd() + "…" : q.label;
}
