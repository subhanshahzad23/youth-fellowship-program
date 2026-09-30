import type { ContentBlock, Database, SessionContent, SessionKind } from "@/lib/domain/types";
import { CURRICULUM, type SeedBlock, type SeedModule } from "@/lib/seed/curriculum";
import { toBlocks } from "@/lib/seed/learning";

/**
 * Simulated Notion migration.
 *
 * These fixtures imitate a Notion workspace export for all 18 modules. They are
 * bundled synthetic data — there is no live Notion connection. The fixtures are
 * derived from the seeded curriculum with a handful of deliberate differences so
 * the first import shows creates/updates/skips and a repeat import skips
 * everything.
 */

export type NotionBlock =
  | { type: "heading_2"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bulleted_list_item"; text: string }
  | { type: "numbered_list_item"; text: string }
  | { type: "callout"; icon: "💡" | "📌" | "⚠️"; title: string; text: string }
  | { type: "quote"; text: string; caption: string }
  | { type: "video"; external: { url: string } }
  | { type: "file"; name: string; caption: string; description: string; size: string }
  | { type: "to_do"; text: string; instructions: string; deliverable: string; requiresReview: boolean; rubric?: string[] };

export interface NotionSessionPage {
  id: string;
  title: string;
  properties: { Kind: SessionKind; Summary: string; Minutes: number; Order: number };
  blocks: NotionBlock[];
}

export interface NotionModulePage {
  id: string;
  title: string;
  properties: { Track: string; Order: number; Months: string; Summary: string };
  children: NotionSessionPage[];
}

const TONE_ICON = { tip: "💡", example: "📌", warning: "⚠️" } as const;
const ICON_TONE = { "💡": "tip", "📌": "example", "⚠️": "warning" } as const;

function toNotion(blocks: SeedBlock[]): NotionBlock[] {
  const out: NotionBlock[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
        out.push({ type: "heading_2", text: b.text });
        break;
      case "text":
        out.push({ type: "paragraph", text: b.text });
        break;
      case "list":
        for (const item of b.items) out.push({ type: b.ordered ? "numbered_list_item" : "bulleted_list_item", text: item });
        break;
      case "callout":
        out.push({ type: "callout", icon: TONE_ICON[b.tone], title: b.title, text: b.text });
        break;
      case "quote":
        out.push({ type: "quote", text: b.text, caption: b.attribution });
        break;
      case "video":
        out.push({ type: "video", external: { url: `https://video.notion-export.example/${b.videoId}` } });
        break;
      case "file":
        out.push({ type: "file", name: b.fileName, caption: b.title, description: b.description, size: b.size });
        break;
      case "task":
        out.push({ type: "to_do", text: b.title, instructions: b.instructions, deliverable: b.deliverable, requiresReview: b.requiresReview, rubric: b.rubric });
        break;
    }
  }
  return out;
}

/** Map Notion blocks back to platform content blocks (inverse of toNotion). */
export function mapNotionBlocks(sessionKey: string, blocks: NotionBlock[]): { blocks: ContentBlock[]; mapped: Record<string, number> } {
  const seed: SeedBlock[] = [];
  const mapped: Record<string, number> = {};
  const count = (k: string) => (mapped[k] = (mapped[k] ?? 0) + 1);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const ordered = b.type === "numbered_list_item";
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === b.type) {
        items.push((blocks[i] as { text: string }).text);
        i++;
      }
      i--;
      seed.push({ type: "list", ordered, items });
      count("Lists");
      continue;
    }
    switch (b.type) {
      case "heading_2":
        seed.push({ type: "heading", text: b.text });
        count("Headings");
        break;
      case "paragraph":
        seed.push({ type: "text", text: b.text });
        count("Text");
        break;
      case "callout":
        seed.push({ type: "callout", tone: ICON_TONE[b.icon], title: b.title, text: b.text });
        count("Callouts");
        break;
      case "quote":
        seed.push({ type: "quote", text: b.text, attribution: b.caption });
        count("Quotes");
        break;
      case "video":
        seed.push({ type: "video", videoId: b.external.url.split("/").pop()! });
        count("Video links");
        break;
      case "file":
        seed.push({ type: "file", title: b.caption, description: b.description, href: `/samples/worksheets/${b.name}`, fileName: b.name, size: b.size });
        count("Files");
        break;
      case "to_do":
        seed.push({ type: "task", title: b.text, instructions: b.instructions, deliverable: b.deliverable, requiresReview: b.requiresReview, rubric: b.rubric });
        count("Tasks");
        break;
    }
  }
  return { blocks: toBlocks(sessionKey, seed), mapped };
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function modulePage(m: SeedModule): NotionModulePage {
  return {
    id: `ntn-${m.key}`,
    title: m.title,
    properties: { Track: m.trackSlug, Order: m.order, Months: m.suggestedMonths, Summary: m.summary },
    children: m.sessions.map((s, i) => ({
      id: `ntn-${s.key}`,
      title: s.title,
      properties: { Kind: s.kind, Summary: s.summary, Minutes: s.durationMin, Order: i + 1 },
      blocks: toNotion(s.blocks),
    })),
  };
}

let cached: NotionModulePage[] | null = null;

export function notionFixtures(): NotionModulePage[] {
  if (cached) return cached;
  const pages = CURRICULUM.map(modulePage);

  // Deliberate differences from the seeded platform content:
  // 1. A module renamed in Notion after the platform was seeded.
  const vb3 = pages.find((p) => p.id === "ntn-vb-3");
  if (vb3) vb3.title = `${vb3.title} (updated in Notion)`;
  // 2. Three sessions edited in Notion.
  const edit = (pageId: string, idx: number, extra: NotionBlock) => {
    const s = pages.find((p) => p.id === pageId)?.children[idx];
    if (s) s.blocks.push(extra);
  };
  edit("ntn-ff-2", 0, { type: "callout", icon: "💡", title: "Added after Summer 2026 office hours", text: "Ask people to *show* you the last time the problem happened — photos, receipts, the broken thing itself. Stories drift; objects don't." });
  edit("ntn-vb-4", 0, { type: "paragraph", text: "**Update:** keep a simple weekly log of cash in and cash out, even if it is just a notebook. Month-end surprises usually come from small, frequent costs." });
  edit("ntn-li-6", 0, { type: "callout", icon: "📌", title: "Showcase format", text: "At the showcase you have two minutes. Open with the person who has the problem, not with your product." });
  // 3. Two sessions that exist only in Notion.
  const ff1 = pages.find((p) => p.id === "ntn-ff-1");
  ff1?.children.push({
    id: "ntn-ff-1-clinic",
    title: "Problem statement clinic",
    properties: { Kind: "reading", Summary: "A worked example of turning a vague idea into a sharp problem statement, from our office hours.", Minutes: 12, Order: ff1.children.length + 1 },
    blocks: [
      { type: "heading_2", text: "From “people waste food” to a problem you can test" },
      { type: "paragraph", text: "A fellow arrived at office hours with the idea “people waste food”. It's true, but you can't interview “people”, and you can't test “waste”." },
      { type: "numbered_list_item", text: "Name who: families in Millbrook who shop once a week." },
      { type: "numbered_list_item", text: "Name when: the day before the next big shop, when vegetables go soft." },
      { type: "numbered_list_item", text: "Name the cost today: about $15 of food in the bin each week." },
      { type: "callout", icon: "💡", title: "Test it", text: "If you can't picture a specific person having the problem on a specific day, keep narrowing." },
    ],
  });
  const vb5 = pages.find((p) => p.id === "ntn-vb-5");
  vb5?.children.push({
    id: "ntn-vb-5-suppliers",
    title: "Supplier checklist",
    properties: { Kind: "reading", Summary: "What to ask before you rely on a supplier, and how to keep a backup.", Minutes: 10, Order: vb5.children.length + 1 },
    blocks: [
      { type: "paragraph", text: "Your venture is only as reliable as its least reliable supplier. Before you commit, ask the same questions every time." },
      { type: "bulleted_list_item", text: "What is the minimum order, and what happens if I need less next month?" },
      { type: "bulleted_list_item", text: "How much notice do you need, and how do you handle late deliveries?" },
      { type: "bulleted_list_item", text: "Who is my backup if you can't deliver?" },
      { type: "callout", icon: "⚠️", title: "Keep a backup", text: "Always know a second supplier, even if they cost a little more." },
    ],
  });
  cached = pages;
  return pages;
}

/* ------------------------------------------------------------------ */
/* Import planning                                                     */
/* ------------------------------------------------------------------ */

export interface PlanItem {
  notionId: string;
  title: string;
  kind: "module" | "session";
  action: "create" | "update" | "skip";
  targetId?: string;
  moduleId?: string;
  reason: string;
  mapped?: Record<string, number>;
  content?: SessionContent & { kind: SessionKind };
  moduleTitle?: string;
}

const strip = (blocks: ContentBlock[]) => JSON.stringify(blocks.map(({ id: _id, ...rest }) => { void _id; return rest; }));

export function planImport(db: Database): PlanItem[] {
  const items: PlanItem[] = [];
  const modules = Object.values(db.modules);
  const sessions = Object.values(db.sessions);
  for (const page of notionFixtures()) {
    const mod = modules.find((m) => m.notionPageId === page.id);
    const moduleKey = page.id.replace(/^ntn-/, "");
    if (!mod) {
      items.push({ notionId: page.id, title: page.title, kind: "module", action: "create", reason: "No matching module on the platform", moduleTitle: page.title });
    } else {
      const changed = mod.title !== page.title || mod.summary !== page.properties.Summary;
      items.push({ notionId: page.id, title: page.title, kind: "module", action: changed ? "update" : "skip", targetId: mod.id, reason: changed ? "Title or summary changed in Notion" : "Unchanged since last import", moduleTitle: page.title });
    }
    for (const child of page.children) {
      const existing = sessions.find((s) => s.notionBlockId === child.id);
      const sessionKey = existing?.id ?? child.id.replace(/^ntn-/, "");
      const { blocks, mapped } = mapNotionBlocks(sessionKey, child.blocks);
      const content = { title: child.title, summary: child.properties.Summary, durationMin: child.properties.Minutes, blocks, kind: child.properties.Kind };
      if (!existing) {
        items.push({ notionId: child.id, title: child.title, kind: "session", action: "create", moduleId: mod?.id ?? moduleKey, reason: "New page in Notion", mapped, content });
        continue;
      }
      const cur = existing.published;
      const same = cur && cur.title === child.title && cur.summary === child.properties.Summary && strip(cur.blocks) === strip(blocks);
      items.push({
        notionId: child.id,
        title: child.title,
        kind: "session",
        action: same ? "skip" : "update",
        targetId: existing.id,
        moduleId: existing.moduleId,
        reason: same ? "Unchanged since last import" : "Content differs from the platform",
        mapped,
        content,
      });
    }
  }
  return items;
}
