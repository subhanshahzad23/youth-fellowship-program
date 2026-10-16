/** The seven layers of the home-page 3D stack, bottom to top. */
export type Layer = { key: string; title: string; plate: string; owner: string; body: string; tone: "ink" | "glass" | "jade" | "mint" };

export const LAYERS: Layer[] = [
  {
    key: "strategy",
    title: "Your strategy & signature",
    plate: "Your strategy & signature",
    owner: "Always yours — the attorney",
    body: "The foundation never moves. You set the case strategy, own the client relationship and sign every filing. Goodcase is not a law firm and never gives legal advice.",
    tone: "ink",
  },
  {
    key: "intake",
    title: "Intake & evidence",
    plate: "Intake & evidence",
    owner: "Run by your case manager",
    body: "Documents collected, clients chased, evidence organized by criterion — every file in one secure place with role-based, logged access.",
    tone: "glass",
  },
  {
    key: "drafting",
    title: "Specialist drafting team",
    plate: "Specialist drafting",
    owner: "Goodcase legal writers",
    body: "Immigration-only legal writers draft the petition letter, exhibit index and support letters — in your templates, your tone and your citation style.",
    tone: "glass",
  },
  {
    key: "review",
    title: "Two-step quality review",
    plate: "Two-step review",
    owner: "Goodcase team leads",
    body: "A second specialist checks every criterion, citation and exhibit against the original source before anything reaches your desk.",
    tone: "glass",
  },
  {
    key: "casey",
    title: "Casey, our case software",
    plate: "Casey",
    owner: "Shared with your team",
    body: "Status, deadlines, RFEs and client documents stay visible to your team in Casey, the case management software we built — no chasing, no spreadsheets.",
    tone: "jade",
  },
  {
    key: "manager",
    title: "Your dedicated case manager",
    plate: "Your case manager",
    owner: "One named person",
    body: "One experienced person who knows your firm, runs the timeline and keeps you updated. Your single point of contact, invisible to your clients.",
    tone: "glass",
  },
  {
    key: "package",
    title: "Filing-ready package",
    plate: "Filing-ready package",
    owner: "Back to you to review and sign",
    body: "A complete, reviewed package — ready for your final read, your signature and filing. Six case types, one standard.",
    tone: "mint",
  },
];

export const TILES = ["O-1", "EB-1A", "EB-2 NIW", "H-1B", "L-1", "E-2"] as const;
export const TILE_NAMES = ["Extraordinary ability", "Extraordinary ability GC", "National interest", "Specialty occupation", "Intracompany", "Treaty investor"] as const;

/** Scroll stages: plates build over 0 → 6, then the top plate splits into tiles. */
export const STAGE_MAX = 7.4;
export const plateVisibility = (stage: number, i: number) => Math.min(1, Math.max(0, (stage - i) / 0.6 + 1));
export const splitAmount = (stage: number) => Math.min(1, Math.max(0, (stage - 6.4) / 0.8));
export const activeFor = (stage: number) => Math.min(LAYERS.length - 1, Math.max(0, Math.round(stage)));
