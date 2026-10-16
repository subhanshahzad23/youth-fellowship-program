/**
 * Who-we-serve page wiring. The segment copy itself lives in SEGMENTS
 * (site.ts); this file only decides which existing testimonial, services and
 * FAQs each segment page shows. Nothing here adds new claims.
 */

import { FAQS, SEGMENTS, type Faq, type Segment, type Testimonial } from "./site";

type SegmentDetail = {
  /** Real testimonial (goodcase.io) that best matches the segment. */
  testimonial: Testimonial["id"];
  /** Services that make up the recommended setup. */
  services: { href: string; label: string }[];
  /** FAQ questions to show, by exact question text from FAQS. */
  faqs: string[];
};

export const SEGMENT_DETAILS: Record<string, SegmentDetail> = {
  "solo-and-small-firms": {
    testimonial: "practical",
    services: [{ href: "/case-drafting", label: "Case drafting" }],
    faqs: ["How much does it cost?", "Is there a long-term commitment?", "Will my clients know you're involved?", "Which petitions do you draft?", "Are you a law firm?", "Do you use AI on my clients' cases?"],
  },
  "growing-firms": {
    testimonial: "different",
    services: [
      { href: "/case-drafting", label: "Case drafting" },
      { href: "/case-management", label: "Case management" },
    ],
    faqs: ["How quickly can you start?", "Is there a long-term commitment?", "How is this different from a virtual assistant agency?", "How much does it cost?", "Are you a law firm?", "Will my clients know you're involved?"],
  },
  "large-and-high-volume": {
    testimonial: "volume",
    services: [
      { href: "/case-drafting", label: "Case drafting" },
      { href: "/case-management", label: "Case management" },
      { href: "/casey", label: "Casey" },
    ],
    faqs: ["How do you keep client information confidential?", "Do you use AI on my clients' cases?", "How quickly can you start?", "Where are you based?", "Are you a law firm?", "How much does it cost?"],
  },
};

/** FAQs for the who-we-serve overview. */
export const OVERVIEW_FAQS = ["Are you a law firm?", "How much does it cost?", "Is there a long-term commitment?", "How quickly can you start?", "How is this different from a virtual assistant agency?", "Will my clients know you're involved?"];

export function segmentHref(slug: string) {
  return `/who-we-serve/${slug}`;
}

export function getSegment(slug: string): Segment | undefined {
  return SEGMENTS.find((s) => s.slug === slug);
}

/** Pick FAQs by question text, keeping the requested order. */
export function pickFaqs(questions: readonly string[]): Faq[] {
  return questions.map((q) => FAQS.find((f) => f.q === q)).filter((f): f is Faq => Boolean(f));
}
