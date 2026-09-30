import type { PersonaKey } from "@/lib/domain/types";

/** The 5–7 minute guided client walkthrough. Each step switches identity and opens the right page. */
export interface WalkStep {
  id: string;
  persona: PersonaKey;
  title: string;
  body: string;
  href: string;
}

export const WALKTHROUGH: WalkStep[] = [
  {
    id: "maya-resume",
    persona: "maya",
    title: "Resume a saved application",
    body: "Maya's Winter 2027 draft picks up at Residence. Run the location check with the inside-area sample, attach a sample proof of residence, answer the questions and submit.",
    href: "/apply/winter-2027",
  },
  {
    id: "amira-review",
    persona: "amira",
    title: "Review with a rubric",
    body: "Amira is Maya's assigned reviewer. Open the application from the queue, preview the restricted document, score the four criteria and submit the review.",
    href: "/admin/applications",
  },
  {
    id: "amira-approve",
    persona: "amira",
    title: "Approve and enroll",
    body: "Approve Maya. One transition creates her cohort membership on the same identity, sends the simulated welcome email and writes the audit trail.",
    href: "/admin/applications",
  },
  {
    id: "maya-fellow",
    persona: "maya",
    title: "Same person, now a fellow",
    body: "Maya signs in with the same identity and lands in her fellow workspace with her cohort, track and curriculum.",
    href: "/workspace/dashboard",
  },
  {
    id: "noah-assignment",
    persona: "noah",
    title: "Submit an assignment",
    body: "Noah finishes his saved interview notes and submits them for review.",
    href: "/workspace/assignments",
  },
  {
    id: "elena-feedback",
    persona: "elena",
    title: "Instructor feedback and publishing",
    body: "Elena reviews Noah's submission, then edits a session draft and publishes it. Try opening a Venture Building module — editing is limited to her track.",
    href: "/staff/submissions",
  },
  {
    id: "daniel-message",
    persona: "daniel",
    title: "Supervised mentor messaging",
    body: "Daniel messages Noah. Try starting a conversation with Aisha — she isn't assigned to him, so the platform won't allow it.",
    href: "/staff/messages",
  },
  {
    id: "amira-safeguarding",
    persona: "amira",
    title: "Safeguarding and export",
    body: "Review the reported Summer 2026 message, hide it with a reason, resolve the report and export the transcript.",
    href: "/admin/safeguarding",
  },
  {
    id: "priya-oversight",
    persona: "priya",
    title: "Executive oversight",
    body: "Priya sees every cohort and can announce to all of them — but can't open residence documents she isn't assigned to. Check the audit log.",
    href: "/admin/dashboard",
  },
];
