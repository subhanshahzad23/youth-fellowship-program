import type {
  Application,
  ApplicationAnswers,
  ApplicationForm,
  ApplicationStatus,
  DocumentRecord,
  FormQuestion,
  FormVersion,
  Review,
  ReviewerAssignment,
  RubricCriterion,
  TimelineEntry,
} from "@/lib/domain/types";
import { ago } from "@/lib/clock";
import { checkAddress } from "@/lib/sim/residence";

/* ------------------------------------------------------------------ */
/* Rubric                                                              */
/* ------------------------------------------------------------------ */

export const RUBRIC: RubricCriterion[] = [
  {
    id: "rc_motivation",
    label: "Motivation",
    description: "Why this applicant, why now — and evidence they follow through.",
    weight: 25,
    anchors: ["No clear reason given", "Generic interest", "Personal reason stated", "Personal reason with evidence of action", "Compelling story and a track record of starting things"],
  },
  {
    id: "rc_idea",
    label: "Venture idea",
    description: "A real problem, a specific customer and early signs of insight.",
    weight: 30,
    anchors: ["No identifiable problem", "Problem is vague", "Clear problem, broad customer", "Clear problem and specific customer", "Sharp insight grounded in conversations or experience"],
  },
  {
    id: "rc_commitment",
    label: "Learning commitment",
    description: "Realistic availability and openness to feedback over 18 months.",
    weight: 25,
    anchors: ["Cannot commit", "Unclear availability", "Can attend most sessions", "Consistent availability and a plan", "Clear plan with support around them"],
  },
  {
    id: "rc_impact",
    label: "Community impact",
    description: "Who benefits beyond the founder, and how they would know.",
    weight: 20,
    anchors: ["Not considered", "Mentioned in passing", "Some benefit described", "Specific community benefit", "Specific benefit with a way to measure it"],
  },
];

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

const winterQuestions: FormQuestion[] = [
  {
    id: "q_w_started",
    kind: "long",
    label: "Tell us about a time you started something on your own.",
    help: "A club, a side hustle, a fundraiser, a project at school — anything counts.",
    required: true,
    wordLimit: 150,
  },
  { id: "q_w_team", kind: "yesno", label: "Have you worked on your idea with anyone else?", required: true, options: ["Yes", "No"] },
  {
    id: "q_w_team_who",
    kind: "long",
    label: "Who are they, and what do they bring?",
    required: true,
    wordLimit: 100,
    showIf: { questionId: "q_w_team", equals: "Yes" },
  },
  {
    id: "q_w_support",
    kind: "multi",
    label: "Which kinds of support would help you most?",
    help: "Choose up to three.",
    required: true,
    maxChoices: 3,
    options: ["Finding customers", "Money and pricing", "Building a prototype", "Confidence speaking", "Working in a team", "Staying organized"],
  },
  { id: "q_w_file", kind: "file", label: "Optional: share a sketch, photo or document of your idea", required: false },
];

const springQuestions: FormQuestion[] = [
  {
    id: "q_s_problem",
    kind: "long",
    label: "What problem in your neighborhood do you notice every week?",
    required: true,
    wordLimit: 120,
  },
  {
    id: "q_s_heard",
    kind: "select",
    label: "How did you hear about Launchpad?",
    required: true,
    options: ["School or college", "A friend", "Social media", "Community center or library", "Another fellow", "Other"],
  },
  { id: "q_s_kickoff", kind: "yesno", label: "Can you attend the kickoff weekend on April 3–4, 2027?", required: true, options: ["Yes", "No"] },
  {
    id: "q_s_kickoff_help",
    kind: "long",
    label: "What would make attending possible for you?",
    help: "Travel, care responsibilities, work shifts — tell us and we will try to help.",
    required: true,
    wordLimit: 80,
    showIf: { questionId: "q_s_kickoff", equals: "No" },
  },
  { id: "q_s_portfolio", kind: "short", label: "Anywhere we can see your work? (optional)", help: "A link, a handle, or leave blank.", required: false },
];

const legacyQuestions: FormQuestion[] = [
  { id: "q_l_started", kind: "long", label: "Tell us about something you have started.", required: true, wordLimit: 150 },
  { id: "q_l_support", kind: "multi", label: "What support would help most?", required: true, options: ["Finding customers", "Money and pricing", "Building a prototype", "Confidence speaking"] },
];

export const FORMS: ApplicationForm[] = [
  {
    id: "f_spring26",
    cohortId: "c_spring26",
    title: "Spring 2026 application",
    intro: "Applications for Spring 2026 are closed.",
    opensAt: "2025-11-03T09:00:00.000Z",
    closesAt: "2026-01-09T23:59:00.000Z",
    status: "published",
    publishedVersionId: "fv_spring26_1",
    createdAt: ago(400),
    updatedAt: ago(380),
  },
  {
    id: "f_summer26",
    cohortId: "c_summer26",
    title: "Summer 2026 application",
    intro: "Applications for Summer 2026 are closed.",
    opensAt: "2026-03-16T09:00:00.000Z",
    closesAt: "2026-05-15T23:59:00.000Z",
    status: "published",
    publishedVersionId: "fv_summer26_1",
    createdAt: ago(240),
    updatedAt: ago(230),
  },
  {
    id: "f_winter27",
    cohortId: "c_winter27",
    title: "Winter 2027 application",
    intro: "Tell us about you and the idea you can't stop thinking about. It takes about 25 minutes and saves as you go.",
    opensAt: "2026-09-14T09:00:00.000Z",
    closesAt: "2026-11-15T23:59:00.000Z",
    status: "published",
    publishedVersionId: "fv_winter27_1",
    createdAt: ago(70),
    updatedAt: ago(46),
  },
  {
    id: "f_spring27",
    cohortId: "c_spring27",
    title: "Spring 2027 early application",
    intro: "An early window for a spring start. Short questions, quick decisions — we reply within four weeks.",
    opensAt: "2026-10-19T09:00:00.000Z",
    closesAt: "2026-12-18T23:59:00.000Z",
    status: "published",
    publishedVersionId: "fv_spring27_1",
    createdAt: ago(20),
    updatedAt: ago(11),
  },
  {
    id: "f_summer27",
    cohortId: "c_summer27",
    title: "Summer 2027 application",
    intro: "Applications open on February 1, 2027.",
    opensAt: "2027-02-01T09:00:00.000Z",
    closesAt: "2027-04-02T23:59:00.000Z",
    status: "published",
    publishedVersionId: "fv_summer27_1",
    createdAt: ago(12),
    updatedAt: ago(12),
  },
];

export const FORM_VERSIONS: FormVersion[] = [
  { id: "fv_spring26_1", formId: "f_spring26", version: 1, questions: legacyQuestions, publishedAt: ago(380), publishedById: "u_marcus" },
  { id: "fv_summer26_1", formId: "f_summer26", version: 1, questions: legacyQuestions, publishedAt: ago(230), publishedById: "u_amira" },
  { id: "fv_winter27_1", formId: "f_winter27", version: 1, questions: winterQuestions, publishedAt: ago(46), publishedById: "u_amira" },
  { id: "fv_spring27_1", formId: "f_spring27", version: 1, questions: springQuestions, publishedAt: ago(11), publishedById: "u_marcus" },
  { id: "fv_summer27_1", formId: "f_summer27", version: 1, questions: winterQuestions, publishedAt: ago(12), publishedById: "u_priya" },
];

/* ------------------------------------------------------------------ */
/* Sample proof-of-residence files (watermarked, fictional)            */
/* ------------------------------------------------------------------ */

export const SAMPLE_PROOFS = [
  { key: "utility", name: "sample-utility-bill.pdf", title: "Utility bill (sample)", url: "/samples/proof-of-residence-utility-bill.pdf", mime: "application/pdf", size: 2094 },
  { key: "tenancy", name: "sample-tenancy-letter.pdf", title: "Tenancy letter (sample)", url: "/samples/proof-of-residence-tenancy-letter.pdf", mime: "application/pdf", size: 1734 },
  { key: "school", name: "sample-school-letter.png", title: "School enrollment letter (sample)", url: "/samples/proof-of-residence-school-letter.png", mime: "image/png", size: 68199 },
] as const;

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

interface AppSeed {
  id: string;
  applicantId: string;
  cohortId: string;
  status: ApplicationStatus;
  ref?: string;
  createdDaysAgo: number;
  submittedDaysAgo?: number;
  address: string;
  proof?: (typeof SAMPLE_PROOFS)[number]["key"];
  about: ApplicationAnswers["about"];
  idea: ApplicationAnswers["idea"];
  custom: ApplicationAnswers["custom"];
  hours?: string;
  reviewers?: string[];
  section?: Application["currentSection"];
  decisionNote?: string;
}

const W = "c_winter27";

const APP_SEEDS: AppSeed[] = [
  {
    id: "a_maya_w27",
    applicantId: "u_maya",
    cohortId: W,
    status: "draft",
    createdDaysAgo: 6,
    address: "14 alder row, eastbank 00212",
    section: "residence",
    about: { fullName: "Maya Chen", preferredName: "Maya", email: "maya.chen@example.org", dateOfBirth: "2008-06-21", pronouns: "she/her", school: "Eastbank High School" },
    idea: {
      ventureName: "Second Shelf",
      problem:
        "Every September my friends spend hundreds on textbooks they use for one year, while last year's copies sit in cupboards. The school library can't keep up and the online resale sites are slow, full of fees, and nobody trusts the condition descriptions.",
      customer: "High school students in Eastbank and Millbrook and the parents who pay for their books.",
      stage: "Testing",
      trackPreference: "t_ff",
      whyNow: "I ran a small swap table in the common room last June and moved 43 books in two lunchtimes. I want to learn how to make it a real service.",
    },
    custom: {},
  },
  {
    id: "a_jonah_w27",
    applicantId: "u_jonah",
    cohortId: W,
    status: "submitted",
    ref: "LP-W27-0151",
    createdDaysAgo: 12,
    submittedDaysAgo: 1.2,
    address: "3 Weaver Ct, Millbrook, Larkhaven 00213",
    proof: "tenancy",
    reviewers: ["u_amira"],
    about: { fullName: "Jonah Reyes", preferredName: "Jonah", email: "jonah.reyes@example.org", dateOfBirth: "2007-11-02", pronouns: "he/him", school: "Millbrook Academy" },
    idea: {
      ventureName: "ClearPath",
      problem: "Campus maps ignore step-free routes, so wheelchair users and people with prams find out a route is blocked only when they get there.",
      customer: "Students and visitors with mobility needs at the two Larkhaven college campuses.",
      stage: "Idea",
      trackPreference: "t_vb",
      whyNow: "My brother uses a wheelchair and starts college next year. I mapped one campus with him last month.",
    },
    custom: {
      q_w_started: "I organized a charity three-on-three basketball tournament that raised money for the local wheelchair basketball club and got 12 teams to sign up.",
      q_w_team: "No",
      q_w_support: ["Building a prototype", "Finding customers"],
    },
  },
  {
    id: "a_sara_w27",
    applicantId: "u_sara",
    cohortId: W,
    status: "in_review",
    ref: "LP-W27-0144",
    createdDaysAgo: 30,
    submittedDaysAgo: 9,
    address: "22 Lantern Walk, Old Quay, Larkhaven 00211",
    proof: "utility",
    reviewers: ["u_amira", "u_jordan"],
    about: { fullName: "Sara Lindqvist", preferredName: "Sara", email: "sara.lindqvist@example.org", dateOfBirth: "2006-04-18", pronouns: "she/her", school: "Old Quay College" },
    idea: {
      ventureName: "Harvest Hands",
      problem: "Small farms outside town can't find weekend help at harvest time, and teenagers who want paid outdoor work don't know the farms exist.",
      customer: "Family-run farms within 20 km of Larkhaven and 16–19 year olds looking for weekend work.",
      stage: "Testing",
      trackPreference: "t_vb",
      whyNow: "I placed six friends on two farms this summer through a group chat. Both farms asked to do it again.",
    },
    custom: {
      q_w_started: "I started a group chat that turned into a small jobs board for weekend farm work. Six placements, two repeat farms.",
      q_w_team: "Yes",
      q_w_team_who: "My friend Oskar handles the farm calls; he grew up on one of them.",
      q_w_support: ["Money and pricing", "Staying organized"],
    },
  },
  {
    id: "a_theo_w27",
    applicantId: "u_theo",
    cohortId: W,
    status: "in_review",
    ref: "LP-W27-0139",
    createdDaysAgo: 34,
    submittedDaysAgo: 14,
    address: "9 Pier Row, Harborside, Larkhaven 00214",
    proof: "school",
    reviewers: ["u_amira"],
    about: { fullName: "Theo Mitchell", preferredName: "Theo", email: "theo.mitchell@example.org", dateOfBirth: "2005-09-30", pronouns: "he/him", school: "Harborside Learning Center" },
    idea: {
      ventureName: "Glow Up Resumes",
      problem: "Young people applying for their first job are rejected by software before a human reads their resume, and paid resume services are expensive.",
      customer: "16–21 year olds applying for first jobs and apprenticeships.",
      stage: "First customers",
      trackPreference: "t_li",
      whyNow: "I've rewritten 30 resumes for friends; 11 got interviews within a month.",
    },
    custom: {
      q_w_started: "Free resume clinics at the youth center on Thursday evenings, now run with two volunteers.",
      q_w_team: "Yes",
      q_w_team_who: "Two volunteers from the youth center who help with interview practice.",
      q_w_support: ["Confidence speaking", "Money and pricing", "Working in a team"],
    },
  },
  {
    id: "a_fatima_w27",
    applicantId: "u_fatima",
    cohortId: W,
    status: "changes_requested",
    ref: "LP-W27-0133",
    createdDaysAgo: 40,
    submittedDaysAgo: 18,
    address: "31 Canal Terrace, Eastbank, Larkhaven 00212",
    proof: "utility",
    reviewers: ["u_amira"],
    about: { fullName: "Fatima Noor", preferredName: "Fatima", email: "fatima.noor@example.org", dateOfBirth: "2007-01-12", pronouns: "she/her", school: "Eastbank High School" },
    idea: {
      ventureName: "Threadline",
      problem: "Modest activewear is hard to find in the sizes and styles my friends want.",
      customer: "Young women.",
      stage: "Idea",
      trackPreference: "t_ff",
      whyNow: "I sew most of my own sportswear already.",
    },
    custom: {
      q_w_started: "I run a small alterations service for friends and family and sold 20 hand-made scarves at the winter market.",
      q_w_team: "No",
      q_w_support: ["Finding customers", "Building a prototype"],
    },
  },
  {
    id: "a_ravi_w27",
    applicantId: "u_ravi",
    cohortId: W,
    status: "waitlisted",
    ref: "LP-W27-0128",
    createdDaysAgo: 44,
    submittedDaysAgo: 25,
    address: "5 Orchard Ln, Millbrook, Larkhaven 00213",
    proof: "tenancy",
    reviewers: ["u_amira"],
    about: { fullName: "Ravi Menon", preferredName: "Ravi", email: "ravi.menon@example.org", dateOfBirth: "2008-03-03", pronouns: "he/him", school: "Millbrook Academy" },
    idea: {
      ventureName: "CodeCamp Kids",
      problem: "Elementary schools near me don't teach any coding and after-school clubs are full.",
      customer: "Parents of 8–11 year olds in Millbrook.",
      stage: "Idea",
      trackPreference: "t_vb",
      whyNow: "I help my younger cousins with Scratch every weekend.",
    },
    custom: { q_w_started: "Weekend Scratch sessions for my cousins and two of their friends.", q_w_team: "No", q_w_support: ["Finding customers", "Money and pricing"] },
    decisionNote: "Strong commitment; idea needs more customer evidence. Waitlisted — first in line if a place opens.",
  },
  {
    id: "a_isabella_w27",
    applicantId: "u_isabella",
    cohortId: W,
    status: "approved",
    ref: "LP-W27-0121",
    createdDaysAgo: 46,
    submittedDaysAgo: 30,
    address: "18 Bell St, Old Quay, Larkhaven 00211",
    proof: "utility",
    reviewers: ["u_amira"],
    about: { fullName: "Isabella Moreno", preferredName: "Isa", email: "isabella.moreno@example.org", dateOfBirth: "2006-12-08", pronouns: "she/her", school: "Old Quay College" },
    idea: {
      ventureName: "Panadería Pop-Up",
      problem: "There's nowhere in Old Quay to buy the pan dulce my family grew up with, and my neighbors keep asking my mom to bake for them.",
      customer: "Latin American families and anyone near the Saturday market.",
      stage: "First customers",
      trackPreference: "t_vb",
      whyNow: "We sold out four Saturdays in a row at a borrowed stall.",
    },
    custom: { q_w_started: "Saturday bake sales with my mom — four sell-outs.", q_w_team: "Yes", q_w_team_who: "My mom bakes; I run the stall and the orders.", q_w_support: ["Money and pricing", "Staying organized"] },
    decisionNote: "Clear evidence of demand. Welcome to Winter 2027.",
  },
  {
    id: "a_kofi_w27",
    applicantId: "u_kofi",
    cohortId: W,
    status: "approved",
    ref: "LP-W27-0118",
    createdDaysAgo: 48,
    submittedDaysAgo: 33,
    address: "40 Quay St, Harborside, Larkhaven 00214",
    proof: "school",
    reviewers: ["u_amira"],
    about: { fullName: "Kofi Asante", preferredName: "Kofi", email: "kofi.asante@example.org", dateOfBirth: "2005-07-19", pronouns: "he/him", school: "Harborside Learning Center" },
    idea: {
      ventureName: "BeatBox Studio",
      problem: "Young artists pay $40 an hour for studio time or record in bedrooms with terrible sound.",
      customer: "Young musicians and podcasters in Harborside.",
      stage: "Prototype",
      trackPreference: "t_li",
      whyNow: "I built a sound booth in my uncle's garage; 15 artists have used it.",
    },
    custom: { q_w_started: "A garage sound booth with a booking spreadsheet — 15 artists so far.", q_w_team: "No", q_w_support: ["Money and pricing", "Working in a team"] },
    decisionNote: "Great early traction. Welcome to Winter 2027.",
  },
  {
    id: "a_ella_w27",
    applicantId: "u_ella",
    cohortId: W,
    status: "rejected",
    ref: "LP-W27-0112",
    createdDaysAgo: 50,
    submittedDaysAgo: 36,
    address: "220 Quarry Ln, Westmoor 00391",
    proof: "tenancy",
    reviewers: ["u_amira"],
    about: { fullName: "Ella Brennan", preferredName: "Ella", email: "ella.brennan@example.org", dateOfBirth: "2007-05-27", pronouns: "she/her", school: "Westmoor High" },
    idea: {
      ventureName: "Paws & Pages",
      problem: "Children who are nervous readers could read aloud to calm, trained dogs.",
      customer: "Elementary schools.",
      stage: "Idea",
      trackPreference: "t_li",
      whyNow: "My dog is a certified therapy dog.",
    },
    custom: { q_w_started: "Volunteering with my dog at the local care home.", q_w_team: "No", q_w_support: ["Finding customers"] },
    decisionNote: "Address is outside the Greater Larkhaven service area. We shared details of the Westmoor youth enterprise program (fictional).",
  },
  {
    id: "a_arjun_w27",
    applicantId: "u_arjun",
    cohortId: W,
    status: "submitted",
    ref: "LP-W27-0152",
    createdDaysAgo: 8,
    submittedDaysAgo: 0.6,
    address: "7 Mill St, Larkhaven",
    proof: "tenancy",
    reviewers: [],
    about: { fullName: "Arjun Kapoor", preferredName: "Arjun", email: "arjun.kapoor@example.org", dateOfBirth: "2008-08-15", pronouns: "he/him", school: "Kingsford Prep" },
    idea: {
      ventureName: "SnackSwap",
      problem: "Vending machines at youth clubs only sell sugary snacks because nobody has offered the clubs a better deal.",
      customer: "Youth club managers, and the teenagers who use the clubs after school.",
      stage: "Idea",
      trackPreference: "t_vb",
      whyNow: "My youth club manager said she'd switch tomorrow if someone handled restocking.",
    },
    custom: { q_w_started: "I restock the snack bar at my youth club and keep its accounts.", q_w_team: "No", q_w_support: ["Money and pricing", "Finding customers", "Staying organized"] },
  },
  {
    id: "a_yusuf_s27",
    applicantId: "u_yusuf",
    cohortId: "c_spring27",
    status: "submitted",
    ref: "LP-S27-0007",
    createdDaysAgo: 9,
    submittedDaysAgo: 3,
    address: "12 Foundry Ln, Millbrook, Larkhaven 00213",
    proof: "utility",
    reviewers: ["u_marcus"],
    about: { fullName: "Yusuf Demir", preferredName: "Yusuf", email: "yusuf.demir@example.org", dateOfBirth: "2006-10-10", pronouns: "he/him", school: "Millbrook Academy" },
    idea: {
      ventureName: "Mend Lab",
      problem: "Cracked phone screens and dead laptop batteries get thrown away because repairs are expensive and slow.",
      customer: "Students and families in Millbrook.",
      stage: "Testing",
      trackPreference: "t_ff",
      whyNow: "I've repaired 22 phones for classmates from my bedroom desk.",
    },
    custom: { q_s_problem: "Broken electronics piling up in drawers because repairs cost more than a new device.", q_s_heard: "A friend", q_s_kickoff: "Yes" },
  },
  {
    id: "a_maddie_s27",
    applicantId: "u_maddie",
    cohortId: "c_spring27",
    status: "draft",
    createdDaysAgo: 2,
    address: "",
    section: "idea",
    about: { fullName: "Maddie Owens", preferredName: "Maddie", email: "maddie.owens@example.org", dateOfBirth: "2008-01-30", pronouns: "she/her" },
    idea: { ventureName: "Rooftop Radishes" },
    custom: {},
  },
  {
    id: "a_noah_s26",
    applicantId: "u_noah",
    cohortId: "c_summer26",
    status: "approved",
    ref: "LP-S26-0064",
    createdDaysAgo: 200,
    submittedDaysAgo: 175,
    address: "61 Rope Walk, Eastbank, Larkhaven 00212",
    proof: "tenancy",
    reviewers: ["u_amira"],
    about: { fullName: "Noah Williams", preferredName: "Noah", email: "noah.williams@example.org", dateOfBirth: "2006-02-11", pronouns: "he/him", school: "Eastbank High School" },
    idea: {
      ventureName: "Porchlight Repair",
      problem: "Renters on my street throw away lamps, kettles and bikes that need a five-minute fix, because nobody has the tools.",
      customer: "Renters and older neighbors in Eastbank.",
      stage: "Idea",
      trackPreference: "t_ff",
      whyNow: "I fixed nine things for neighbors last spring from my porch.",
    },
    custom: { q_l_started: "Fixing things for neighbors from my porch — nine repairs in one spring.", q_l_support: ["Finding customers", "Confidence speaking"] },
    decisionNote: "Welcome to Summer 2026.",
  },
];

const FORM_FOR_COHORT: Record<string, { formId: string; versionId: string }> = {
  c_spring26: { formId: "f_spring26", versionId: "fv_spring26_1" },
  c_summer26: { formId: "f_summer26", versionId: "fv_summer26_1" },
  c_winter27: { formId: "f_winter27", versionId: "fv_winter27_1" },
  c_spring27: { formId: "f_spring27", versionId: "fv_spring27_1" },
  c_summer27: { formId: "f_summer27", versionId: "fv_summer27_1" },
};

function timelineFor(s: AppSeed): TimelineEntry[] {
  const t: TimelineEntry[] = [];
  const created = ago(s.createdDaysAgo);
  t.push({ id: `${s.id}_t1`, at: created, status: "draft", label: "Application started", visibility: "applicant", actorId: s.applicantId });
  if (s.submittedDaysAgo === undefined) return t;
  const sub = ago(s.submittedDaysAgo);
  t.push({ id: `${s.id}_t2`, at: sub, status: "submitted", label: "Application submitted", visibility: "applicant", actorId: s.applicantId });
  if (s.reviewers?.length)
    t.push({
      id: `${s.id}_t3`,
      at: ago(Math.max(0.3, s.submittedDaysAgo - 0.2)),
      status: "submitted",
      label: `Reviewer assigned`,
      visibility: "internal",
      actorId: s.cohortId === "c_spring27" ? "u_marcus" : "u_amira",
    });
  if (["in_review", "changes_requested", "waitlisted", "approved", "rejected"].includes(s.status))
    t.push({ id: `${s.id}_t4`, at: ago(s.submittedDaysAgo - 1), status: "in_review", label: "Review started", visibility: "applicant" });
  const decisionAt = ago(Math.max(0.5, s.submittedDaysAgo - 6));
  if (s.status === "changes_requested")
    t.push({ id: `${s.id}_t5`, at: decisionAt, status: "changes_requested", label: "Changes requested", visibility: "applicant", actorId: "u_amira" });
  if (s.status === "waitlisted")
    t.push({ id: `${s.id}_t5`, at: decisionAt, status: "waitlisted", label: "Placed on the waitlist", visibility: "applicant", actorId: "u_amira", note: s.decisionNote });
  if (s.status === "approved")
    t.push({ id: `${s.id}_t5`, at: decisionAt, status: "approved", label: "Approved — welcome to the fellowship", visibility: "applicant", actorId: "u_amira", note: s.decisionNote });
  if (s.status === "rejected")
    t.push({ id: `${s.id}_t5`, at: decisionAt, status: "rejected", label: "Application not successful", visibility: "applicant", actorId: "u_amira", note: s.decisionNote });
  return t;
}

export function decisionDate(s: { submittedDaysAgo?: number }) {
  return ago(Math.max(0.5, (s.submittedDaysAgo ?? 0) - 6));
}

export interface BuiltApplications {
  applications: Application[];
  documents: DocumentRecord[];
  reviewerAssignments: ReviewerAssignment[];
  reviews: Review[];
  approvedSeeds: { applicationId: string; applicantId: string; cohortId: string; trackId: string; decidedAt: string }[];
}

export function buildApplications(): BuiltApplications {
  const applications: Application[] = [];
  const documents: DocumentRecord[] = [];
  const reviewerAssignments: ReviewerAssignment[] = [];
  const approvedSeeds: BuiltApplications["approvedSeeds"] = [];

  for (const s of APP_SEEDS) {
    const { formId, versionId } = FORM_FOR_COHORT[s.cohortId];
    const docIds: string[] = [];
    let proofDocumentId: string | undefined;
    if (s.proof) {
      const sample = SAMPLE_PROOFS.find((p) => p.key === s.proof)!;
      proofDocumentId = `d_${s.id}_proof`;
      docIds.push(proofDocumentId);
      documents.push({
        id: proofDocumentId,
        ownerId: s.applicantId,
        kind: "proof_of_residence",
        applicationId: s.id,
        name: sample.name,
        mime: sample.mime,
        size: sample.size,
        source: "sample",
        sampleUrl: sample.url,
        uploadedAt: ago(s.submittedDaysAgo !== undefined ? s.submittedDaysAgo + 0.1 : s.createdDaysAgo),
        restricted: true,
      });
    }
    const check =
      s.submittedDaysAgo !== undefined && s.address
        ? { ...checkAddress(s.address), checkedAt: ago(s.submittedDaysAgo + 0.2) }
        : undefined;

    const submittedAt = s.submittedDaysAgo !== undefined ? ago(s.submittedDaysAgo) : undefined;
    const app: Application = {
      id: s.id,
      reference: s.ref,
      applicantId: s.applicantId,
      cohortId: s.cohortId,
      formId,
      formVersionId: versionId,
      status: s.status,
      answers: {
        about: s.about,
        idea: s.idea,
        residence: { address: s.address || undefined, check, proofDocumentId, proofType: s.proof ? SAMPLE_PROOFS.find((p) => p.key === s.proof)!.title.replace(" (sample)", "") : undefined },
        custom: s.custom,
        commitment:
          s.status === "draft"
            ? undefined
            : { hoursPerWeek: s.hours ?? "6–8 hours", availability: ["Tuesday evenings", "Saturday mornings"], agreeToCommunityStandards: true },
      },
      documentIds: docIds,
      createdAt: ago(s.createdDaysAgo),
      updatedAt: submittedAt ?? ago(s.createdDaysAgo - 1 > 0 ? s.createdDaysAgo - 1 : 0.2),
      lastSavedAt: submittedAt ?? ago(s.id === "a_maya_w27" ? 1.1 : 1.5),
      submittedAt,
      currentSection: s.section ?? "review",
      changeRequests:
        s.status === "changes_requested"
          ? [
              {
                id: `cr_${s.id}_1`,
                requestedById: "u_amira",
                requestedAt: decisionDate(s),
                note: "Thanks Fatima — the idea is promising. Two things before we can score it: the utility bill you uploaded is cropped so the address isn't visible, and please tell us more specifically who your first customers would be (age, where they train, what they wear now).",
                fields: ["residence.proof", "idea.customer"],
              },
            ]
          : [],
      timeline: timelineFor(s),
      decision:
        s.status === "approved" || s.status === "waitlisted" || s.status === "rejected"
          ? { outcome: s.status, decidedById: "u_amira", decidedAt: decisionDate(s), note: s.decisionNote }
          : undefined,
      resubmissions: 0,
    };
    applications.push(app);

    s.reviewers?.forEach((reviewerId, i) =>
      reviewerAssignments.push({
        id: `ra_${s.id}_${i + 1}`,
        applicationId: s.id,
        reviewerId,
        assignedById: s.cohortId === "c_spring27" ? "u_marcus" : "u_amira",
        assignedAt: ago(Math.max(0.3, (s.submittedDaysAgo ?? 1) - 0.2)),
      }),
    );

    if (s.status === "approved")
      approvedSeeds.push({ applicationId: s.id, applicantId: s.applicantId, cohortId: s.cohortId, trackId: s.idea.trackPreference ?? "t_ff", decidedAt: decisionDate(s) });
  }

  const review = (
    id: string,
    applicationId: string,
    reviewerId: string,
    scores: (number | undefined)[],
    recommendation: Review["recommendation"],
    notes: string,
    status: Review["status"],
    daysAgo: number,
  ): Review => ({
    id,
    applicationId,
    reviewerId,
    scores: Object.fromEntries(RUBRIC.map((c, i) => [c.id, scores[i]])),
    recommendation,
    notes,
    status,
    updatedAt: ago(daysAgo),
    submittedAt: status === "submitted" ? ago(daysAgo) : undefined,
  });

  const reviews: Review[] = [
    review("rv_sara_amira", "a_sara_w27", "u_amira", [4, 4, undefined, undefined], undefined, "Strong evidence from the summer placements. Need to check weekend availability against her college timetable.", "draft", 2),
    review("rv_sara_jordan", "a_sara_w27", "u_jordan", [4, 4, 3, 4], "approve", "Real demand from farms, and she already solved the trust problem with repeat placements.", "submitted", 4),
    review("rv_theo_amira", "a_theo_w27", "u_amira", [5, 4, 4, 3], "approve", "Thirty resumes and eleven interviews is excellent evidence. Community impact is clear.", "submitted", 6),
    review("rv_fatima_amira", "a_fatima_w27", "u_amira", [4, 2, 4, 3], "changes", "Promising maker. Customer definition is too broad; proof of residence is cropped.", "submitted", 12),
    review("rv_ravi_amira", "a_ravi_w27", "u_amira", [3, 3, 4, 3], "waitlist", "Good commitment but no customer conversations yet.", "submitted", 19),
    review("rv_isabella_amira", "a_isabella_w27", "u_amira", [5, 5, 4, 4], "approve", "Four sell-outs. Clear customer. Family support in place.", "submitted", 24),
    review("rv_kofi_amira", "a_kofi_w27", "u_amira", [4, 4, 5, 4], "approve", "Built a working booth with his own savings. Fifteen artists is real traction.", "submitted", 27),
    review("rv_ella_amira", "a_ella_w27", "u_amira", [4, 3, 4, 4], "reject", "Lovely idea but the address is outside our service area. Referred to the Westmoor program.", "submitted", 30),
    review("rv_noah_amira", "a_noah_s26", "u_amira", [4, 4, 5, 4], "approve", "Already doing the work from his porch. Great fit for Foundations.", "submitted", 170),
    review("rv_yusuf_marcus", "a_yusuf_s27", "u_marcus", [4, undefined, undefined, undefined], undefined, "", "draft", 1),
  ];

  return { applications, documents, reviewerAssignments, reviews, approvedSeeds };
}

export const APPLICATION_REF_START = 152;
