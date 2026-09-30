import type { Cohort, Membership, MentorAssignment, NotificationPrefs, PersonaKey, StaffRole, Track, User } from "@/lib/domain/types";
import { ago } from "@/lib/clock";
import { hashString } from "@/lib/utils";

/*
 * Every person, venture, address and story here is fabricated demo content.
 */

const defaultPrefs: NotificationPrefs = { digest: "daily", emailAnnouncements: true, emailMessages: true };

function person(
  id: string,
  name: string,
  extra: Partial<User> & { staffRoles?: StaffRole[]; persona?: PersonaKey } = {},
): User {
  const firstName = name.split(" ")[0];
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.$/, "");
  return {
    id,
    name,
    firstName,
    email: `${slug}@example.org`,
    avatarHue: hashString(id) % 360,
    staffRoles: [],
    createdAt: ago(300),
    notificationPrefs: { ...defaultPrefs },
    ...extra,
  };
}

/* ------------------------------------------------------------------ */
/* Tracks                                                              */
/* ------------------------------------------------------------------ */

export const TRACKS: Track[] = [
  {
    id: "t_ff",
    slug: "founder-foundations",
    name: "Founder Foundations",
    shortName: "Foundations",
    tagline: "Find a problem worth solving — and the people who have it.",
    description:
      "Learn to spot real problems, talk to the people who live with them, and turn what you hear into a sharp value proposition and a business model you can test.",
    outcomes: [
      "Run and synthesize real customer interviews",
      "Write a value proposition people recognize themselves in",
      "Design small, cheap experiments before building",
      "Sketch a business model you can defend",
    ],
    color: "#00c27a",
    order: 1,
  },
  {
    id: "t_vb",
    slug: "venture-building",
    name: "Venture Building",
    shortName: "Venture",
    tagline: "Turn a tested idea into something people can buy.",
    description:
      "Prototype quickly, size your market honestly, price with confidence, and learn the financial and operational basics you need before a real launch.",
    outcomes: [
      "Build and test a scrappy prototype",
      "Estimate a reachable market without wishful thinking",
      "Run a pricing experiment",
      "Plan a launch with a realistic budget",
    ],
    color: "#5887ff",
    order: 2,
  },
  {
    id: "t_li",
    slug: "leadership-impact",
    name: "Leadership & Impact",
    shortName: "Leadership",
    tagline: "Lead people, earn trust, and make your community better.",
    description:
      "Build a team that works, communicate clearly, make ethical calls under pressure, measure community impact, form partnerships, and pitch with conviction.",
    outcomes: [
      "Write a team charter and run effective check-ins",
      "Handle a hard conversation with care",
      "Map the community impact of your venture",
      "Deliver a clear three-minute pitch",
    ],
    color: "#be53ff",
    order: 3,
  },
];

/* ------------------------------------------------------------------ */
/* Cohorts — 18 months each, independently configurable windows         */
/* ------------------------------------------------------------------ */

const ALL_TRACKS = TRACKS.map((t) => t.id);

export const COHORTS: Cohort[] = [
  {
    id: "c_spring26",
    slug: "spring-2026",
    name: "Spring 2026",
    status: "active",
    startDate: "2026-03-02T00:00:00.000Z",
    endDate: "2027-08-31T00:00:00.000Z",
    capacity: 14,
    description: "Our spring cohort is in its eighth month, moving from customer discovery into building and launch planning.",
    trackIds: ALL_TRACKS,
    location: "Larkhaven Makers Hall + online",
    createdAt: ago(420),
  },
  {
    id: "c_summer26",
    slug: "summer-2026",
    name: "Summer 2026",
    status: "active",
    startDate: "2026-07-06T00:00:00.000Z",
    endDate: "2027-12-31T00:00:00.000Z",
    capacity: 14,
    description: "Four months in. Fellows are deep in customer interviews and running their first experiments.",
    trackIds: ALL_TRACKS,
    location: "Eastbank Community Studio + online",
    createdAt: ago(300),
  },
  {
    id: "c_winter27",
    slug: "winter-2027",
    name: "Winter 2027",
    status: "intake",
    startDate: "2027-01-11T00:00:00.000Z",
    endDate: "2028-07-10T00:00:00.000Z",
    capacity: 16,
    description: "Applications are open. Fellows start with a two-day kickoff in January and meet weekly through July 2028.",
    trackIds: ALL_TRACKS,
    location: "Larkhaven Makers Hall + online",
    createdAt: ago(120),
  },
  {
    id: "c_spring27",
    slug: "spring-2027",
    name: "Spring 2027",
    status: "intake",
    startDate: "2027-04-05T00:00:00.000Z",
    endDate: "2028-10-04T00:00:00.000Z",
    capacity: 14,
    description: "An early application window for fellows who want a spring start. Runs alongside the Winter 2027 intake.",
    trackIds: ALL_TRACKS,
    location: "Old Quay Library + online",
    createdAt: ago(40),
  },
  {
    id: "c_summer27",
    slug: "summer-2027",
    name: "Summer 2027",
    status: "announced",
    startDate: "2027-07-12T00:00:00.000Z",
    endDate: "2029-01-11T00:00:00.000Z",
    capacity: 16,
    description: "Announced for summer 2027. Register interest and we will let you know the day applications open.",
    trackIds: ALL_TRACKS,
    location: "Eastbank Community Studio + online",
    createdAt: ago(12),
  },
];

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */

const staff: User[] = [
  person("u_priya", "Priya Shah", {
    staffRoles: ["executive_admin"],
    title: "Executive Director",
    persona: "priya",
    bio: "Leads the fellowship and oversees safeguarding across every cohort.",
    createdAt: ago(900),
  }),
  person("u_jordan", "Jordan Okafor", {
    staffRoles: ["executive_admin"],
    title: "Director of Programs",
    bio: "Sets program strategy and reviews applications when intake is busy.",
    createdAt: ago(880),
  }),
  person("u_amira", "Amira Hassan", {
    staffRoles: ["program_admin"],
    title: "Program Manager · Summer 2026 & Winter 2027",
    persona: "amira",
    bio: "Runs day-to-day operations for two cohorts and leads Winter 2027 intake reviews.",
    createdAt: ago(700),
  }),
  person("u_marcus", "Marcus Lee", {
    staffRoles: ["program_admin"],
    title: "Program Manager · Spring 2026 & Spring 2027",
    bio: "Runs operations for the spring cohorts.",
    createdAt: ago(690),
  }),
  person("u_elena", "Elena Ruiz", {
    staffRoles: ["instructor"],
    title: "Track Instructor · Founder Foundations",
    persona: "elena",
    bio: "Former product researcher. Teaches customer discovery and experiment design.",
    createdAt: ago(600),
  }),
  person("u_kwame", "Kwame Mensah", {
    staffRoles: ["instructor"],
    title: "Track Instructor · Venture Building",
    bio: "Ran a small food business for eight years. Teaches pricing, finance and operations.",
    createdAt: ago(590),
  }),
  person("u_hannah", "Hannah Park", {
    staffRoles: ["instructor"],
    title: "Track Instructor · Leadership & Impact",
    bio: "Community organizer and facilitator. Teaches teamwork, ethics and pitching.",
    createdAt: ago(580),
  }),
  person("u_daniel", "Daniel Brooks", {
    staffRoles: ["mentor"],
    title: "Volunteer Mentor",
    persona: "daniel",
    bio: "Opened two neighborhood repair shops (fictional). Mentors three Summer 2026 fellows.",
    createdAt: ago(400),
  }),
  person("u_grace", "Grace Liu", {
    staffRoles: ["mentor"],
    title: "Volunteer Mentor",
    bio: "Product designer who loves early-stage messiness.",
    createdAt: ago(390),
  }),
  person("u_sofia", "Sofia Marin", {
    staffRoles: ["mentor"],
    title: "Volunteer Mentor",
    bio: "Runs a small bakery and teaches evening classes in bookkeeping.",
    createdAt: ago(380),
  }),
  person("u_omar", "Omar Haddad", {
    staffRoles: ["mentor"],
    title: "Volunteer Mentor",
    bio: "Social enterprise consultant. Mentors across both active cohorts.",
    createdAt: ago(370),
  }),
];

/* ------------------------------------------------------------------ */
/* Fellows                                                             */
/* ------------------------------------------------------------------ */

type FellowSeed = [id: string, name: string, cohortId: string, trackId: string, venture: string, summary: string, stage: User["ventureStage"], city: string, pronouns?: string];

export const FELLOW_SEEDS: FellowSeed[] = [
  // Spring 2026
  ["u_leo", "Leo Martins", "c_spring26", "t_ff", "FixIt Friday", "A monthly repair café where volunteers fix small appliances alongside the owners, teaching repair skills as they go.", "First customers", "Eastbank", "he/him"],
  ["u_zara", "Zara Ahmed", "c_spring26", "t_ff", "Signbridge", "Short, affordable sign-language lessons for families of Deaf children, taught by Deaf tutors.", "Testing", "Millbrook", "she/her"],
  ["u_ethan", "Ethan Cole", "c_spring26", "t_vb", "Loop Refill", "A neighborhood refill station for soap, detergent and pantry staples, run from a converted shipping container.", "Prototype", "Old Quay", "he/him"],
  ["u_imani", "Imani Clarke", "c_spring26", "t_li", "Stitch & Mend", "Pop-up clothing repair stalls at schools and markets, with paid apprenticeships for students.", "First customers", "Eastbank", "she/her"],
  ["u_mateo", "Mateo Rossi", "c_spring26", "t_vb", "Slotly", "A simple booking and reminder tool built for independent barbers and braiders.", "Growing", "Harborside", "he/him"],
  ["u_chloe", "Chloe Nguyen", "c_spring26", "t_li", "Green Plate", "Turns school cafeteria food waste into compost for community gardens, run by student crews.", "Testing", "Millbrook", "she/her"],
  ["u_samir", "Samir Patel", "c_spring26", "t_ff", "Tutor Ladder", "Peer math tutoring designed for students with dyscalculia, with accessible worksheets.", "Prototype", "Old Quay", "he/him"],
  ["u_olivia", "Olivia Grant", "c_spring26", "t_vb", "Bloom Box", "A weekly produce box sourced from three community gardens, delivered by bike.", "First customers", "Eastbank", "she/her"],
  ["u_kai", "Kai Johnson", "c_spring26", "t_ff", "Spokes", "A youth-run bike repair co-op offering pay-what-you-can tune-ups and refurbished bikes.", "Testing", "Harborside", "they/them"],
  ["u_nia", "Nia Roberts", "c_spring26", "t_li", "Quiet Hours", "Listings and booking for sensory-friendly hours at local venues, shops and events.", "Idea", "Millbrook", "she/her"],
  ["u_lucas", "Lucas Ferreira", "c_spring26", "t_vb", "PrintLab", "Low-cost 3D printing and design help for school science and art projects.", "Prototype", "Old Quay", "he/him"],
  ["u_hana", "Hana Sato", "c_spring26", "t_li", "Circle Closet", "A school uniform swap with sizing help and a laundry partner, run by parents and students.", "First customers", "Eastbank", "she/her"],
  // Summer 2026
  ["u_noah", "Noah Williams", "c_summer26", "t_ff", "Porchlight Repair", "A neighborhood repair café and tool library that helps renters fix things instead of replacing them.", "Testing", "Eastbank", "he/him"],
  ["u_aisha", "Aisha Bello", "c_summer26", "t_ff", "StudyNook", "Bookable quiet study rooms with accessible tutoring, hosted in underused community spaces.", "Testing", "Millbrook", "she/her"],
  ["u_ryan", "Ryan O'Neil", "c_summer26", "t_vb", "RefillRun", "Bike-delivered refills of household staples in returnable glass, ordered by text message.", "Prototype", "Old Quay", "he/him"],
  ["u_meera", "Meera Iyer", "c_summer26", "t_li", "Kindred Kits", "Practical care packages for new parents, assembled with local makers and delivered by volunteers.", "Idea", "Harborside", "she/her"],
  ["u_jamal", "Jamal Carter", "c_summer26", "t_vb", "BookBarber", "A booking tool for small barbershops that handles walk-in queues as well as appointments.", "Prototype", "Eastbank", "he/him"],
  ["u_elif", "Elif Kaya", "c_summer26", "t_vb", "Crumb Club", "Surplus bread and pastry boxes rescued from local bakeries at the end of the day.", "First customers", "Millbrook", "she/her"],
  ["u_tyler", "Tyler Nash", "c_summer26", "t_li", "Game Night Kits", "A borrowable board game library with hosted game nights for teens and families.", "Testing", "Old Quay", "he/him"],
  ["u_amara", "Amara Obi", "c_summer26", "t_li", "SafeWalk", "A walking-buddy network for students leaving evening classes, coordinated with the college.", "Idea", "Harborside", "she/her"],
  ["u_diego", "Diego Morales", "c_summer26", "t_ff", "Fresh Frames", "Refurbishes donated glasses frames and pairs them with affordable eye tests.", "Testing", "Eastbank", "he/him"],
  ["u_lily", "Lily Novak", "c_summer26", "t_ff", "PetPals", "Matches trusted teen dog walkers with older neighbors who need a hand.", "First customers", "Millbrook", "she/her"],
  ["u_ben", "Ben Adeyemi", "c_summer26", "t_vb", "SolarStand", "A solar-powered phone-charging stall for weekend markets and outdoor events.", "Prototype", "Harborside", "he/him"],
  ["u_rosa", "Rosa Delgado", "c_summer26", "t_li", "Paint the Block", "Youth public art commissions for small businesses that want to brighten their shopfronts.", "Testing", "Old Quay", "she/her"],
];

const fellows: User[] = FELLOW_SEEDS.map(([id, name, cohortId, , venture, summary, stage, city, pronouns]) =>
  person(id, name, {
    ventureName: venture,
    ventureSummary: summary,
    ventureStage: stage,
    city,
    pronouns,
    persona: id === "u_noah" ? "noah" : undefined,
    bio:
      id === "u_noah"
        ? "Grew up fixing bikes with his grandad. Building a repair café so renters on his street stop throwing things away."
        : undefined,
    createdAt: cohortId === "c_spring26" ? ago(260) : ago(150),
    private: { dateOfBirth: "2006-05-14", phone: "+00 0000 000000" },
  }),
);

/* ------------------------------------------------------------------ */
/* Applicants (some later gain fellow membership through approval)     */
/* ------------------------------------------------------------------ */

type ApplicantSeed = [id: string, name: string, venture: string, city: string, pronouns?: string];

export const APPLICANT_SEEDS: ApplicantSeed[] = [
  ["u_maya", "Maya Chen", "Second Shelf", "Eastbank", "she/her"],
  ["u_jonah", "Jonah Reyes", "ClearPath", "Millbrook", "he/him"],
  ["u_sara", "Sara Lindqvist", "Harvest Hands", "Old Quay", "she/her"],
  ["u_theo", "Theo Mitchell", "Glow Up Resumes", "Harborside", "he/him"],
  ["u_fatima", "Fatima Noor", "Threadline", "Eastbank", "she/her"],
  ["u_ravi", "Ravi Menon", "CodeCamp Kids", "Millbrook", "he/him"],
  ["u_isabella", "Isabella Moreno", "Panadería Pop-Up", "Old Quay", "she/her"],
  ["u_kofi", "Kofi Asante", "BeatBox Studio", "Harborside", "he/him"],
  ["u_ella", "Ella Brennan", "Paws & Pages", "Westmoor", "she/her"],
  ["u_yusuf", "Yusuf Demir", "Mend Lab", "Millbrook", "he/him"],
  ["u_maddie", "Maddie Owens", "Rooftop Radishes", "Eastbank", "she/her"],
  ["u_arjun", "Arjun Kapoor", "SnackSwap", "Kingsford", "he/him"],
];

const applicants: User[] = APPLICANT_SEEDS.map(([id, name, venture, city, pronouns]) =>
  person(id, name, {
    ventureName: venture,
    city,
    pronouns,
    persona: id === "u_maya" ? "maya" : undefined,
    createdAt: ago(40 - (hashString(id) % 30)),
    private: { dateOfBirth: "2008-02-09", phone: "+00 0000 000000" },
  }),
);

export const USERS: User[] = [...staff, ...fellows, ...applicants];

/* ------------------------------------------------------------------ */
/* Memberships and assignments                                          */
/* ------------------------------------------------------------------ */

export function buildMemberships(): Membership[] {
  const out: Membership[] = [];
  let n = 0;
  const add = (m: Omit<Membership, "id">) => out.push({ id: `m_${String(++n).padStart(3, "0")}`, ...m });

  for (const [id, , cohortId, trackId] of FELLOW_SEEDS) {
    const cohort = COHORTS.find((c) => c.id === cohortId)!;
    add({ userId: id, cohortId, role: "fellow", trackId, status: "active", startedAt: cohort.startDate });
  }
  // Program admins are scoped to specific cohorts (proposal assumption — see docs/production-handoff.md)
  const adminScopes: [string, string[]][] = [
    ["u_amira", ["c_summer26", "c_winter27"]],
    ["u_marcus", ["c_spring26", "c_spring27"]],
  ];
  for (const [uid, cohorts] of adminScopes)
    for (const c of cohorts) add({ userId: uid, cohortId: c, role: "program_admin", status: "active", startedAt: ago(200) });

  const instructors: [string, string][] = [
    ["u_elena", "t_ff"],
    ["u_kwame", "t_vb"],
    ["u_hannah", "t_li"],
  ];
  for (const [uid, trackId] of instructors)
    for (const c of ["c_spring26", "c_summer26", "c_winter27"])
      add({ userId: uid, cohortId: c, role: "instructor", trackId, status: "active", startedAt: ago(250) });

  const mentorCohorts: [string, string[]][] = [
    ["u_daniel", ["c_summer26"]],
    ["u_grace", ["c_summer26"]],
    ["u_sofia", ["c_spring26"]],
    ["u_omar", ["c_spring26", "c_summer26"]],
  ];
  for (const [uid, cohorts] of mentorCohorts)
    for (const c of cohorts) add({ userId: uid, cohortId: c, role: "mentor", status: "active", startedAt: ago(220) });

  return out;
}

export function buildMentorAssignments(): MentorAssignment[] {
  const pairs: [mentor: string, fellow: string, cohort: string, status?: "ended"][] = [
    ["u_daniel", "u_noah", "c_summer26"],
    ["u_daniel", "u_diego", "c_summer26"],
    ["u_daniel", "u_lily", "c_summer26"],
    ["u_grace", "u_aisha", "c_summer26"],
    ["u_grace", "u_ryan", "c_summer26"],
    ["u_grace", "u_jamal", "c_summer26"],
    ["u_grace", "u_elif", "c_summer26"],
    ["u_omar", "u_meera", "c_summer26"],
    ["u_omar", "u_amara", "c_summer26"],
    ["u_omar", "u_ben", "c_summer26"],
    ["u_omar", "u_rosa", "c_summer26"],
    ["u_omar", "u_tyler", "c_summer26", "ended"], // relationship ended — thread becomes read-only
    ["u_sofia", "u_leo", "c_spring26"],
    ["u_sofia", "u_zara", "c_spring26"],
    ["u_sofia", "u_samir", "c_spring26"],
    ["u_sofia", "u_kai", "c_spring26"],
    ["u_sofia", "u_nia", "c_spring26"],
    ["u_omar", "u_ethan", "c_spring26"],
    ["u_omar", "u_mateo", "c_spring26"],
    ["u_omar", "u_olivia", "c_spring26"],
    ["u_omar", "u_imani", "c_spring26"],
    ["u_omar", "u_lucas", "c_spring26"],
    ["u_omar", "u_chloe", "c_spring26"],
    ["u_omar", "u_hana", "c_spring26"],
  ];
  return pairs.map(([mentorId, fellowId, cohortId, status], i) => ({
    id: `ma_${String(i + 1).padStart(3, "0")}`,
    mentorId,
    fellowId,
    cohortId,
    status: status ?? "active",
    startedAt: cohortId === "c_spring26" ? "2026-03-16T09:00:00.000Z" : "2026-07-20T09:00:00.000Z",
    endedAt: status === "ended" ? ago(34) : undefined,
  }));
}

export const PERSONAS: { key: PersonaKey; userId: string; label: string; role: string; blurb: string; home: string }[] = [
  { key: "maya", userId: "u_maya", label: "Maya Chen", role: "Applicant", blurb: "Has a saved Winter 2027 draft. Resume, upload a sample document and submit.", home: "/applicant/dashboard" },
  { key: "amira", userId: "u_amira", label: "Amira Hassan", role: "Program admin", blurb: "Reviews Winter 2027 applications, approves fellows and moderates Summer 2026.", home: "/admin/dashboard" },
  { key: "noah", userId: "u_noah", label: "Noah Williams", role: "Fellow · Summer 2026", blurb: "Mid-way through Founder Foundations with an assignment draft and a mentor thread.", home: "/workspace/dashboard" },
  { key: "elena", userId: "u_elena", label: "Elena Ruiz", role: "Track instructor", blurb: "Edits Founder Foundations sessions and reviews fellow submissions.", home: "/staff/dashboard" },
  { key: "daniel", userId: "u_daniel", label: "Daniel Brooks", role: "Mentor", blurb: "Mentors three Summer 2026 fellows, including Noah.", home: "/staff/dashboard" },
  { key: "priya", userId: "u_priya", label: "Priya Shah", role: "Executive admin", blurb: "Sees every cohort, supervises all conversations and exports records.", home: "/admin/dashboard" },
];


