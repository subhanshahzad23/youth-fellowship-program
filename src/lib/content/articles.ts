/**
 * Blog article bodies for the Resources group.
 *
 * The live goodcase.io blog gave us titles and excerpts only (see POSTS in
 * site.ts and docs/source/goodcase-live/blog.txt). One article is written in
 * full for the demo, using only the facts in its published excerpt. Every
 * other article shows an outline and a "migrates from the current site" label
 * until the real body is moved across.
 */

import { POSTS, TEAM, type Post } from "./site";
import { sortBy } from "@/lib/utils";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; caption: string; head: string[]; rows: string[][]; note?: string }
  | { type: "callout"; title: string; text: string };

export type ArticleSection = { id: string; title: string; blocks: ArticleBlock[] };

export type ArticleBody =
  | {
      kind: "full";
      sections: ArticleSection[];
      /** Show the ROI calculator at the end of the article. */
      calculator?: boolean;
      /** A headline figure taken from the published excerpt, used on the featured card. */
      keyFigure?: { value: string; label: string };
    }
  | { kind: "outline"; outline: { id: string; title: string; summary: string }[] };

export const ARTICLES: Record<string, ArticleBody> = {
  "paralegal-outsourcing-cost-vs-in-house": {
    kind: "full",
    calculator: true,
    keyFigure: { value: "$1,920", label: "gap per O-1 case between a senior in-house paralegal in New York and a specialized provider" },
    sections: [
      {
        id: "short-answer",
        title: "The short answer",
        blocks: [
          { type: "p", text: "A senior in-house paralegal in New York costs a firm about **$2,920 per O-1 case**. Outsourcing the same case to a specialized immigration paralegal provider costs about **$1,000**. The gap is roughly **$1,920 per case**." },
          { type: "p", text: "That number grows quickly. At five O-1 petitions a month, $1,920 a case adds up to about **$115,200 a year** — before you count the attorney hours that a well-prepared draft gives back." },
          { type: "p", text: "None of this means in-house staff are overpaid. The gap comes from everything a salaried employee costs on top of the salary, and from the months when the work is lighter than the payroll." },
        ],
      },
      {
        id: "in-house-cost",
        title: "What an in-house case really costs",
        blocks: [
          { type: "p", text: "When firms compare options, they usually compare a salary with a vendor's price. That comparison leaves most of the cost out. A full in-house figure includes:" },
          {
            type: "ul",
            items: [
              "**Benefits** — health cover, paid leave and retirement contributions.",
              "**Payroll taxes** — the employer's share, paid on every salary dollar.",
              "**Recruiting** — job ads, interviews and the weeks a seat stays empty.",
              "**Overhead** — desk space, software seats, training and the attorney time spent supervising.",
              "**Slow months** — salary is fixed, caseload isn't. A quiet month still costs a full month.",
            ],
          },
          { type: "p", text: "Spread those costs across the cases a paralegal actually drafts, and a single O-1 package lands near $2,920 for a senior hire in New York." },
        ],
      },
      {
        id: "outsourced-cost",
        title: "What you pay for when you outsource",
        blocks: [
          { type: "p", text: "A specialized provider charges per case. You pay for the petition you send, not for the calendar. When volume drops, so does the bill; when a batch of cases arrives at once, the capacity is already there." },
          { type: "p", text: "Specialization matters as much as price. A team that drafts immigration petitions every day already knows how to map evidence to the O-1 criteria and build an exhibit index an officer can follow. Your attorneys still own the strategy, review the draft and sign the petition." },
          { type: "callout", title: "Where Goodcase sits", text: "The guide's $1,000 is a typical outsourced price for an O-1 case. Goodcase's flat fees start at $500 per case, with no minimum volume, and your first case is half price. We confirm the exact fee for your case type on the first call." },
        ],
      },
      {
        id: "side-by-side",
        title: "Side by side",
        blocks: [
          {
            type: "table",
            caption: "Senior in-house paralegal (New York) vs. a specialized provider, per O-1 case",
            head: ["", "In-house", "Outsourced"],
            rows: [
              ["Cost per O-1 case", "≈ $2,920", "≈ $1,000"],
              ["Difference per case", "—", "≈ $1,920 less"],
              ["Five O-1 cases a month, per year", "≈ $175,200", "≈ $60,000"],
              ["What drives the cost", "Salary, benefits, payroll taxes, recruiting, overhead", "A flat fee for each case"],
              ["In a slow month", "Full salary is still due", "You pay only for cases you send"],
              ["Strategy, review and signature", "Attorney", "Attorney"],
            ],
            note: "Annual figures multiply the per-case estimates by 60 cases. Your own costs will differ.",
          },
        ],
      },
      {
        id: "when-in-house",
        title: "When hiring still makes sense — and how to decide",
        blocks: [
          { type: "p", text: "In-house hiring can be the right call when volume is high and steady enough to keep a full-time paralegal busy every month, or when you want institutional knowledge to live inside the firm. Many firms blend the two: a small core team in-house, with specialized support for overflow and the case types that take the most drafting time." },
          { type: "p", text: "The honest way to decide is to run your own numbers. The calculator below starts from 40 drafting hours at a $73 loaded hourly cost — the same $2,920 per case — and a $500 flat fee. Change the inputs to match your firm." },
        ],
      },
    ],
  },

  "on-demand-paralegal-services-scaling-guide": {
    kind: "outline",
    outline: [
      { id: "waves", title: "Why immigration work arrives in waves", summary: "RFE batches, policy changes and lead spikes rarely line up with your staffing plan." },
      { id: "what-it-covers", title: "What on-demand support covers — and what stays with you", summary: "Drafting, exhibits and follow-ups move out; strategy, client advice and the signature stay with the attorney." },
      { id: "blend", title: "Blending fixed and on-demand capacity", summary: "How to size a small core team and flex around it month to month." },
      { id: "pilot", title: "Starting with one case type", summary: "A low-risk way to test a provider before you rely on it in a busy quarter." },
    ],
  },

  "support-stack-immigration-practice": {
    kind: "outline",
    outline: [
      { id: "one-system", title: "Design software and people as one system", summary: "Why choosing between case management software and paralegal support is the wrong question." },
      { id: "software", title: "What software should carry", summary: "Date-driven, repeatable work: docketing, form population, exhibit indexing and receipt logging." },
      { id: "paralegals", title: "What paralegals should carry", summary: "Interpretation: record review, client follow-up, adapting to new guidance and knowing when to escalate." },
      { id: "attorney", title: "What stays with the attorney — and how to pilot", summary: "Eligibility calls, strategy and the signature, plus piloting one case type first." },
    ],
  },

  "outsourcing-business-visa-drafting": {
    kind: "outline",
    outline: [
      { id: "where-week-goes", title: "Where the week actually goes", summary: "The drafting, formatting and assembly work that sits between intake and the filing deadline." },
      { id: "day-to-day", title: "What outsourced drafting looks like day to day", summary: "Handoffs, templates and turnaround on business visa petitions." },
      { id: "quality", title: "Quality control: templates, review and sign-off", summary: "How a draft is checked before it reaches the attorney — and after." },
      { id: "questions", title: "Questions to ask any drafting partner", summary: "Confidentiality, specialization, pricing and who owns the final work." },
    ],
  },

  "ai-for-immigration-lawyers-safely": {
    kind: "outline",
    outline: [
      { id: "where-it-belongs", title: "Where AI belongs in an immigration workflow", summary: "Research and organization on public sources such as statutes and USCIS policy." },
      { id: "where-it-doesnt", title: "Where it doesn't", summary: "Client data, case evidence and legal judgment stay out of AI tools." },
      { id: "guardrails", title: "Confidentiality and ethics guardrails", summary: "Practical checks that protect your client and hold up to scrutiny." },
      { id: "policy", title: "Writing an AI policy your clients can read", summary: "What to put in writing, and how to keep it current." },
    ],
  },

  "is-your-practice-built-to-scale": {
    kind: "outline",
    outline: [
      { id: "habits", title: "Why new tools fail without new habits", summary: "Strategies, processes and software only work when the way the firm operates changes too." },
      { id: "map", title: "Mapping how work really moves through the firm", summary: "Finding the steps that live in one person's head." },
      { id: "team", title: "Bringing the team along", summary: "Change management for attorneys and staff who are already at capacity." },
      { id: "measure", title: "Checking that the change stuck", summary: "Simple signals that the new way of working is holding." },
    ],
  },

  "signs-ready-for-dedicated-paralegal-team": {
    kind: "outline",
    outline: [
      { id: "five-signs", title: "The five signs, at a glance", summary: "A quick self-check for firms that feel stretched." },
      { id: "another-hire", title: "Why another attorney hire won't fix it", summary: "When the bottleneck is structure, not headcount." },
      { id: "clear-scope", title: "What a dedicated team with clear scope looks like", summary: "Roles, handoffs and case-type workflows built around immigration practice." },
      { id: "supervision", title: "Supervision protocols that keep quality high", summary: "How attorneys stay in control of every petition." },
    ],
  },

  "output-verification-ai-tools": {
    kind: "outline",
    outline: [
      { id: "meaning", title: "What output verification means", summary: "Checking every citation, fact and figure an AI tool produces against the original source." },
      { id: "non-negotiable", title: "Why it's non-negotiable in immigration practice", summary: "Strict deadlines and high client stakes leave no room for unverified drafts." },
      { id: "workflow", title: "Building a verification workflow", summary: "Who checks what, in which order, before a draft reaches the attorney." },
      { id: "sign-off", title: "Sign-off and documentation", summary: "Recording what was verified, so the firm can show its work." },
    ],
  },
};

/** Where each article lives on the current goodcase.io site (from docs/source/goodcase-live/blog.txt). */
export const LIVE_PATHS: Record<string, string> = {
  "paralegal-outsourcing-cost-vs-in-house": "/blog/paralegal-outsourcing-cost-vs-hiring-in-house-2026-pricing-guide-for-immigration-firms",
  "on-demand-paralegal-services-scaling-guide": "/blog/on-demand-paralegal-services-for-immigration-law-firms",
  "support-stack-immigration-practice": "/blog/building-your-support-stack-immigration-practice",
  "outsourcing-business-visa-drafting": "/blog/the-reality-of-outsourcing-business-visa-drafting",
  "ai-for-immigration-lawyers-safely": "/blog/ai-for-immigration-lawyers-how-to-use-it-safely",
  "is-your-practice-built-to-scale": "/blog/is-your-immigration-practice-actually-built-to-scale",
  "signs-ready-for-dedicated-paralegal-team": "/blog/5-signs-your-immigration-firm-is-ready-for-on-demand-immigration-paralegal-support",
  "output-verification-ai-tools": "/blog/output-verification-in-ai-tools-for-legal-teams",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Split "Main title: subtitle" so the hero can show the subtitle in the muted tone. */
export function splitTitle(title: string): [string, string | undefined] {
  const i = title.indexOf(": ");
  return i > 0 ? [title.slice(0, i + 1), title.slice(i + 2)] : [title, undefined];
}

/** Posts, newest first. */
export const POSTS_BY_DATE: Post[] = sortBy(POSTS, (p) => p.date, "desc");

export const POST_CATEGORIES: Post["category"][] = Array.from(new Set(POSTS_BY_DATE.map((p) => p.category)));

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function getArticle(slug: string): ArticleBody | undefined {
  return ARTICLES[slug];
}

/** Same category first, then the newest of the rest. */
export function relatedPosts(post: Post, count = 3) {
  const others = POSTS_BY_DATE.filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...same, ...rest].slice(0, count);
}

/** Role and bio for a named author or host (real team from goodcase.io/about-us). */
export function personFor(name: string) {
  return TEAM.find((m) => m.name === name);
}

/** Table-of-contents entries for an article page. */
export function tocFor(body: ArticleBody) {
  if (body.kind === "full") {
    const items = body.sections.map((s) => ({ id: s.id, title: s.title }));
    return body.calculator ? [...items, { id: "run-your-numbers", title: "Run your own numbers" }] : items;
  }
  return body.outline.map((o) => ({ id: o.id, title: o.title }));
}
