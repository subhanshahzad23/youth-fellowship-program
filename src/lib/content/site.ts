/**
 * Goodcase website content — single source of truth for copy and facts.
 *
 * Facts come from the Goodcase RFP ("Goodcase Website Redesign", 2026) and the
 * live goodcase.io site (see docs/source/). Anything illustrative is marked as
 * such in the UI. Final copy will come from Goodcase's copy document.
 */

export const COMPANY = {
  name: "Goodcase",
  legalName: "Goodcase.io Sp. z o.o.",
  email: "info@goodcase.io",
  address: "al. Jana Pawła II 27, 00-867 Warsaw, Poland",
  registry: "KRS 0001060361 · NIP 5273076826 · REGON 526474334",
  responseTime: "We usually respond within 24 hours.",
  disclaimer:
    "Goodcase is a private company that provides services in support of immigration document preparation by qualified attorneys. The information on this site is general information, not legal advice. Goodcase is not a law firm and does not provide legal advice.",
  regions: ["Europe", "Latin America", "India"],
} as const;

/** The first-case offer appears under every hero and above every closing button (brief §3). */
export const OFFER = {
  items: ["First case at half price", "Money-back guarantee", "No minimum volume"],
  price: "Flat fees from $500 per case",
} as const;

export const FACTS = [
  { value: "1,000+", unit: "cases worked", label: "for U.S. immigration law firms" },
  { value: "~30", unit: "specialists", label: "business immigration professionals" },
  { value: "$500", unit: "starting flat fee", label: "per case — no minimum volume" },
  { value: "3", unit: "regions", label: "Europe, Latin America and India" },
] as const;

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export const NAV = {
  services: [
    { href: "/case-drafting", title: "Case drafting", desc: "Filing-ready petitions in your format" },
    { href: "/case-management", title: "Case management", desc: "A case manager inside your firm" },
    { href: "/casey", title: "Casey", desc: "Our case management software" },
  ],
  whoWeServe: [
    { href: "/who-we-serve", title: "Overview", desc: "Support sized to your practice" },
    { href: "/who-we-serve/solo-and-small-firms", title: "Solo and small firms", desc: "Take on more cases without hiring" },
    { href: "/who-we-serve/growing-firms", title: "Growing firms", desc: "Flexible capacity as volume climbs" },
    { href: "/who-we-serve/large-and-high-volume", title: "Large and high-volume", desc: "Dedicated teams and reporting" },
  ],
  links: [
    { href: "/about", title: "About" },
    { href: "/resources", title: "Resources" },
  ],
} as const;

export const FOOTER_COLUMNS = [
  {
    title: "Services",
    links: [
      { label: "Case drafting", href: "/case-drafting" },
      { label: "Case management", href: "/case-management" },
      { label: "Casey", href: "/casey" },
      { label: "Pricing", href: "/case-drafting#pricing" },
    ],
  },
  {
    title: "Who we serve",
    links: [
      { label: "Overview", href: "/who-we-serve" },
      { label: "Solo and small firms", href: "/who-we-serve/solo-and-small-firms" },
      { label: "Growing firms", href: "/who-we-serve/growing-firms" },
      { label: "Large and high-volume", href: "/who-we-serve/large-and-high-volume" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Resource hub", href: "/resources" },
      { label: "Blog", href: "/blog" },
      { label: "Podcast", href: "/podcast" },
      { label: "Case studies", href: "/case-studies" },
      { label: "Sample work", href: "/sample-work" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Our process", href: "/about#process" },
      { label: "Security", href: "/about#security" },
      { label: "Book a call", href: "/book-a-call" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "AI Use Policy", href: "/ai-use-policy" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/* Services and visas                                                  */
/* ------------------------------------------------------------------ */

export const SERVICES = [
  {
    slug: "case-drafting",
    href: "/case-drafting",
    eyebrow: "Service 01",
    title: "Case drafting",
    tagline: "Filing-ready petition packages, drafted from your strategy and in your format.",
    body: "Send us the strategy and the evidence. Our specialist drafters prepare the petition letter, exhibits and supporting documents in your templates and tone — then two reviewers check every citation before it reaches you.",
    price: "From $500 per case",
    points: ["O-1, EB-1A, EB-2 NIW, H-1B, L-1 and E-2", "Your templates, tone and citation style", "Two-step quality review on every package"],
  },
  {
    slug: "case-management",
    href: "/case-management",
    eyebrow: "Service 02",
    title: "Case management",
    tagline: "An experienced case manager working inside your firm — supported by Casey.",
    body: "Your case manager runs intake, collects documents, chases clients, tracks every deadline and keeps you updated — inside your systems, under your name. Casey, the software we built, keeps every case visible.",
    price: "Flat fees, quoted on your first call",
    points: ["Intake, document collection and follow-ups", "Deadlines, RFEs and status updates", "Works in your tools, invisible to your clients"],
  },
] as const;

export type Visa = {
  code: string;
  name: string;
  who: string;
  package: string[];
  turnaround: string;
};

export const VISAS: Visa[] = [
  {
    code: "O-1",
    name: "Individuals with extraordinary ability",
    who: "Founders, researchers, artists and athletes with sustained acclaim.",
    package: ["Petition letter mapped to each criterion", "Exhibit index and formatting", "Expert recommendation letter drafts", "Itinerary and advisory opinion support"],
    turnaround: "First draft in 10–14 business days",
  },
  {
    code: "EB-1A",
    name: "Extraordinary ability green card",
    who: "Self-petitioners at the very top of their field.",
    package: ["Final-merits narrative", "Criteria analysis with evidence mapping", "Recommendation letter drafts", "Exhibit index and table of contents"],
    turnaround: "First draft in 14–21 business days",
  },
  {
    code: "EB-2 NIW",
    name: "National Interest Waiver",
    who: "Professionals whose work has national importance.",
    package: ["Dhanasar prong-by-prong argument", "Proposed endeavor and business plan", "Support letter drafts", "Exhibit index"],
    turnaround: "First draft in 14–21 business days",
  },
  {
    code: "H-1B",
    name: "Specialty occupation",
    who: "Employers sponsoring professionals in specialty roles.",
    package: ["Specialty occupation support letter", "Job duties breakdown", "Degree equivalency coordination", "Exhibit assembly"],
    turnaround: "First draft in 5–7 business days",
  },
  {
    code: "L-1",
    name: "Intracompany transferee",
    who: "Multinationals moving managers and specialized staff.",
    package: ["Qualifying relationship evidence", "Managerial or specialized-knowledge argument", "Org charts and duty descriptions", "New-office business plan (L-1A)"],
    turnaround: "First draft in 7–10 business days",
  },
  {
    code: "E-2",
    name: "Treaty investor",
    who: "Investors building or buying a U.S. business.",
    package: ["Investment and source-of-funds narrative", "Five-year business plan", "Marginality analysis", "Exhibit index"],
    turnaround: "First draft in 10–14 business days",
  },
];

/* ------------------------------------------------------------------ */
/* Process and security                                                */
/* ------------------------------------------------------------------ */

export const PROCESS = [
  {
    step: "01",
    title: "Book a 30-minute call",
    tab: "Book a call",
    body: "Tell us about your firm, your case types and where work piles up. We'll tell you honestly whether we're a fit — and what your first case would cost.",
  },
  {
    step: "02",
    title: "Share your strategy and templates",
    tab: "Share your strategy",
    body: "Send the case strategy, evidence and your house templates. We learn your tone, formatting and citation style before we write a word.",
  },
  {
    step: "03",
    title: "We draft and review in your format",
    tab: "We draft & review",
    body: "A specialist drafter prepares the package. A second reviewer checks every citation, exhibit and deadline. You get a clean, filing-ready draft.",
  },
  {
    step: "04",
    title: "You review, sign and file",
    tab: "You sign & file",
    body: "You keep the strategy, the client and the signature. Request edits, approve, file — and your first case is half price, with a money-back guarantee.",
  },
] as const;

export const SECURITY_POINTS = [
  { title: "No client data in AI tools", body: "We never enter names, A-Numbers, passport details or case evidence into any AI system. AI is used only on public sources like statutes and USCIS policy." },
  { title: "Every citation verified by a person", body: "Every citation and factual reference is checked by a team member against the original source before a draft reaches you." },
  { title: "Role-based, logged access", body: "Files stay in our secure case-management system. Only your assigned team can open them, and access is logged." },
  { title: "Confidentiality agreements", body: "Every team member signs a confidentiality agreement. We operate under GDPR, one of the strictest privacy regimes in the world." },
] as const;

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export type TeamMember = { name: string; role: string; bio: string; group: "Leadership" | "Team leads" | "Case managers" | "Legal writers" };

/** Real team from goodcase.io/about-us. Photos to be supplied by Goodcase (monogram placeholders for now). */
export const TEAM: TeamMember[] = [
  { name: "Piotr Messerszmidt", role: "Co-founder & CEO", group: "Leadership", bio: "Expert in U.S. immigration, legal tech and process optimization. Leads Goodcase with a focus on scalable solutions for legal teams." },
  { name: "Joanna Bobel", role: "Co-founder", group: "Leadership", bio: "Business development and client success, focused on immigration practices." },
  { name: "Monica Prado", role: "Team Lead", group: "Team leads", bio: "Legal expert in U.S. immigration. Manages the legal writing team with a focus on quality and collaboration." },
  { name: "Francesco Cortese", role: "Team Lead", group: "Team leads", bio: "Experienced in O-1, EB-1, EB-2 and other categories. Leads drafting with a focus on precision." },
  { name: "Marta Gronkiewicz", role: "Onboarding Lead", group: "Team leads", bio: "Simplifies complex legal processes for new clients and runs thorough research." },
  { name: "Alicja Kowalczyk", role: "Operations Lead", group: "Team leads", bio: "Leads operational workflows and process improvements across the team." },
  { name: "Sabina Zielinska", role: "Marketing & Business Development", group: "Team leads", bio: "Shapes how Goodcase communicates with the firms it serves." },
  { name: "Barbara Lage", role: "Case Manager & Legal Writer", group: "Case managers", bio: "Researches, strategizes and drafts immigration documents with analytical precision." },
  { name: "Kjara Frroku", role: "Case Manager & Legal Writer", group: "Case managers", bio: "Combines international law and immigration expertise with a structured approach to every case." },
  { name: "Lizy Mary Kurian", role: "Senior Legal Writer", group: "Legal writers", bio: "Drafts visa petitions with precision and a structured approach." },
  { name: "Lana Mugnai", role: "Senior Legal Writer", group: "Legal writers", bio: "Brings international relations and legal writing together in precise, tailored documents." },
  { name: "Natalia Janiec", role: "Legal Writer", group: "Legal writers", bio: "Specializes in O-1A, EB-1A and EB-2 NIW petitions." },
  { name: "Julia Solano", role: "Legal Writer", group: "Legal writers", bio: "Combines case analysis, legal research and persuasive drafting." },
  { name: "Fernanda Riegel", role: "Legal Writer", group: "Legal writers", bio: "Immigration strategy, case analysis and client-focused support." },
  { name: "Brener Leopoldino", role: "Legal Writer", group: "Legal writers", bio: "Documentation and research for complex employment-based visas, including O-1 and EB-2 NIW." },
  { name: "Guilherme Wilbert", role: "Legal Writer", group: "Legal writers", bio: "Drafts EB-2 NIW, O-1A and other petitions with operational excellence." },
];

/* ------------------------------------------------------------------ */
/* Proof                                                               */
/* ------------------------------------------------------------------ */

export type Testimonial = { id: string; quote: string; role: string; place: string; video: string; poster: string; captions: string; duration: string };

/** Quotes are real (published on goodcase.io). Videos are placeholders until Goodcase supplies recordings. */
export const TESTIMONIALS: Testimonial[] = [
  {
    id: "volume",
    quote: "Goodcase helped us quickly handle a large volume of O-1 and EB-1A cases after we started working together. It saved us the stress of hiring, training, and managing new staff, and let us keep our clients happy.",
    role: "Managing Attorney",
    place: "California",
    video: "/media/testimonial-volume.mp4",
    poster: "/media/testimonial-volume.jpg",
    captions: "/media/testimonial-volume.vtt",
    duration: "0:17",
  },
  {
    id: "practical",
    quote: "Everyone talks about AI and automation, but I never had the time or expertise to implement them. Goodcase reviewed my operations and introduced affordable, practical solutions tailored to my small firm.",
    role: "Immigration Attorney",
    place: "Florida",
    video: "/media/testimonial-practical.mp4",
    poster: "/media/testimonial-practical.jpg",
    captions: "/media/testimonial-practical.vtt",
    duration: "0:16",
  },
  {
    id: "different",
    quote: "I've been disappointed with every single paralegal service — or individual paralegal, or even lawyer — I've tried to work with over the last ten years or so. You guys are different, in the best possible way, and I greatly appreciate it.",
    role: "Managing Attorney",
    place: "Florida",
    video: "/media/testimonial-different.mp4",
    poster: "/media/testimonial-different.jpg",
    captions: "/media/testimonial-different.vtt",
    duration: "0:18",
  },
];

/** Client logo row — placeholders until Goodcase confirms names it may show. */
export const CLIENT_LOGO_PLACEHOLDERS = ["Client logo", "Client logo", "Client logo", "Client logo", "Client logo", "Client logo"] as const;

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

export type Faq = { q: string; a: string; topic: "Goodcase" | "Services" | "Pricing" | "Security" | "Working together" };

export const FAQS: Faq[] = [
  { topic: "Goodcase", q: "Are you a law firm?", a: "No. Goodcase is not a law firm and does not give legal advice. We are the back office of U.S. immigration law firms: we prepare petitions and manage cases, while attorneys keep the strategy, the client and the signature." },
  { topic: "Goodcase", q: "Where are you based?", a: "Goodcase is a Polish company based in Warsaw. Our team of around 30 business immigration professionals works across Europe, Latin America and India, serving U.S. law firms." },
  { topic: "Services", q: "Which petitions do you draft?", a: "We draft filing-ready O-1, EB-1A, EB-2 NIW, H-1B, L-1 and E-2 petition packages — the petition letter, exhibit index and supporting documents — from your strategy and in your format." },
  { topic: "Services", q: "How is this different from a virtual assistant agency?", a: "Generalist VA agencies handle admin. We are specialized U.S. immigration paralegals and legal writers. Our team has worked more than 1,000 cases and understands USCIS requirements, priority dates and how an immigration firm actually runs." },
  { topic: "Pricing", q: "How much does it cost?", a: "Flat fees per case, starting at $500, with no minimum volume. Your first case is half price and covered by a money-back guarantee. We confirm the exact fee for your case type on the first call." },
  { topic: "Pricing", q: "Is there a long-term commitment?", a: "No. There are no monthly minimums and no long-term contracts. You can scale our involvement up or down with your caseload." },
  { topic: "Security", q: "How do you keep client information confidential?", a: "Files stay in our secure case-management system with role-based, logged access. Every team member signs a confidentiality agreement, and we operate under GDPR." },
  { topic: "Security", q: "Do you use AI on my clients' cases?", a: "Never with client data. We do not enter personal information or case evidence into any AI tool. AI is used only to organize public sources such as statutes and USCIS policy, and every citation is verified by a person. Read our AI Use Policy for details." },
  { topic: "Working together", q: "How quickly can you start?", a: "Most firms are onboarded within a week of the first call. For urgent overflow, our team can step in within 24 hours." },
  { topic: "Working together", q: "Will my clients know you're involved?", a: "Only if you want them to. We work in your templates, tone and tools. You review, sign and file — the relationship stays yours." },
];

/* ------------------------------------------------------------------ */
/* Who we serve                                                        */
/* ------------------------------------------------------------------ */

export type Segment = {
  slug: string;
  name: string;
  short: string;
  headline: string;
  muted: string;
  intro: string;
  pains: { title: string; body: string }[];
  how: { title: string; body: string }[];
  recommended: string;
  example: string;
};

export const SEGMENTS: Segment[] = [
  {
    slug: "solo-and-small-firms",
    name: "Solo and small firms",
    short: "Take on more cases without hiring.",
    headline: "Say yes to the next case.",
    muted: "Without hiring a paralegal.",
    intro: "You built your practice on your judgment. Goodcase drafts the petitions so your evenings stop disappearing into formatting and exhibit lists.",
    pains: [
      { title: "Your evenings go to formatting", body: "Exhibit indexes and cover letters eat the hours you should spend with clients." },
      { title: "Hiring is a big bet", body: "A full-time paralegal is a fixed cost when your caseload goes up and down." },
      { title: "You're turning work away", body: "Good cases arrive when you have no capacity left to do them well." },
    ],
    how: [
      { title: "Case by case", body: "Send one petition at a time. No minimum volume, no retainer." },
      { title: "Your voice", body: "We learn your templates and tone so drafts read like you wrote them." },
      { title: "Half-price first case", body: "Try us on a real case with a money-back guarantee." },
    ],
    recommended: "Case drafting, case by case",
    example: "A solo O-1 practice sends two petitions a month and keeps every evening free.",
  },
  {
    slug: "growing-firms",
    name: "Growing firms",
    short: "Flexible capacity as volume climbs.",
    headline: "Grow your caseload.",
    muted: "Not your overhead.",
    intro: "When volume climbs faster than you can hire, Goodcase gives you a drafting team and a case manager who already know immigration — ready within a week.",
    pains: [
      { title: "Spikes you can't staff for", body: "A batch of RFEs or a busy quarter shouldn't mean overtime for everyone." },
      { title: "Training takes months", body: "New hires need time before they can draft an EB-1A on their own." },
      { title: "Process lives in people's heads", body: "Growth exposes every workflow that was never written down." },
    ],
    how: [
      { title: "Flexible capacity", body: "Blend drafting support with a case manager and adjust each month." },
      { title: "Documented workflows", body: "We write down your process as we learn it, so it survives growth." },
      { title: "One point of contact", body: "A team lead who knows your firm, your attorneys and your standards." },
    ],
    recommended: "Case drafting + a case manager",
    example: "A five-attorney firm absorbs a 40% busier quarter without adding headcount.",
  },
  {
    slug: "large-and-high-volume",
    name: "Large and high-volume",
    short: "Dedicated teams and reporting.",
    headline: "Volume, consistency,",
    muted: "and a team that scales with you.",
    intro: "High-volume practices need predictable throughput. Goodcase provides dedicated drafting pods, case managers embedded in your workflow and reporting through Casey.",
    pains: [
      { title: "Consistency at scale", body: "Hundreds of petitions need one standard, not twenty interpretations of it." },
      { title: "Visibility", body: "Partners need to see status, deadlines and bottlenecks without chasing people." },
      { title: "Vendor risk", body: "You need confidentiality, audit trails and a partner who won't disappear." },
    ],
    how: [
      { title: "Dedicated pods", body: "A stable drafting team per practice area, trained on your templates." },
      { title: "Casey reporting", body: "Throughput, turnaround and deadline status across every matter." },
      { title: "Security by default", body: "Role-based access, logged activity, NDAs and a written AI policy." },
    ],
    recommended: "Dedicated pod + case management + Casey",
    example: "A high-volume H-1B and L-1 practice runs cap season with one embedded pod.",
  },
];

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

export type Post = { slug: string; title: string; excerpt: string; category: "Pricing & operations" | "Scaling your firm" | "AI & security" | "Practice management"; tags: string[]; date: string; readMins: number; author: string };

/** Real article titles and excerpts from goodcase.io/blog (bodies migrate from the current site). */
export const POSTS: Post[] = [
  { slug: "paralegal-outsourcing-cost-vs-in-house", title: "Paralegal Outsourcing Cost vs. Hiring In-House: 2026 Pricing Guide for Immigration Firms", excerpt: "A senior in-house paralegal in New York costs a firm about $2,920 per O-1 case. Outsourcing the same case to a specialized provider costs about $1,000. Here's where the $1,920 gap comes from.", category: "Pricing & operations", tags: ["Pricing", "Outsourcing", "O-1"], date: "2026-10-06", readMins: 9, author: "Piotr Messerszmidt" },
  { slug: "on-demand-paralegal-services-scaling-guide", title: "On-Demand Paralegal Services for Immigration Law Firms: The Ultimate Scaling Guide", excerpt: "A batch of RFEs lands at once. A policy change sends clients looking for answers. The same small team is still expected to hit every deadline. This is where on-demand support puts you ahead.", category: "Scaling your firm", tags: ["Scaling", "Capacity", "RFEs"], date: "2026-09-22", readMins: 8, author: "Sabina Zielinska" },
  { slug: "support-stack-immigration-practice", title: "What I'd Tell a Friend Building Their Support Stack in Immigration Practice", excerpt: "Design case management software and paralegal support as one system. Software carries the repeatable work; paralegals carry interpretation; strategy and the signature stay with the attorney.", category: "Practice management", tags: ["Case management", "Software", "Workflow"], date: "2026-09-08", readMins: 7, author: "Piotr Messerszmidt" },
  { slug: "outsourcing-business-visa-drafting", title: "The Reality of Outsourcing Business Visa Drafting: What Immigration Attorneys Need to Know", excerpt: "Somewhere between the intake call and the filing deadline, a chunk of your week disappears into work that doesn't need your legal expertise. Here's what outsourcing it actually looks like.", category: "Scaling your firm", tags: ["Outsourcing", "Drafting"], date: "2026-08-25", readMins: 8, author: "Monica Prado" },
  { slug: "ai-for-immigration-lawyers-safely", title: "AI for Immigration Lawyers: How to Use It Safely Without Compromising Your Client — or Your License", excerpt: "A practical, defensible framework for AI in immigration law: where it belongs in your workflow, where it doesn't, and how to protect client confidentiality.", category: "AI & security", tags: ["AI", "Ethics", "Confidentiality"], date: "2026-08-11", readMins: 10, author: "Piotr Messerszmidt" },
  { slug: "is-your-practice-built-to-scale", title: "Is Your Immigration Practice Actually Built to Scale?", excerpt: "New strategies, processes and tools only work if the firm changes how it operates. Here's what forward-thinking immigration firms are doing about it.", category: "Practice management", tags: ["Operations", "Change management"], date: "2026-07-28", readMins: 6, author: "Alicja Kowalczyk" },
  { slug: "signs-ready-for-dedicated-paralegal-team", title: "5 Signs Your Immigration Firm Is Ready for a Dedicated Paralegal Team", excerpt: "If three or more of these apply to your firm, another attorney hire won't fix the underlying problem. A dedicated paralegal team with clear scope will.", category: "Scaling your firm", tags: ["Hiring", "Paralegals"], date: "2026-07-14", readMins: 5, author: "Marta Gronkiewicz" },
  { slug: "output-verification-ai-tools", title: "Cybersecurity: Output Verification in AI Tools for Legal Teams", excerpt: "AI drafting tools are fast. This guide explains what output verification means in practice, why it's non-negotiable, and how to build a workflow that protects your clients and your license.", category: "AI & security", tags: ["AI", "Verification", "Security"], date: "2026-06-30", readMins: 9, author: "Francesco Cortese" },
];

export type Episode = { slug: string; number: number; title: string; summary: string; hosts: string[]; duration: string; date: string; sample?: boolean };

export const EPISODES: Episode[] = [
  { slug: "attorneys-as-seen-by-paralegals", number: 1, title: "Attorneys as Seen by Paralegals", summary: "The immigration attorneys you picture from TV and the ones who actually do this work are two very different people. Piotr and Sabina pull back the curtain on the people behind the petitions — and the paralegals who make their practices run.", hosts: ["Piotr Messerszmidt", "Sabina Zielinska"], duration: "38 min", date: "2026-09-15" },
  { slug: "anatomy-of-an-o1-petition", number: 2, title: "The Anatomy of an O-1 Petition", summary: "From the first evidence dump to a filing-ready package: how criteria mapping, exhibits and recommendation letters come together.", hosts: ["Francesco Cortese", "Sabina Zielinska"], duration: "42 min", date: "2026-10-06", sample: true },
  { slug: "rfe-season-without-overtime", number: 3, title: "RFE Season Without Overtime", summary: "What happens inside a firm when twenty RFEs land in the same week — and how to plan capacity before they do.", hosts: ["Monica Prado", "Piotr Messerszmidt"], duration: "35 min", date: "2026-10-27", sample: true },
];

export type SampleWork = { slug: string; title: string; visa: string; summary: string; format: string };

/** Real sample-work items from goodcase.io/examples-of-docs. */
export const SAMPLE_WORK: SampleWork[] = [
  { slug: "o1a-exhibits-format", title: "Exhibits Format for Form I-129 / O-1A", visa: "O-1A", format: "Exhibit index", summary: "For an O-1A, Form I-129 is the core document, but the exhibit package proves the case. Officers spend only minutes on a first read, so exhibits must be logical, navigable and mapped to the criteria." },
  { slug: "eb2-niw-business-plan", title: "Sample EB-2 NIW Business Plan", visa: "EB-2 NIW", format: "Business plan", summary: "A business plan is a roadmap for USCIS, showing the applicant's ability to advance a proposed endeavor of national importance — without a job offer." },
  { slug: "o1a-recommendation-letter", title: "Letter of Recommendation for O-1A", visa: "O-1A", format: "Recommendation letter", summary: "A formal testimonial from a recognized expert that translates technical accomplishments into a narrative proving the beneficiary is at the very top of the field." },
  { slug: "o1-petition-brief", title: "Sample O-1 Petition Brief", visa: "O-1", format: "Legal brief", summary: "Exhibits provide the proof; the brief provides the argument — explaining to a USCIS officer exactly why the beneficiary meets the legal definition of extraordinary." },
];

export type CaseStudy = { slug: string; title: string; firm: string; segment: string; challenge: string; result: string; metrics: { value: string; label: string }[]; illustrative: true };

/** Illustrative case studies — Goodcase will supply real, approved stories. */
export const CASE_STUDIES: CaseStudy[] = [
  { slug: "solo-o1-backlog", title: "Clearing an O-1 backlog without a new hire", firm: "Solo practice, California", segment: "Solo and small firms", challenge: "Twelve O-1 and EB-1A petitions waiting on drafts, and no capacity to hire.", result: "Goodcase drafted in the attorney's templates while she kept strategy and client calls.", metrics: [{ value: "12", label: "petitions cleared" }, { value: "6 wks", label: "to an empty backlog" }, { value: "0", label: "new hires" }], illustrative: true },
  { slug: "growing-firm-capacity", title: "A busier quarter with the same team", firm: "Five-attorney firm, Florida", segment: "Growing firms", challenge: "Volume climbed faster than the firm could recruit and train paralegals.", result: "A drafting team plus an embedded case manager absorbed the spike month to month.", metrics: [{ value: "+40%", label: "cases filed" }, { value: "1 week", label: "to onboard" }, { value: "Monthly", label: "flexible scope" }], illustrative: true },
  { slug: "high-volume-cap-season", title: "Running cap season with an embedded pod", firm: "High-volume practice, New York", segment: "Large and high-volume", challenge: "H-1B and L-1 volume needed one consistent standard across many attorneys.", result: "A dedicated pod drafted to the firm's templates, with status reported in Casey.", metrics: [{ value: "1", label: "dedicated pod" }, { value: "Daily", label: "status in Casey" }, { value: "2-step", label: "quality review" }], illustrative: true },
];
