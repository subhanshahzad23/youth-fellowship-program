/**
 * Synthetic curriculum for the Launchpad Fellowship demo.
 *
 * Three tracks, six modules each, delivered over 18 months. All people,
 * ventures, places ("Greater Larkhaven") and quotes are fictional.
 *
 * The content itself lives in ./curriculum/* and is re-exported here:
 *   - CURRICULUM     18 modules in track order, then module order
 *   - VIDEO_SCRIPTS  6 narrated slide videos (one per video session)
 *   - WORKSHEETS     10 downloadable worksheet specs (rendered to PDF later)
 */
import { FOUNDER_FOUNDATIONS } from "./curriculum/founder-foundations";
import { LEADERSHIP_IMPACT } from "./curriculum/leadership-impact";
import type { SeedModule } from "./curriculum/types";
import { VENTURE_BUILDING } from "./curriculum/venture-building";

export type { SeedBlock, SeedModule, SeedSession, VideoScript, WorksheetSpec } from "./curriculum/types";
export { VIDEO_SCRIPTS } from "./curriculum/videos";
export { WORKSHEETS } from "./curriculum/worksheets";

export const CURRICULUM: SeedModule[] = [...FOUNDER_FOUNDATIONS, ...VENTURE_BUILDING, ...LEADERSHIP_IMPACT];
