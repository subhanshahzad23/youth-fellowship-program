/**
 * Extra content for the Resources group: podcast show notes, case-study
 * approaches, sample-work previews and FAQ topics.
 *
 * - Show notes are drafts written for the demo (labelled in the UI).
 * - Case studies are illustrative, anonymized scenarios (labelled in the UI).
 * - Sample-work previews are fictional: every name and fact is a bracketed
 *   placeholder such as "[Beneficiary]". No client material is used.
 */

import { CASE_STUDIES, EPISODES, FAQS, SAMPLE_WORK, SEGMENTS, type Faq } from "./site";

/* ------------------------------------------------------------------ */
/* Podcast — "Why Immigration Law"                                     */
/* ------------------------------------------------------------------ */

export const PODCAST = {
  name: "Why Immigration Law",
  tagline: "The people behind the petitions.",
  description:
    "A Goodcase podcast about the attorneys, paralegals and case managers who make U.S. immigration practices run — and what they've learned doing the work.",
} as const;

export type ShowNotes = { topics: { time: string; title: string; body: string }[] };

export const SHOW_NOTES: Record<string, ShowNotes> = {
  "attorneys-as-seen-by-paralegals": {
    topics: [
      { time: "00:00", title: "Why a podcast about immigration law", body: "Piotr and Sabina introduce the show and the people it's for." },
      { time: "05:40", title: "The TV attorney and the real one", body: "What the job looks like from inside a practice, far from the courtroom drama." },
      { time: "16:20", title: "What paralegals notice first", body: "The habits that make a practice run smoothly — and the ones that make every deadline a scramble." },
      { time: "29:10", title: "Working well together", body: "How attorneys and paralegals split the work, and why the strategy and the signature stay with the attorney." },
    ],
  },
  "anatomy-of-an-o1-petition": {
    topics: [
      { time: "00:00", title: "From evidence dump to case theory", body: "What arrives at the start of a case, and how a drafting team makes sense of it." },
      { time: "09:30", title: "Mapping evidence to the criteria", body: "Sorting proof criterion by criterion before a word of the brief is written." },
      { time: "21:15", title: "Exhibits an officer can follow", body: "Indexing, tabbing and cross-referencing so the case reads in minutes." },
      { time: "33:40", title: "Recommendation letters with substance", body: "Why each letter needs its own voice and its own exhibits." },
    ],
  },
  "rfe-season-without-overtime": {
    topics: [
      { time: "00:00", title: "Twenty RFEs in one week", body: "What actually happens inside a firm when the notices land together." },
      { time: "08:45", title: "Triage: deadlines, complexity, owners", body: "Deciding what gets drafted first and who owns each response." },
      { time: "19:30", title: "Planning capacity before the spike", body: "Blending a core team with on-demand support ahead of busy months." },
      { time: "28:10", title: "Writing it down for next time", body: "Turning one hard week into a repeatable process." },
    ],
  },
};

export const EPISODES_BY_NUMBER = [...EPISODES].sort((a, b) => a.number - b.number);

export function getEpisode(slug: string) {
  return EPISODES.find((e) => e.slug === slug);
}

export function episodeLabel(n: number) {
  return `#${String(n).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Case studies (illustrative)                                         */
/* ------------------------------------------------------------------ */

export type CaseStudyDetail = { approach: { title: string; body: string }[]; quoteNote: string };

export const CASE_STUDY_DETAILS: Record<string, CaseStudyDetail> = {
  "solo-o1-backlog": {
    approach: [
      { title: "Learn the house style first", body: "We studied the attorney's templates, tone and citation style before drafting anything." },
      { title: "Draft in deadline order", body: "Petitions were queued by filing date, with criterion mapping agreed before each draft." },
      { title: "Review twice before handoff", body: "A second reviewer checked every citation and exhibit before a draft reached the attorney." },
      { title: "Keep the attorney in charge", body: "She kept the strategy, every client conversation, the final review and the signature." },
    ],
    quoteNote: "An approved quote from the attorney goes here.",
  },
  "growing-firm-capacity": {
    approach: [
      { title: "Onboard in a week", body: "An onboarding call and a template review set the standard in the first week." },
      { title: "Split drafting from case work", body: "Our drafting team took petition letters and exhibit indexes off the attorneys' desks." },
      { title: "Embed a case manager", body: "An experienced case manager ran intake, document collection and client follow-ups inside the firm's tools." },
      { title: "Adjust scope monthly", body: "Each month, the firm and our team lead resized the work to match volume." },
    ],
    quoteNote: "An approved quote from the managing partner goes here.",
  },
  "high-volume-cap-season": {
    approach: [
      { title: "A dedicated pod", body: "One stable team was trained on the firm's H-1B and L-1 templates." },
      { title: "One written standard", body: "Support letters and exhibit assembly followed a single documented standard across attorneys." },
      { title: "Status in Casey", body: "Deadlines and progress for every matter were reported daily through Casey." },
      { title: "Two-step quality review", body: "Every package passed two reviewers before attorney review and signature." },
    ],
    quoteNote: "An approved quote from the practice lead goes here.",
  },
};

export function getCaseStudy(slug: string) {
  return CASE_STUDIES.find((c) => c.slug === slug);
}

/** Map a case study's segment name to its who-we-serve page. */
export function segmentFor(name: string) {
  return SEGMENTS.find((s) => s.name === name);
}

/* ------------------------------------------------------------------ */
/* Sample work (fictional previews)                                    */
/* ------------------------------------------------------------------ */

export type DocPreviewData = {
  docType: string;
  title: string;
  subtitle: string;
  meta: { label: string; value: string }[];
  sections: { title: string; body: string }[];
  table: { caption: string; head: string[]; rows: string[][] };
};

export type SampleDetail = { whyItMatters: string; deliver: string[]; preview: DocPreviewData };

export const SAMPLE_DETAILS: Record<string, SampleDetail> = {
  "o1a-exhibits-format": {
    whyItMatters:
      "A clear exhibit package lets an officer confirm each criterion quickly. A disorganized one makes them hunt for the proof — and can make a strong case look weaker than it is.",
    deliver: [
      "Exhibit index mapped to each O-1A criterion",
      "Tabbed, numbered and paginated exhibits",
      "Cross-references between the index and the petition letter",
      "Missing translations or certifications flagged for your team",
      "Formatted to your firm's house style",
    ],
    preview: {
      docType: "Exhibit index",
      title: "Index of Exhibits",
      subtitle: "Form I-129, Petition for a Nonimmigrant Worker · O-1A classification",
      meta: [
        { label: "Petitioner", value: "[Petitioner Company]" },
        { label: "Beneficiary", value: "[Beneficiary]" },
        { label: "Prepared for", value: "[Law Firm] — attorney review" },
      ],
      sections: [
        { title: "Petition forms and cover letter", body: "Form I-129 with the O and P Classifications Supplement, Form G-28 and the attorney's cover letter, in filing order." },
        { title: "Evidence mapped to the criteria", body: "Each tab corresponds to one criterion at 8 C.F.R. § 214.2(o)(3)(iii). Exhibits are numbered within their tab." },
        { title: "Consultation and planned activities", body: "The written advisory opinion and an explanation of the activities [Beneficiary] will undertake in the United States." },
      ],
      table: {
        caption: "Exhibit list (excerpt)",
        head: ["Exhibit", "Description", "Criterion", "Pages"],
        rows: [
          ["A-1", "Form I-129 and O and P Classifications Supplement", "Forms", "1–24"],
          ["B-1", "[Award name], [Year] — certificate and selection criteria", "Awards", "25–31"],
          ["C-1", "Article about [Beneficiary] in [Publication]", "Published material", "32–40"],
          ["D-1", "Invitation to review for [Conference]", "Judging", "41–44"],
          ["E-1", "Expert letter from [Recommender], [Institution]", "Original contributions", "45–52"],
          ["F-1", "Offer letter and [salary survey]", "High remuneration", "53–60"],
        ],
      },
    },
  },
  "eb2-niw-business-plan": {
    whyItMatters:
      "Without a job offer, the plan is how a petition shows the endeavor is specific, credible and moving forward — a real project, not an idea on paper.",
    deliver: [
      "The proposed endeavor described in plain, specific terms",
      "Sections organized around the Matter of Dhanasar framework",
      "Market analysis and five-year financial projections",
      "Hiring plan and yearly milestones",
      "Cross-references to the petition letter and exhibits",
    ],
    preview: {
      docType: "Business plan",
      title: "Business Plan: [Company Name]",
      subtitle: "Submitted in support of Form I-140 · EB-2 National Interest Waiver",
      meta: [
        { label: "Beneficiary", value: "[Beneficiary]" },
        { label: "Endeavor", value: "[Proposed endeavor]" },
        { label: "Plan period", value: "Years 1–5" },
      ],
      sections: [
        { title: "Executive summary", body: "[Company Name] will [describe the proposed endeavor] in [field]. This plan sets out how [Beneficiary] will advance it over five years." },
        { title: "Proposed endeavor and national importance", body: "The work's substantial merit and its potential impact beyond a single employer or client." },
        { title: "Market analysis", body: "The need, the target market, existing alternatives and why [Beneficiary] is well positioned to advance the endeavor." },
        { title: "Operations, milestones and financials", body: "Hiring plan, partnerships, funding and five-year projections in [currency]." },
      ],
      table: {
        caption: "How the plan maps to the Dhanasar framework",
        head: ["Section", "Content", "Prong"],
        rows: [
          ["§1", "Executive summary", "Overview"],
          ["§2", "Proposed endeavor, merit and national importance", "Prong 1"],
          ["§3", "Market need and the beneficiary's record", "Prong 2"],
          ["§4", "Milestones, funding and projections", "Prong 2"],
          ["Brief", "Why waiving the job offer benefits the U.S.", "Prong 3"],
        ],
      },
    },
  },
  "o1a-recommendation-letter": {
    whyItMatters:
      "Officers are rarely experts in the beneficiary's field. A strong letter explains why the work matters in terms a non-specialist can check against the exhibits.",
    deliver: [
      "A draft for each recommender to review, adapt and sign",
      "Technical work explained in plain language",
      "Every claim tied to an exhibit",
      "A distinct voice for each recommender — no copy-paste letters",
    ],
    preview: {
      docType: "Recommendation letter",
      title: "Letter in Support of [Beneficiary]",
      subtitle: "O-1A petition · Form I-129",
      meta: [
        { label: "From", value: "[Recommender Name], [Title], [Institution]" },
        { label: "To", value: "U.S. Citizenship and Immigration Services" },
        { label: "Date", value: "[Date]" },
      ],
      sections: [
        { title: "My background", body: "I am [Title] at [Institution], where I have worked in [field] for [number] years. I write in support of the petition for [Beneficiary]." },
        { title: "How I know the work", body: "I know [Beneficiary]'s work through [context], rather than through a personal relationship." },
        { title: "Original contributions", body: "[Beneficiary] developed [contribution], which [organizations] now use to [result]. In plain terms, [plain-language explanation]." },
        { title: "Standing in the field", body: "In my view, [Beneficiary] is among the small percentage at the very top of [field], for the reasons set out above." },
      ],
      table: {
        caption: "Claims in this letter and where the petition proves them",
        head: ["Claim", "Criterion", "Exhibit"],
        rows: [
          ["Developed [contribution] used by [organizations]", "Original contributions", "E-1 to E-4"],
          ["Invited to review for [Journal]", "Judging", "D-2"],
          ["Led [project] at [Company]", "Critical role", "G-1"],
        ],
      },
    },
  },
  "o1-petition-brief": {
    whyItMatters:
      "Evidence doesn't argue on its own. The brief connects each exhibit to the legal standard, so the officer can follow the reasoning from criterion to conclusion.",
    deliver: [
      "Introduction and case theory",
      "The legal standard, with every citation checked by a person",
      "A criterion-by-criterion argument mapped to the exhibits",
      "A closing section on the evidence as a whole",
      "Drafted in your template and citation style",
    ],
    preview: {
      docType: "Legal brief",
      title: "Petition Brief in Support of Form I-129",
      subtitle: "O-1A classification · [Beneficiary]",
      meta: [
        { label: "Petitioner", value: "[Petitioner Company]" },
        { label: "Beneficiary", value: "[Beneficiary]" },
        { label: "Counsel", value: "[Attorney Name], [Law Firm]" },
      ],
      sections: [
        { title: "Introduction", body: "[Petitioner Company] seeks to classify [Beneficiary] as an individual of extraordinary ability in [field]." },
        { title: "Legal standard", body: "Extraordinary ability means a level of expertise indicating that the person is one of the small percentage who have risen to the very top of the field. 8 C.F.R. § 214.2(o)(3)(ii)." },
        { title: "The evidentiary criteria", body: "The evidence below satisfies [number] of the criteria at 8 C.F.R. § 214.2(o)(3)(iii)(B)." },
        { title: "The evidence as a whole", body: "Considered together, the record shows sustained acclaim and recognition for [Beneficiary]'s achievements in [field]." },
      ],
      table: {
        caption: "Summary of evidence",
        head: ["Criterion", "Evidence", "Exhibits"],
        rows: [
          ["Awards", "[Award name], [Year]", "B-1 to B-3"],
          ["Published material", "Coverage in [Publication]", "C-1 to C-4"],
          ["Original contributions", "[Contribution] adopted by [organizations]", "E-1 to E-6"],
          ["High remuneration", "Salary above [benchmark]", "F-1 to F-2"],
        ],
      },
    },
  },
};

export function getSample(slug: string) {
  return SAMPLE_WORK.find((s) => s.slug === slug);
}

/* ------------------------------------------------------------------ */
/* FAQ topics                                                          */
/* ------------------------------------------------------------------ */

export const FAQ_TOPICS: { topic: Faq["topic"]; id: string; blurb: string }[] = [
  { topic: "Goodcase", id: "goodcase", blurb: "Who we are, and who we are not." },
  { topic: "Services", id: "services", blurb: "What we draft and how we work." },
  { topic: "Pricing", id: "pricing", blurb: "Flat fees, shown openly." },
  { topic: "Security", id: "security", blurb: "How client information stays protected." },
  { topic: "Working together", id: "working-together", blurb: "Getting started and staying in control." },
];

export function faqsFor(topic: Faq["topic"]) {
  return FAQS.filter((f) => f.topic === topic);
}
