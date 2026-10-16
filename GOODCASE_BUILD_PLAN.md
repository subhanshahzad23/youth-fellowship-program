# Goodcase redesign — build plan and checklist

Companion to `GOODCASE_PROJECT_CONTEXT.md`. Tick items as they land, and add notes under **Decisions & notes**.

## Site map (routes)

| Group | Route | Owner | Status |
|---|---|---|---|
| Main | `/` Home | lead (done) | ☑ |
| Main | `/case-drafting` | agent A | ☑ |
| Main | `/case-management` | agent A | ☑ |
| Main | `/about` (sections `#process`, `#security`, `#team`) | agent B | ☑ |
| Main | `/book-a-call` (booking calendar + contact form) | agent B | ☑ |
| Who we serve | `/who-we-serve`, `/who-we-serve/solo-and-small-firms`, `/who-we-serve/growing-firms`, `/who-we-serve/large-and-high-volume` | agent C | ☑ |
| Resources | `/resources`, `/blog`, `/blog/[slug]`, `/podcast`, `/podcast/[slug]`, `/case-studies`, `/case-studies/[slug]`, `/sample-work`, `/sample-work/[slug]`, `/faq` | agent D | ☑ |
| Other | `/casey`, `/ai-use-policy`, `/privacy-policy` | agent A (Casey), agent B (policies) | ☑ |
| Pitch extra | `/design-system` (tokens and components, standing in for the Figma design system) | lead | ☑ |
| Global | `not-found`, `error` | lead | ☑ |

## Global components

- **Header with two dropdowns:**
  - Services ▾ → Case drafting, Case management, Casey.
  - Who we serve ▾ → Overview, Solo and small firms, Growing firms, Large and high-volume.
  - Plain links: About, Resources.
  - CTA: **Book a call** (jade, arrow box).
  - Mobile menu with accordion groups.
  - The CTA turns black after the hero (Launchpad behaviour).
- **Footer:**
  - Newsletter signup ("Modern Immigration Practice Newsletter") with real validation and a simulated success state.
  - Link columns.
  - The legal disclaimer (not a law firm), company details (KRS/NIP/REGON) and a giant Goodcase wordmark.
- **Offer line** (`<FirstCaseOffer/>`): "First case at half price · Money-back guarantee · No minimum volume · Flat fees from $500". It goes **under every hero** and **above every closing CTA button** (brief requirement).
- **Concept pill** (replaces the Launchpad DemoControl):
  - Bottom-left: "Design concept · Goodcase".
  - Opens a panel with the page index across all groups, plus "No data is sent; forms are simulated".
- **Shared sections** (`src/components/gc/*`):
  - fact strip, client logo row (placeholder wordmarks, labelled)
  - service cards, four-step process, ROI calculator
  - video testimonials (carousel plus a modal player)
  - team grid (monogram portraits), security card
  - pricing block, FAQ block, final CTA (mint dotted), contact form, booking widget
  - page hero (black dotted), section header

## Home (`/`) section order

1. **Hero (black dotted).**
   - Headline: muted "The back office for U.S. immigration law firms." over white "Filing-ready petitions. Your strategy, your signature."
   - Supporting copy, then "Book a 30-minute call" and "See sample work".
   - The **offer line** sits underneath.
2. **Overlapping case workspace** (adapted from the Launchpad workspace showcase).
   - A selector card asks "What kind of practice do you run?" with four tiles: Solo practice · Small firm · Growing firm · High-volume.
   - The canvas board and copy change per tile.
   - The board shows a petition package: exhibit index, criteria mapping notes, an attorney comment, the drafter / case manager / attorney roles as cursors, deadlines and a Casey status.
   - CTA: "See how we work with firms like yours" → the matching who-we-serve page.
3. **Fact strip:** 1,000+ cases · ~30 specialists · from $500 per case · 3 regions (Europe, Latin America, India).
4. **Client logo row:** placeholder wordmarks with a caption.
5. **Two service cards:** Case drafting / Case management (+ Casey), with prices shown openly.
6. **3D section "How a Goodcase petition is built":** pinned, scroll-driven glass layer stack (three.js); see context §6.
7. **Four-step process:** sticky tabs plus a preview, reusing the Launchpad journey.
   - The steps: Book a call → Share your strategy and templates → We draft and review in your format → You review, sign and file.
8. **ROI calculator.**
   - Inputs: cases per month, in-house hours per case, loaded hourly cost, attorney review hours and attorney rate, Goodcase fee per case (default $500, editable).
   - Outputs: monthly and annual savings, hours returned, first-case discount applied.
   - Assumptions are shown and labelled "illustrative".
9. **Video testimonials:** the three real live-site quotes, as video cards with placeholder generated videos and captions.
10. **"A specialized team behind every petition":** team grid preview plus a link to About.
11. **Security / confidentiality inset black card:** no PII in AI tools, human-verified citations, role-based access, NDAs, GDPR, the "not a law firm" note.
12. **FAQ, then the final CTA (mint dotted) with the offer line above the button.**

## Case drafting (`/case-drafting`)

- **Hero:** "Filing-ready petitions, drafted your way", followed by the offer line.
- **What's in a filing-ready package:** petition letter / legal brief, exhibit index and formatting, recommendation letter drafts, forms prep support, business plan (NIW / E-2) where relevant.
- **Six visa cards:** O-1, EB-1A, EB-2 NIW, H-1B, L-1, E-2, each with what we draft and a typical turnaround.
- **Your strategy, your format:** we learn your templates, tone and citation style; the attorney keeps strategy, client and signature.
- **Process and quality review** (two-step review), sample work links, pricing (from $500, first case half price, money-back guarantee).
- **Close:** ROI calculator (compact), a testimonial, FAQ, then the final CTA.

## Case management (`/case-management`)

- **Hero:** "A case manager inside your firm, backed by Casey", followed by the offer line.
- **What your case manager does:**
  - intake and document collection
  - client follow-ups
  - deadline tracking
  - RFE coordination
  - status updates
  - working in your tools
- **Casey section:** an in-code UI mock showing the case list, deadlines, RFE tracker and client portal status, plus a link to `/casey`.
- **Close:** weekly rhythm, security, pricing note, testimonial, FAQ, final CTA.

## About (`/about`)

- **Story and mission:** "We're your backstage team".
- **Not a law firm:** clarity statement.
- **Team grid:** the 16 real names and roles, with monogram portrait placeholders.
- **Where we work:** Europe, Latin America and India.
- **`#process`:** the four steps in detail.
- **`#security`:** controls, the AI use summary and a link to the full policy.
- **Company details and final CTA.**

## Book a call (`/book-a-call`)

- **Left:** what we'll cover in 30 minutes and what to prepare, plus the offer.
- **Right: booking calendar embed** (simulated scheduler).
  - Month grid, then available slots shown in the visitor's timezone with a toggle, then the details form (name, firm, email, cases per month, visa types), then a confirmation.
  - Real `.ics` download and "Add to Google Calendar" link.
  - Nothing is sent.
- **Contact form alternative** ("We usually respond within 24 hours") and a FAQ.

## Assets

- **Placeholder video testimonials:** three short MP4s plus VTT, generated like the Launchpad videos.
  - Pipeline: Playwright-rendered frames, macOS `say` narration of the real quotes, ffmpeg.
  - Every video is labelled "Placeholder — client testimonial video goes here".
  - The script is `scripts/generate-gc-assets.ts`.
- **Sample work previews:** HTML renderings of document excerpts, watermarked "Sample".
- **OG image and favicon:** Goodcase "G" mark in the Launchpad style.

## Removal list (Launchpad)

- **Pages:** `src/app/{applicant,workspace,staff,admin,apply,demo,tracks,cohorts}`.
- **Components:** `src/components/{apply,review,learning,messaging,admin,announcements,portal,settings}` and the Launchpad-specific demo pieces.
- **Libraries:** `src/lib/{domain,actions,seed,sim,walkthrough.ts}` and the store-related code (replaced by a small leads store).
- **Assets:** `public/samples`, `public/media`.
- **Docs:** Launchpad-only docs (`docs/production-handoff.md`, `docs/demo-walkthrough.md`, `docs/screenshots/*`). The tests are rewritten.
- **Keep:** `docs/reference-audit.md` and `docs/reference/` (the origin of the theme).

## Validation

- `npm run build`, `npm run lint`.
- Playwright tests for: nav dropdowns, mobile menu, home 3D section renders (and its fallback), ROI calculator math, booking flow end to end (including the `.ics`), contact and newsletter validation and success, every route loads at 390 / 768 / 1440 with no overflow and no console errors.
- Screenshots go in `docs/screenshots/`.
- Commit to `main`, then push. **There is no remote yet; ask the user for the URL if `gh` doesn't reveal one.**

## Decisions & notes

- The 95% approval / 40% faster / 100% retention figures appear only on the live site. The home fact strip uses the RFP facts instead.
- Client logos and team photos are not provided. Use labelled placeholders and never present invented clients as real.
- Case studies are not on the live site. They will be **illustrative**, labelled, and use anonymized scenarios.
- Podcast: only "#01 – Attorneys as Seen by Paralegals" is known. Other episodes, if shown, get a "sample content" label.
- Every form is simulated and nothing leaves the browser; say so in the concept pill and the success messages.

## Status — 2026-10-16 (delivered)

- **Routes:** every route in the site map is built — 41 static pages, including the 404.
- **Checks:**
  - `npm run lint` is clean and `npm run build` passes.
  - Playwright passes 94 of 94 against the production build, including every route at 390, 768 and 1440px.
- **Screenshots** in `docs/screenshots/`:
  - `desktop/` and `mobile/`: every route.
  - `features/`: key interactions, including the 3D stack, dropdown, booking, ROI and player.
- **Still needed from Goodcase:**
  - Real client logos, team photos and recorded testimonial videos.
  - Approved case studies.
  - The live blog bodies (seven articles show "migrates from current site").
  - The Casey site URL, the podcast audio, and a check of the privacy-policy controller email (`piotr@Goodcase.com` vs info@goodcase.io).

