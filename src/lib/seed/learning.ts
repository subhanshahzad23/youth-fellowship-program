import type { ContentBlock, Module, Session, SessionCompletion, SessionContent, Submission } from "@/lib/domain/types";
import { ago } from "@/lib/clock";
import { hashString, prng } from "@/lib/utils";
import { CURRICULUM, type SeedBlock, type SeedSession } from "./curriculum";
import { FELLOW_SEEDS, TRACKS } from "./people";
import videoManifest from "./video-manifest.json";

type Manifest = Record<string, { src: string; poster: string; captions: string; durationSec: number; transcript: { t: number; text: string }[] }>;
const VIDEOS = videoManifest as Manifest;

export function toBlocks(sessionKey: string, blocks: SeedBlock[]): ContentBlock[] {
  return blocks.map((b, i) => {
    const id = `${sessionKey}-b${i + 1}`;
    if (b.type === "video") {
      const v = VIDEOS[b.videoId];
      return {
        id,
        type: "video",
        title: v ? titleForVideo(b.videoId) : "Session video",
        src: v?.src ?? `/media/${b.videoId}.mp4`,
        poster: v?.poster,
        captions: v?.captions,
        durationSec: v?.durationSec ?? 0,
        transcript: v?.transcript ?? [],
      };
    }
    return { id, ...b } as ContentBlock;
  });
}

function titleForVideo(videoId: string) {
  for (const m of CURRICULUM) for (const s of m.sessions) if (s.blocks.some((b) => b.type === "video" && b.videoId === videoId)) return s.title;
  return "Session video";
}

export function toContent(s: SeedSession): SessionContent {
  return { title: s.title, summary: s.summary, durationMin: s.durationMin, blocks: toBlocks(s.key, s.blocks) };
}

const TRACK_ID_BY_SLUG = Object.fromEntries(TRACKS.map((t) => [t.slug, t.id]));

const FEEDBACK: Record<string, string[]> = {
  t_ff: [
    "Clear and specific. You've named a real person with a real problem — keep that level of detail when you interview.",
    "Strong work. Your best insight is buried in the third paragraph; lead with it next time.",
    "You asked about past behavior instead of hypotheticals. That's exactly the habit we want.",
    "Good evidence. Next step: find two people who disagree with your assumption and talk to them.",
  ],
  t_vb: [
    "Your numbers hang together. Label which figures are assumptions so you can test them one by one.",
    "Nice scrappy prototype. Watch one person use it without explaining anything and note where they stall.",
    "Solid reasoning on price. Try a test at a higher price point before you settle.",
    "Clear plan. Add a simple weekly checklist so the operations don't live only in your head.",
  ],
  t_li: [
    "Thoughtful reflection. The part about listening before deciding shows real maturity.",
    "Your team charter is clear. Add what happens when someone misses a commitment.",
    "Good impact thinking. Pick one measure you can actually collect next month.",
    "Confident delivery in the recording. Slow down on the numbers so they land.",
  ],
};

export interface BuiltLearning {
  modules: Module[];
  sessions: Session[];
  completions: SessionCompletion[];
  submissions: Submission[];
}

const INSTRUCTOR_BY_TRACK: Record<string, string> = { t_ff: "u_elena", t_vb: "u_kwame", t_li: "u_hannah" };

export function buildLearning(): BuiltLearning {
  const modules: Module[] = [];
  const sessions: Session[] = [];

  for (const m of CURRICULUM) {
    const trackId = TRACK_ID_BY_SLUG[m.trackSlug];
    const moduleSessions: Session[] = m.sessions.map((s, i) => ({
      id: s.key,
      moduleId: m.key,
      order: i + 1,
      kind: s.kind,
      status: "published",
      published: toContent(s),
      publishedAt: ago(240 - m.order * 3),
      showcase: s.showcase,
      notionBlockId: `ntn-${s.key}`,
    }));
    sessions.push(...moduleSessions);
    modules.push({
      id: m.key,
      trackId,
      order: m.order,
      title: m.title,
      summary: m.summary,
      suggestedMonths: m.suggestedMonths,
      sessionIds: moduleSessions.map((s) => s.id),
      notionPageId: `ntn-${m.key}`,
      updatedAt: ago(240 - m.order * 3),
    });
  }

  const completions: SessionCompletion[] = [];
  const submissions: Submission[] = [];

  const modulesByTrack = (trackId: string) => modules.filter((mm) => mm.trackId === trackId).sort((a, b) => a.order - b.order);
  const taskBlock = (s: Session) => s.published?.blocks.find((b) => b.type === "task") as Extract<ContentBlock, { type: "task" }> | undefined;

  // Special fellow states used by the walkthrough
  const special: Record<string, { pendingModuleOrder?: number; pendingState?: "draft" | "submitted" | "changes_requested" }> = {
    u_noah: { pendingModuleOrder: 2, pendingState: "draft" },
    u_aisha: { pendingModuleOrder: 2, pendingState: "submitted" },
    u_lily: { pendingModuleOrder: 2, pendingState: "submitted" },
    u_diego: { pendingModuleOrder: 1, pendingState: "changes_requested" },
    u_samir: { pendingModuleOrder: 3, pendingState: "submitted" },
    u_ryan: { pendingModuleOrder: 2, pendingState: "submitted" },
    u_ethan: { pendingModuleOrder: 3, pendingState: "submitted" },
    u_amara: { pendingModuleOrder: 2, pendingState: "submitted" },
    u_chloe: { pendingModuleOrder: 3, pendingState: "submitted" },
  };

  for (const [fellowId, , cohortId, trackId] of FELLOW_SEEDS) {
    const rand = prng(hashString(fellowId));
    const mods = modulesByTrack(trackId);
    const isSpring = cohortId === "c_spring26";
    const sp = special[fellowId];
    // How many full modules are complete, plus how far into the next one
    const fullModules = sp?.pendingModuleOrder ? sp.pendingModuleOrder - 1 : isSpring ? 2 : 1;
    const partial = sp?.pendingModuleOrder ? 1 : Math.floor(rand() * 2) + (isSpring ? 1 : 0);
    const cohortStart = isSpring ? 240 : 115; // days ago
    let dayCursor = cohortStart - 10;

    mods.forEach((mod, mi) => {
      const modSessions = mod.sessionIds.map((id) => sessions.find((s) => s.id === id)!);
      modSessions.forEach((s, si) => {
        const inFull = mi < fullModules;
        const inPartial = mi === fullModules && si < partial;
        const isPendingTask = sp?.pendingModuleOrder === mod.order && s.kind === "task";
        dayCursor = Math.max(2, dayCursor - (isSpring ? 11 : 9) - Math.floor(rand() * 4));
        const at = ago(dayCursor, Math.floor(rand() * 10));

        if (s.kind !== "task") {
          if (inFull || inPartial) completions.push({ id: `sc_${fellowId}_${s.id}`, userId: fellowId, sessionId: s.id, completedAt: at });
          return;
        }
        const task = taskBlock(s);
        const instructor = INSTRUCTOR_BY_TRACK[trackId];
        const fb = FEEDBACK[trackId][Math.floor(rand() * FEEDBACK[trackId].length)];
        const base = {
          id: `sub_${fellowId}_${s.id}`,
          sessionId: s.id,
          fellowId,
          cohortId,
          draftAttachmentIds: [] as string[],
        };
        const text = submissionText(fellowId, s.published?.title ?? "", rand);

        if (isPendingTask && sp?.pendingState) {
          if (sp.pendingState === "draft") {
            submissions.push({
              ...base,
              status: "draft",
              draftText:
                "Interview 1 — Priya (renter, 24, Rope Walk). Last broken thing: a desk lamp. She put it in the hallway \"for someone to take\". Didn't know anyone who could fix it. Would have paid \"a few dollars\" but mostly wanted it gone quickly.\n\nInterview 2 — Mr. Okoro (retired, owns his condo). Keeps every broken appliance in the shed \"in case\". His real frustration is carrying things to a shop across town.\n\nPattern so far: ",
              draftSavedAt: ago(0, 20),
              versions: [],
              feedback: [],
              updatedAt: ago(0, 20),
            });
          } else if (sp.pendingState === "submitted") {
            const vAt = ago(1 + Math.floor(rand() * 3), 4);
            submissions.push({
              ...base,
              status: "submitted",
              draftText: text,
              versions: [{ id: `${base.id}_v1`, text, attachmentIds: [], submittedAt: vAt }],
              feedback: [],
              updatedAt: vAt,
            });
          } else {
            const v1At = ago(9, 3);
            submissions.push({
              ...base,
              status: "changes_requested",
              draftText: text,
              versions: [{ id: `${base.id}_v1`, text, attachmentIds: [], submittedAt: v1At }],
              feedback: [
                {
                  id: `${base.id}_f1`,
                  authorId: instructor,
                  text: "Good start, Diego. Your problem statement describes the solution (refurbished frames) rather than the problem. Rewrite it from the customer's point of view: who struggles, when, and what it costs them today. Then resubmit.",
                  decision: "changes_requested",
                  at: ago(7, 2),
                  versionId: `${base.id}_v1`,
                },
              ],
              updatedAt: ago(7, 2),
            });
          }
          return;
        }

        if (inFull) {
          const vAt = at;
          const fbAt = ago(Math.max(1, dayCursor - 2), 3);
          submissions.push({
            ...base,
            status: "reviewed",
            draftText: text,
            versions: [{ id: `${base.id}_v1`, text, attachmentIds: [], submittedAt: vAt }],
            feedback:
              task?.requiresReview === false
                ? []
                : [{ id: `${base.id}_f1`, authorId: instructor, text: fb, decision: "approved", at: fbAt, versionId: `${base.id}_v1` }],
            updatedAt: fbAt,
          });
          completions.push({ id: `sc_${fellowId}_${s.id}`, userId: fellowId, sessionId: s.id, completedAt: fbAt });
        }
      });
    });
  }

  // Noah's first assignment feedback matches the message Elena sent him.
  const noahFirst = submissions.find((s) => s.fellowId === "u_noah" && s.status === "reviewed");
  if (noahFirst && noahFirst.feedback[0]) {
    noahFirst.feedback[0].text =
      "Great work, Noah. The line about renters not owning tools is the sharpest part — that's a real insight, not an assumption. For your interviews, start with renters and include one or two older neighbors as a contrast.";
    noahFirst.versions[0].text =
      "Problem statement: Renters on Rope Walk and nearby streets throw away small appliances, lamps and bikes that need simple repairs. They don't own tools, don't know who could help, and landlords won't fix personal items. Replacing a $25 lamp feels easier than finding a repair shop across town.\n\nWho has it most: renters aged 20–35 who moved in recently and older neighbors living alone.\n\nEvidence so far: nine porch repairs last spring; four people said they had thrown something away in the last month.";
  }

  return { modules, sessions, completions, submissions };
}

function submissionText(fellowId: string, title: string, rand: () => number) {
  const openers = [
    `Here's my work for "${title}".`,
    `Submission for "${title}" — notes and what I learned.`,
    `My response to "${title}".`,
  ];
  const middles = [
    "I spoke to four potential customers this week and wrote down exactly what they said before interpreting it.",
    "I tested the idea with a small group at the market and tracked every response in a simple tally.",
    "I drafted this with my co-founder and we disagreed on one point, which I've noted below.",
    "I used the worksheet and kept my assumptions separate from the evidence.",
  ];
  const closers = [
    "Biggest surprise: people cared more about convenience than price.",
    "Next step: run the same test with a different group to see if it holds.",
    "What I'm unsure about: whether the people I asked are really my first customers.",
    "I'd love feedback on whether my conclusion is too optimistic.",
  ];
  const pick = (a: string[]) => a[Math.floor(rand() * a.length)];
  return `${pick(openers)}\n\n${pick(middles)}\n\n${pick(closers)}`;
}
