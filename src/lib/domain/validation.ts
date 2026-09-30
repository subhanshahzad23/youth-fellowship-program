import type { Application, ApplicationSection, Database } from "./types";
import { questionsForApplication, visibleQuestions } from "./selectors";
import { wordCount } from "@/lib/utils";

export interface Issue {
  section: ApplicationSection;
  field: string; // e.g. "about.fullName", "custom.q_w_team"
  message: string;
}

export const SECTION_ORDER: ApplicationSection[] = ["about", "idea", "residence", "questions", "review"];
export const SECTION_LABEL: Record<ApplicationSection, string> = {
  about: "About you",
  idea: "Your idea",
  residence: "Residence eligibility",
  questions: "Questions & documents",
  review: "Review & submit",
};

export const WORD_LIMITS = { problem: 250, whyNow: 150, customer: 80 } as const;
export const MIN_PROBLEM_WORDS = 20;

/** Age on a given date from an ISO yyyy-mm-dd birth date. */
export function ageOn(dob: string, onISO: string) {
  const b = new Date(dob + "T00:00:00Z");
  const d = new Date(onISO);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const m = d.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && d.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateSection(db: Database, app: Application, section: ApplicationSection): Issue[] {
  const issues: Issue[] = [];
  const add = (field: string, message: string) => issues.push({ section, field, message });
  const a = app.answers;
  const cohort = db.cohorts[app.cohortId];

  if (section === "about") {
    if (!a.about.fullName?.trim()) add("about.fullName", "Enter your full name.");
    if (!a.about.email?.trim()) add("about.email", "Enter your email address.");
    else if (!EMAIL_RE.test(a.about.email)) add("about.email", "Enter an email address in the format name@example.org.");
    if (!a.about.dateOfBirth) add("about.dateOfBirth", "Enter your date of birth.");
    else if (cohort) {
      const age = ageOn(a.about.dateOfBirth, cohort.startDate);
      if (Number.isNaN(age)) add("about.dateOfBirth", "Enter a valid date of birth.");
      else if (age < 16 || age > 24) add("about.dateOfBirth", `The fellowship is for people aged 16–24 when the cohort starts. You would be ${age} on ${new Date(cohort.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.`);
      else if (age < 18) {
        if (!a.about.guardianName?.trim()) add("about.guardianName", "Applicants under 18 need a parent or guardian contact.");
        if (!a.about.guardianEmail?.trim()) add("about.guardianEmail", "Enter your parent or guardian's email.");
        else if (!EMAIL_RE.test(a.about.guardianEmail)) add("about.guardianEmail", "Enter a valid email for your parent or guardian.");
      }
    }
  }

  if (section === "idea") {
    if (!a.idea.ventureName?.trim()) add("idea.ventureName", "Give your idea a working name — it can change later.");
    const pw = wordCount(a.idea.problem);
    if (!pw) add("idea.problem", "Describe the problem you want to solve.");
    else if (pw < MIN_PROBLEM_WORDS) add("idea.problem", `Tell us a little more — at least ${MIN_PROBLEM_WORDS} words (you have ${pw}).`);
    else if (pw > WORD_LIMITS.problem) add("idea.problem", `Keep it under ${WORD_LIMITS.problem} words (you have ${pw}).`);
    if (!a.idea.customer?.trim()) add("idea.customer", "Tell us who has this problem.");
    else if (wordCount(a.idea.customer) > WORD_LIMITS.customer) add("idea.customer", `Keep it under ${WORD_LIMITS.customer} words.`);
    if (!a.idea.stage) add("idea.stage", "Choose how far along the idea is.");
    if (!a.idea.trackPreference) add("idea.trackPreference", "Choose the track that fits you best.");
    if (!a.idea.whyNow?.trim()) add("idea.whyNow", "Tell us why now is the right time.");
    else if (wordCount(a.idea.whyNow) > WORD_LIMITS.whyNow) add("idea.whyNow", `Keep it under ${WORD_LIMITS.whyNow} words.`);
  }

  if (section === "residence") {
    const r = a.residence;
    if (!r.address?.trim()) add("residence.address", "Enter your home address.");
    else if (!r.check || r.check.status === "unchecked") add("residence.address", "Run the location check for this address.");
    else if (r.check.status === "ambiguous") add("residence.address", "Choose which address is yours.");
    else if (r.check.status === "not_found") add("residence.address", "We couldn't match this address. Check it and try again.");
    if (!r.proofDocumentId || db.documents[r.proofDocumentId]?.removedAt) add("residence.proof", "Upload a proof of residence document, or use a sample document for this demo.");
  }

  if (section === "questions") {
    const qs = visibleQuestions(questionsForApplication(db, app), a.custom);
    for (const q of qs) {
      const v = a.custom[q.id];
      const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      if (q.required && empty) {
        add(`custom.${q.id}`, q.kind === "multi" ? "Choose at least one option." : q.kind === "file" ? "Attach a file." : "Answer this question.");
        continue;
      }
      if (typeof v === "string" && q.wordLimit && wordCount(v) > q.wordLimit) add(`custom.${q.id}`, `Keep it under ${q.wordLimit} words (you have ${wordCount(v)}).`);
      if (Array.isArray(v) && q.maxChoices && v.length > q.maxChoices) add(`custom.${q.id}`, `Choose up to ${q.maxChoices} options.`);
    }
    if (!a.commitment?.hoursPerWeek) add("commitment.hoursPerWeek", "Tell us how many hours a week you can give.");
    if (!a.commitment?.availability?.length) add("commitment.availability", "Choose at least one time you're usually free.");
    if (!a.commitment?.agreeToCommunityStandards) add("commitment.agreeToCommunityStandards", "Please confirm you'll follow the community standards.");
  }

  return issues;
}

export function validateApplication(db: Database, app: Application): Issue[] {
  return (["about", "idea", "residence", "questions"] as ApplicationSection[]).flatMap((s) => validateSection(db, app, s));
}

export function sectionComplete(db: Database, app: Application, section: ApplicationSection) {
  return validateSection(db, app, section).length === 0;
}

/** Map change-request field keys to wizard sections. */
export function sectionOfField(field: string): ApplicationSection {
  const head = field.split(".")[0];
  if (head === "about") return "about";
  if (head === "idea") return "idea";
  if (head === "residence") return "residence";
  return "questions";
}

export const CHANGEABLE_FIELDS: { key: string; label: string }[] = [
  { key: "about.dateOfBirth", label: "Date of birth" },
  { key: "about.guardianEmail", label: "Guardian contact" },
  { key: "idea.problem", label: "Problem description" },
  { key: "idea.customer", label: "Who has the problem" },
  { key: "idea.whyNow", label: "Why now" },
  { key: "residence.address", label: "Home address" },
  { key: "residence.proof", label: "Proof of residence document" },
  { key: "commitment.availability", label: "Availability" },
];
