import type { SeedBlock } from "./types";
import type { VideoId } from "./videos";
import { getWorksheet, type WorksheetFileName } from "./worksheets";

/**
 * Small constructors that keep the curriculum source readable.
 * Each returns a SeedBlock (no id; ids are assigned by the seed builder).
 */

export const heading = (text: string): SeedBlock => ({ type: "heading", text });

/** One text block. Each argument becomes its own paragraph. */
export const para = (...paragraphs: string[]): SeedBlock => ({
  type: "text",
  text: paragraphs.join("\n\n"),
});

export const bullets = (items: string[]): SeedBlock => ({ type: "list", ordered: false, items });

export const steps = (items: string[]): SeedBlock => ({ type: "list", ordered: true, items });

export const tip = (title: string, text: string): SeedBlock => ({ type: "callout", tone: "tip", title, text });

export const example = (title: string, text: string): SeedBlock => ({
  type: "callout",
  tone: "example",
  title,
  text,
});

export const warning = (title: string, text: string): SeedBlock => ({
  type: "callout",
  tone: "warning",
  title,
  text,
});

export const quote = (text: string, attribution: string): SeedBlock => ({ type: "quote", text, attribution });

export const video = (videoId: VideoId): SeedBlock => ({ type: "video", videoId });

export const worksheet = (fileName: WorksheetFileName, description: string): SeedBlock => {
  const { spec, size } = getWorksheet(fileName);
  return {
    type: "file",
    title: spec.title,
    description,
    href: `/samples/worksheets/${spec.fileName}`,
    fileName: spec.fileName,
    size,
  };
};

export const task = (spec: {
  title: string;
  instructions: string;
  deliverable: string;
  requiresReview: boolean;
  rubric?: string[];
}): SeedBlock => ({ type: "task", ...spec });
