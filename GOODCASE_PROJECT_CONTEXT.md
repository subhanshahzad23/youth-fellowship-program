# Goodcase redesign — project context

> **Read this first in any new session.** This is the single source of truth for the Goodcase demo: the client brief, the user's decisions, the content we captured, the architecture plan and progress. Update the **Progress log** at the bottom whenever work moves forward. The detailed build plan is in `GOODCASE_BUILD_PLAN.md`.

## 1. What this repository is now

- The repo previously held the **Launchpad Fellowship** demo, a fictional 18-month youth fellowship with applicant, fellow, staff and admin portals. On 2026-10-16 the user asked to **overwrite it** with a **Goodcase website redesign** demo. Launchpad is no longer needed.
- The goal is to **win the Goodcase redesign job**. The demo shows **Part B (website design)** of their RFP as a working Next.js site.
- **Stack:** pure Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4, Motion, GSAP + ScrollTrigger, Radix (`radix-ui`), Lucide, Zustand (only for simulated form/booking state). There is no backend. The 3D section uses three.js via React Three Fiber.
- **Launchpad is preserved on the `launchpad` branch** (created 2026-10-16 at commit `6c7e8ee`, the complete Launchpad demo, 375 files). The user asked to keep it intact for later use: `git checkout launchpad`. Never rebase or delete that branch. Push it together with `main` once a remote exists.
- **Repo path:** `/Users/shyzii/Documents/Projects/youth fellowship program`. The branch is `main`.
  - **Remote:** `origin` = https://github.com/subhanshahzad23/youth-fellowship-program (HTTPS, credentials in the macOS keychain; no `gh` CLI). Vercel auto-deploys `main` to production: https://youth-fellowship-program.vercel.app
- **Read `AGENTS.md`.** This Next.js version has breaking changes. Docs are in `node_modules/next/dist/docs/`. Route `params` and `searchParams` are Promises, and `useSearchParams` needs a `<Suspense>` wrapper.

## 2. The user's instructions (2026-10-16)

1. Scope right now is **Part B, design**, covering the **Main group pages** in the brief: **Home, Case drafting, Case management, About (incl. our process and security), Book a call**. Secondary groups may get lighter pages so that nav and footer links are never broken.
2. **Keep the Launchpad visual theme.** The user likes it: black dotted hero, floating white rounded nav, Newsreader light serif display, DM Sans UI, jade `#00c27a` accent, mint arrow box on buttons, flat surfaces, 24px panels.
3. Take facts and content from the **RFP document** and the **live site** (goodcase.io).
4. **Overwrite** the Launchpad demo and **push to main**.
5. Add a **Legora-style 3D section** on the homepage: a scroll-driven, pinned isometric stack of glass layers (details in §6).
6. Install `node_modules`, run, validate (build, lint, Playwright) and push. End with an "all done" message so the user can review it live.
7. "Give your best — win this job at all cost."
8. **Context preservation:** keep the MD files in the repo root (`GOODCASE_PROJECT_CONTEXT.md`, `GOODCASE_BUILD_PLAN.md`) updated so nothing is lost when context is summarized.

## 3. The client brief (RFP) — essentials

The full extracted text is in `docs/source/goodcase-brief.md`.

**About Goodcase**
- Goodcase is the **back office of U.S. immigration law firms**. It prepares petitions and manages cases. **Attorneys keep the strategy, the client and the signature.**
- **Not a law firm. Does not give legal advice.**

**Two services**
- **Case drafting:** filing-ready **O-1, EB-1A, EB-2 NIW, H-1B, L-1, E-2** petition packages, drafted from the attorney's strategy and in their format.
- **Case management:** an experienced case manager working inside the client's firm, supported by **Casey**, the case management software Goodcase built. Casey has its own product site.

**Who they serve, team and pricing**
- Clients are U.S. immigration law firms of every size, from solo attorneys to high-volume practices.
- About **30 business immigration professionals** across **Europe, Latin America and India**, with **more than 1,000 cases** worked for U.S. law firms.
- **Pricing:** flat fees per case **from $500**, **no minimum volume**, **first case at half price**, **money-back guarantee**.
- **Buyers:** U.S. immigration attorneys. They are detail-oriented and risk-averse, judge whether a vendor looks trustworthy enough to touch their clients' files, and have mostly never heard of Goodcase.

**Goals and visual direction**
- Look as professional as premium legal brands, but feel approachable enough that a solo attorney books a call. Goodcase is the more affordable alternative.
- Professional and clean: quiet, confident, legal tone, generous white space, strong typography, restrained colour. No startup template or stock-photo look.
- Accessible, not exclusive: warmer and more human, with real people, plain language and **prices shown openly**.
- **Human behind every process.** The main message is that a specialized team stands behind every petition.
- **Built to convert.** Every page leads to **book a 30-minute call**. **The first-case offer appears under every hero and above every closing button.**
- **References:** harvey.ai, legora.com and manifestlaw.com. They don't want a copy; they want to know what we'd take and what we'd change.
- They are open to a refreshed logo, palette and typography. This is a small rebrand, not a new name.

**Website pages (Part B)**

| Group | Pages |
|---|---|
| Main | Home, Case drafting, Case management, About (incl. process and security), Book a call |
| Who we serve | Overview, Solo and small firms, Growing firms, Large and high-volume |
| Resources | Hub, Blog list + article, Podcast list + episode, Case studies list + detail, Sample work list + detail, FAQ |
| Other | Casey (short handoff page), AI Use Policy, Privacy Policy |

**Required components**
- A header with **two dropdown menus**.
- A footer with **newsletter signup**.
- A **fact strip**.
- **Service cards**.
- A **four-step process**.
- An **ROI calculator**.
- **Video testimonials**.
- A **client logo row**.
- A **booking calendar embed**.
- A **contact form**.
- A reusable design system. In Figma for the real job; our demo shows it in code.

**Timeline**
- Brand direction: Nov 2–13. Design: Nov 16–Dec 4. Optional development: Dec 7–18. Launch target Dec 18; hard deadline **Dec 31, 2026**.
- Scoring is **70% price**, 20% similar experience, 10% communication and timeline. Pricing is quoted in EUR or PLN. They work in CET, in English.

## 4. Live-site content we can reuse

Raw text dumps are in `docs/source/goodcase-live/*.txt`.

**Company and legal details**
- Goodcase.io Sp. z o.o., al. Jana Pawła II 27, 00-867 Warsaw, Poland. KRS 0001060361, NIP 5273076826, REGON 526474334.
- Email info@goodcase.io. "We usually respond within 24 hours."
- **Current brand:** indigo `rgb(61,77,204)` buttons, Instrument Sans, a "G" logo mark. We are **replacing the look with the Launchpad theme**.
- **Footer disclaimer, to keep:** "Goodcase is a private company that provides services in support of immigration documents preparation by qualified attorneys. The information provided in this site is not legal advice… Goodcase is not a law firm and does not provide legal advice."

**Stats on the live site**
- The live site shows 1000+ cases supported, 40% faster turnaround, 95% approval rate and 100% client retention.
- **Use the RFP facts first:** 1,000+ cases, ~30 people, 3 regions, from $500, first case half price, money-back guarantee. The 95% / 40% / 100% figures are only on the live site, so use them sparingly or not at all.

**Testimonials (real, from the live site; attributed by role and state only)**
1. "Goodcase helped us quickly handle a large volume of O-1 and EB-1A cases after we started working together. It saved us the stress of hiring, training, and managing new staff, and let us keep our clients happy." — Managing Attorney, California
2. "Everyone talks about AI and automation, but I never had the time or expertise to implement them. Goodcase reviewed my operations and introduced affordable, practical solutions tailored to my small firm." — Immigration Attorney, Florida
3. "I've been disappointed with every single paralegal service (or individual paralegal or even lawyer) who I've tried to work with over the last 10 years or so. You guys are different, in the best possible way, and I greatly appreciate it." — Managing Attorney, Florida

**Team, from /about-us (real names and roles)**
- Piotr Messerszmidt (Co-founder & CEO)
- Joanna Bobel (Co-founder)
- Monica Prado (Team Lead)
- Francesco Cortese (Team Lead — O-1, EB-1, EB-2)
- Marta Gronkiewicz (Onboarding Lead)
- Alicja Kowalczyk (Operations Lead)
- Sabina Zielinska (Marketing & Business Development Manager)
- Barbara Lage (Case Manager & Legal Writer)
- Kjara Frroku (Case Manager & Legal Writer)
- Lizy Mary Kurian (Senior Legal Writer)
- Lana Mugnai (Senior Legal Writer)
- Natalia Janiec (Legal Writer)
- Julia Solano (Legal Writer)
- Fernanda Riegel (Legal Writer)
- Brener Leopoldino (Legal Writer)
- Guilherme Wilbert (Legal Writer)
- **We have no photos.** Use tasteful monogram portraits and note "team portrait" placeholders.

**Positioning lines from the live site**
- "Our process is built on collaboration, not outsourcing. You stay in the driver's seat." "We learn your templates, tone, and preferences." "We're your backstage team — invisible when things run perfectly, always there when you need us."

**FAQ, from the live site (adapt to the two-service positioning)**
- Not a law firm.
- Based in Poland, with the team across the U.S., Europe, South America and Asia.
- Different from VA agencies: specialized immigration paralegals, 1,000+ cases.
- Human-in-the-loop AI.
- Confidentiality: encryption, access control, NDAs, audits, GDPR.
- Month-to-month, no long-term commitment.
- Onboarding starts with a 30-minute call.

**FlexParalegal page**
- From $500 per case, no monthly minimums, ready to step in **within 24 hours**, end-to-end submission support, immigration-only focus.
- Its four steps: tell us what you need → we match your paralegal team → work begins within 24h → …

**AI Use Policy (live site, strong content for Security and the AI page)**
- Humans prepare every document. **No client PII is ever entered into AI tools.** Documents stay inside the secure case-management system.
- AI is used only on public, non-confidential sources (statutes, the USCIS policy manual, AAO decisions). It is a research and organization tool, not an author.
- Every citation is human-verified. Access is role-based and logged, with data isolation and vendor standards.

**Blog posts (real titles, for Resources)**
- "Paralegal Outsourcing Cost vs. Hiring In-House: 2026 Pricing Guide for Immigration Firms". In-house costs about **$2,920 per O-1 case** vs about **$1,000 outsourced**, a gap of $1,920 per case.
- "On Demand Paralegal Services for Immigration Law Firms: The Ultimate Scaling Guide"
- "#01 – Attorneys as Seen by Paralegals | Why Immigration Law Podcast" (Piotr and Sabina). **Podcast: "Why Immigration Law".**
- "What I'd Tell a Friend Building Their Support Stack in Immigration Practice"
- "The Reality of Outsourcing Business Visa Drafting…"
- "AI for Immigration Lawyers: How to Use It Safely…"
- "Is Your Immigration Practice Actually Built to Scale?"
- "5 Signs Your Immigration Firm Is Ready for a Dedicated Paralegal Team"
- "Cybersecurity: Output Verification in AI Tools for Legal Teams"

**Sample work (/examples-of-docs)**
- Exhibits Format for Form I-129 / O-1A Visa
- Sample EB-2 NIW Business Plan
- Letter of Recommendation for O-1A Visa
- Sample O-1 Petition Brief

## 5. Reference sites — what we take and what we change

- **Harvey (harvey.ai):** off-white background, a classic serif headline ("Build a Frontier Legal Organization"), black pill CTA, product UI shown in a framed panel. *Take:* restraint and product-in-frame. *Change:* their "enterprise only" signal becomes open pricing and named people.
- **Legora (legora.com):** green announcement bar, centered wordmark, cinematic city photo, and the **3D aOS layer stack** (§6). *Take:* the interactive 3D storytelling. *Change:* their abstract "operating system" story becomes a human, concrete one — who does what in a petition.
- **Manifest Law (manifestlaw.com):** cream background, italic serif wordmark, stats row with thin dividers. *Take:* stats strip and warmth. *Change:* they are a law firm; Goodcase must say clearly that it is not one.

## 6. The Legora 3D section (inspiration) → the Goodcase version

**What Legora does.** Reference screenshots are in `docs/reference-legora/aos-*.png`; the capture script is `scripts/legora-audit.mjs`.
- The section is **pinned** under the heading "Introducing the Legora aOS™".
- Scrolling builds an **isometric stack of frosted-glass rounded plates** on a light grey studio background with a soft floor shadow.
- Each scroll step adds a plate on top. Its **label is printed in italic on the plate** ("Large Language Models", "Data & Integrations"…).
- On the **left** is a vertical list of dark-grey pills with "+" icons: LLMs, Agentic Harness, Data & Integrations, Context & Knowledge, Legal Capabilities, Products & Interfaces, Security & Governance. **The active pill expands into a card with a description.**
- At the end the top plate **breaks into small tiles**: Editor, Portal, Lists, Playbooks, Tabular Review, Word Add-in, Outlook Add-in…
- A **progress bar** sits bottom-left. There's no `<canvas>` in the DOM at rest; it is probably a video or image sequence.

**Goodcase version: "How a Goodcase petition is built"**
- Real three.js glass plates (React Three Fiber, `MeshPhysicalMaterial` with transmission), scroll-driven through GSAP ScrollTrigger.
- Bottom to top, the layers are:
  1. **Your strategy & signature** (the attorney's layer — always theirs)
  2. **Intake & evidence**
  3. **Specialist drafting team**
  4. **Two-step quality review**
  5. **Casey — case management**
  6. **Your dedicated case manager**
  7. **Filing-ready package**. The top plate splits into tiles: O-1 · EB-1A · EB-2 NIW · H-1B · L-1 · E-2.
- **Left:** an accordion list in the Launchpad style; the active item expands.
- **Fallbacks:** reduced motion, no WebGL or mobile get a static or CSS fallback.

## 7. Theme carried over from Launchpad (keep)

- **Tokens** live in `src/app/globals.css`: `--void #000`, `--paper #fff`, `--jade #00c27a`, `--mint #b4f5c8`, `--forest #00843f`, `--leaf #d5f8e0`, `--leaf-ink #007b3b`, `--fog #f3f3f3`, `--ash #eee`, `--line #dce1e5`, `--muted-display #8c8c8c`, `--muted-text #626262`. Radii are 8 / 16 / 24 / 26. Easing is `cubic-bezier(0.23,1,0.32,1)`.
- **Display classes:** `.display-hero`, `.display-xl`, `.display-lg`, `.display-md`, `.display-sm`, `.eyebrow`, `.dots-dark`, `.dots-light`, `.dots-mint`, `.container-page`, `.line-mask` (hero reveal), `.rise-in`, `.spectrum-ring`.
- **Components to keep and reuse:**
  - `src/components/ui/*`: Button/ButtonLink with the arrow box, form controls, display (Panel, Badge, Stat…), overlay (Dialog, Accordion, Tabs, Popover, Segmented, Sheet), table, rich-text.
  - `src/components/site/*`: site-nav with the floating bar, dropdowns, mobile menu and the Apply popover pattern; site-footer with the giant wordmark; reveal; public-shell.
  - `src/components/site/home/*`: the hero, workspace showcase, journey (sticky tabs + GSAP), facts, explainer, tracks, safeguarding (inset black card), dates, stories carousel and faq-cta (mint dotted CTA). These are re-skinned for Goodcase.
- **Mural audit docs** (`docs/reference-audit.md`, `docs/reference/`) document where the theme came from. Keep them.

## 8. Progress log

- **2026-10-16:**
  - Read the RFP and inspected goodcase.io, harvey.ai, legora.com and manifestlaw.com.
  - Captured the Legora 3D section and dumped the live-site text.
  - Ran `npm install` (node_modules had been deleted) and Playwright `install chromium`.
  - The user confirmed the scope (§2).
  - Next: execute `GOODCASE_BUILD_PLAN.md`.
- **2026-10-16 (later):** At the user's request, created the `launchpad` branch at `6c7e8ee` to keep the Launchpad demo intact. Verified it is identical to the backup in `/private/tmp/launchpad-src`. Built the Goodcase foundation: logo, favicon, layout metadata, nav with 2 dropdowns, footer with newsletter, concept pill, offer line, error and 404 pages. Shared sections are in `src/components/gc/`: section, facts, logos, services, security, faq, final-cta, team, roi.
- **2026-10-16 (build):**
  - **Main pages are built and verified in the browser:** `/`, `/case-drafting`, `/case-management`, `/about`, `/book-a-call` and `/design-system`.
  - **Home 3D section:** `src/components/gc/home/petition-stack.tsx` holds the layout, scroll handling and CSS fallback; `petition-stack-scene.tsx` holds the R3F glass plates. Layer data is in `layers.ts`.
    - Desktop with WebGL gets a 640vh pinned section. Phones, reduced motion and no-WebGL get a CSS isometric stack.
    - Plate labels are drawn on canvas textures from the page fonts, so no font downloads are needed.
    - Materials live in refs, which keeps the React Compiler lint rule (`react-hooks/immutability`) happy.
  - **Shared sections** are in `src/components/gc/`: offer, section, facts, logos, services, process (`ProcessJourney`, `ProcessList`, `ProcessRow`), roi, testimonials (`VideoTestimonials`, `FeaturedTestimonial`), team, security, faq, final-cta, pricing, contact-form and booking.
    - The booking widget is simulated. It handles time zones, produces a real `.ics` file and a Google Calendar link, and stores state in `useLeads`.
  - **Assets:** `npm run assets` (`scripts/generate-gc-assets.ts`) generates the testimonial placeholder videos (mp4, jpg and vtt in `public/media/`) and `src/app/opengraph-image.png`.
  - **Tests and tooling:**
    - Tests live in `tests/e2e/{site,forms,routes}.spec.ts`.
    - The route sweep is `scripts/route-sweep.mjs <out> <width> [--full]`; set `ONLY=/a,/b` to limit routes.
    - In dev, if a newly added route returns 404 because a Link prefetched it before it existed, rename its folder back and forth to re-register it.
  - **Secondary pages** were delegated to two background agents: Who we serve, Casey and the policies to one; Resources (blog, podcast, case studies, sample work, FAQ) to the other.
- **2026-10-16 (delivered):**
  - **Secondary pages are done** (from the two agents):
    - Who we serve: overview and 3 segment pages. Content picks are in `src/lib/content/who-we-serve.ts`.
    - Casey, plus the AI Use and Privacy policies. Policy text is in `src/lib/content/policies.ts`, rendered by `src/components/gc/policy*.tsx`.
    - Resources: hub, blog with filter and article pages (the first article has a full body), podcast with sample episodes labelled, case studies labelled illustrative, sample work with watermarked HTML previews, and FAQ. Content is in `src/lib/content/{articles,resources}.ts`; components are in `src/components/resources/`.
  - **Validation:** lint clean, build OK (41 pages), Playwright 94/94.
  - **Screenshots:** `scripts/feature-shots.mjs` writes `docs/screenshots/features`.
  - **Commit:** committed to `main`. Pushing is blocked: there is no git remote and no `gh` CLI. Push both `main` and `launchpad` once the user provides a remote URL.
- **2026-10-16 (pushed):** Added the `origin` remote (the existing GitHub repo `subhanshahzad23/youth-fellowship-program`, whose `main` was at `6c7e8ee`). Pushed `main` (`2025d1e`, fast-forward) and `launchpad`. The Vercel production deploy succeeded and https://youth-fellowship-program.vercel.app serves the Goodcase site.
