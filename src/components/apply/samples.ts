import type { AnswersPatch } from "@/lib/actions/applications";
import type { Application, ApplicationSection, Database, FormQuestion } from "@/lib/domain/types";
import { questionsForApplication, visibleQuestions } from "@/lib/domain/selectors";
import { validateSection } from "@/lib/domain/validation";
import { mergeAnswers } from "./answers";

/*
 * "Fill with sample answers" for presenters. Values are fictional and
 * realistic. Only empty or currently invalid fields are filled, and fields
 * the applicant can't edit (e.g. locked after submission) are never touched.
 */

const ABOUT = {
  fullName: "Jordan Rivera",
  preferredName: "Jordan",
  email: "jordan.rivera@example.org",
  phone: "(555) 014-2290",
  dateOfBirth: "2006-05-14",
  pronouns: "they/them",
  school: "Millbrook Academy",
  guardianName: "Alex Rivera",
  guardianEmail: "alex.rivera@example.org",
};

const IDEA = {
  ventureName: "Night Bus Notes",
  problem:
    "Students who work evening shifts miss the after-school study groups where most exam revision happens. They end up revising alone at midnight with no one to ask, and their grades slip even though they are putting the hours in. Libraries close at six and online forums are full of strangers.",
  customer: "16–19 year olds in Millbrook and Eastbank who work part-time evening jobs while finishing school.",
  stage: "Testing",
  trackPreference: "t_ff",
  whyNow: "I ran a late-night revision group on the 11pm bus for six weeks last spring and four regulars passed exams they had failed before. Their friends keep asking to join.",
};

const CUSTOM_TEXT: Record<string, string> = {
  q_w_started:
    "In tenth grade I started a lunchtime repair table for broken headphones and chargers. I taught two friends to solder, we fixed about sixty things in a term, and the school let us keep a cupboard for parts.",
  q_w_team_who: "My cousin Sam, who is great with spreadsheets and keeps us organized, and a classmate who designs our posters.",
  q_s_problem: "The bus stop outside the youth center has no shelter or lighting, so younger kids wait in the dark after evening clubs.",
  q_s_kickoff_help: "I work Saturday shifts, so I would need a few weeks' notice to swap them.",
  q_s_portfolio: "@nightbusnotes",
  q_l_started: "A lunchtime repair table for broken headphones and chargers — about sixty repairs in one term.",
};

function sampleForQuestion(q: FormQuestion): string | string[] | undefined {
  if (CUSTOM_TEXT[q.id]) return CUSTOM_TEXT[q.id];
  switch (q.kind) {
    case "short":
      return "Happy to share more at interview.";
    case "long":
      return "I learn fastest by doing, and I want to test my idea with real people over the next few months.";
    case "select":
      return q.options?.[0];
    case "yesno":
      return q.options?.[0] ?? "Yes";
    case "multi":
      return (q.options ?? []).slice(0, Math.min(2, q.maxChoices ?? 2));
    default:
      return undefined;
  }
}

function isEmpty(v: unknown) {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

/**
 * Build a patch of sample values for one section (about, idea, questions).
 * Residence is handled with real actions (location check + sample document).
 */
export function sampleAnswersFor(db: Database, app: Application, section: ApplicationSection, canEdit: (key: string) => boolean) {
  const bad = new Set(validateSection(db, app, section).map((i) => i.field));
  const a = app.answers;
  const need = (key: string, current: unknown) => canEdit(key) && (isEmpty(current) || bad.has(key));
  const patch: AnswersPatch = {};
  const filled: string[] = [];

  if (section === "about") {
    const about: AnswersPatch["about"] = {};
    for (const k of Object.keys(ABOUT) as (keyof typeof ABOUT)[]) {
      if (k === "guardianName" || k === "guardianEmail") continue;
      if (need(`about.${k}`, a.about[k])) {
        about[k] = ABOUT[k];
        filled.push(`about.${k}`);
      }
    }
    // Guardian details only when the (possibly new) birth date makes them required.
    const probe = { ...app, answers: mergeAnswers(a, { about }) };
    const guardianIssues = new Set(validateSection(db, probe, "about").map((i) => i.field));
    for (const k of ["guardianName", "guardianEmail"] as const) {
      if (guardianIssues.has(`about.${k}`) && canEdit(`about.${k}`)) {
        about[k] = ABOUT[k];
        filled.push(`about.${k}`);
      }
    }
    if (Object.keys(about).length) patch.about = about;
  }

  if (section === "idea") {
    const idea: AnswersPatch["idea"] = {};
    const cohort = db.cohorts[app.cohortId];
    for (const k of Object.keys(IDEA) as (keyof typeof IDEA)[]) {
      if (!need(`idea.${k}`, a.idea[k])) continue;
      idea[k] = k === "trackPreference" && cohort && !cohort.trackIds.includes(IDEA.trackPreference) ? cohort.trackIds[0] : IDEA[k];
      filled.push(`idea.${k}`);
    }
    if (Object.keys(idea).length) patch.idea = idea;
  }

  if (section === "questions") {
    const questions = questionsForApplication(db, app);
    const custom: NonNullable<AnswersPatch["custom"]> = {};
    // Yes/no and select answers first: they decide which follow-up questions show.
    for (const q of questions.filter((x) => x.kind === "yesno" || x.kind === "select")) {
      if (q.showIf && a.custom[q.showIf.questionId] !== q.showIf.equals) continue;
      if (need(`custom.${q.id}`, a.custom[q.id])) {
        custom[q.id] = sampleForQuestion(q);
        filled.push(`custom.${q.id}`);
      }
    }
    const merged = { ...a.custom, ...custom };
    for (const q of visibleQuestions(questions, merged)) {
      if (q.kind === "yesno" || q.kind === "select" || q.kind === "file") continue;
      if (!q.required && q.kind === "short" && !CUSTOM_TEXT[q.id]) continue;
      if (need(`custom.${q.id}`, a.custom[q.id])) {
        custom[q.id] = sampleForQuestion(q);
        filled.push(`custom.${q.id}`);
      }
    }
    if (Object.keys(custom).length) patch.custom = custom;

    const c = a.commitment ?? {};
    const commitment: AnswersPatch["commitment"] = {};
    if (need("commitment.hoursPerWeek", c.hoursPerWeek)) commitment.hoursPerWeek = "6–8 hours";
    if (need("commitment.availability", c.availability)) commitment.availability = ["Tuesday evenings", "Saturday mornings"];
    if (canEdit("commitment.agreeToCommunityStandards") && !c.agreeToCommunityStandards) commitment.agreeToCommunityStandards = true;
    for (const k of Object.keys(commitment)) filled.push(`commitment.${k}`);
    if (Object.keys(commitment).length) patch.commitment = commitment;
  }

  return { patch, filled };
}

/** Required file questions that are visible and still empty (filled with the bundled sample sketch). */
export function missingFileQuestions(db: Database, app: Application, canEdit: (key: string) => boolean) {
  return visibleQuestions(questionsForApplication(db, app), app.answers.custom).filter(
    (q) => q.kind === "file" && q.required && canEdit(`custom.${q.id}`) && isEmpty(app.answers.custom[q.id]),
  );
}
