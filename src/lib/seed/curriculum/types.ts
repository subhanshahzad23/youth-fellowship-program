import type { ContentBlock, SessionKind } from "@/lib/domain/types";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * Blocks without ids (ids are assigned deterministically by the seed builder).
 * Video blocks reference a script by id instead of a src.
 */
export type SeedBlock =
  | DistributiveOmit<Exclude<ContentBlock, { type: "video" }>, "id">
  | { type: "video"; videoId: string };

export interface SeedSession {
  /** globally unique kebab key, e.g. "ff-1-2" */
  key: string;
  kind: SessionKind;
  title: string;
  /** 1–2 sentences */
  summary: string;
  durationMin: number;
  showcase?: boolean;
  blocks: SeedBlock[];
}

export interface SeedModule {
  /** "ff-1" … "ff-6", "vb-1" … "vb-6", "li-1" … "li-6" */
  key: string;
  trackSlug: "founder-foundations" | "venture-building" | "leadership-impact";
  /** 1..6 */
  order: number;
  title: string;
  /** 1–2 sentences */
  summary: string;
  /** "Months 1–3", "Months 4–6", ... "Months 16–18" */
  suggestedMonths: string;
  sessions: SeedSession[];
}

export interface VideoScript {
  /** kebab id, referenced by { type: "video", videoId } */
  id: string;
  title: string;
  /** 4–6 segments */
  segments: { slideTitle: string; slideBody: string; narration: string }[];
}

export interface WorksheetSpec {
  /** e.g. "customer-interview-guide.pdf" (kebab, .pdf) */
  fileName: string;
  title: string;
  intro: string;
  /** 3–5 sections, 2–5 prompts each */
  sections: { heading: string; prompts: string[] }[];
}
