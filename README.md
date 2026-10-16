# Goodcase — website redesign concept (Part B)

A working design concept for the Goodcase website redesign RFP. **Goodcase** is the back office of U.S. immigration law firms. It drafts filing-ready O-1, EB-1A, EB-2 NIW, H-1B, L-1 and E-2 petitions and runs cases with an experienced case manager, supported by Casey. Attorneys keep the strategy, the client and the signature.

The site is built in **pure Next.js** (App Router) with no backend.

> **Design concept.** Facts, team names, testimonials, blog titles and policy text come from the RFP and goodcase.io. Client logos, case studies, team photos, testimonial videos and sample podcast episodes are **labelled placeholders**. All forms, the booking calendar and the newsletter are simulated; nothing leaves the browser.

The earlier Launchpad Fellowship demo is preserved on the **`launchpad`** branch.

## Run it

You need Node 20 or later.

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**. For a production build:

```bash
npm run build && npm run start
```

The dark **Design concept** pill in the bottom-left corner opens a reviewer panel. It has an index of every page, grouped like the brief's site map, and a button that resets the simulated forms.

## What's in it

| Group | Pages |
|---|---|
| Main | Home · Case drafting · Case management · About (`#team`, `#process`, `#security`) · Book a call |
| Who we serve | Overview · Solo and small firms · Growing firms · Large and high-volume |
| Resources | Hub · Blog + article · Podcast + episode · Case studies + detail · Sample work + detail · FAQ |
| Other | Casey · AI Use Policy · Privacy Policy · Design system |

**Components the brief asks for:**
- A header with two dropdowns (Services, Who we serve).
- A footer with newsletter signup.
- A fact strip.
- Service cards with open prices.
- A four-step process (sticky, scroll-led on Home).
- An ROI calculator.
- Video testimonials (captioned player).
- A client logo row.
- A booking calendar embed with time zones, a `.ics` download and a Google Calendar link.
- A contact form.
- A design-system page.

**Conversion rule.** The first-case offer ("First case at half price · Money-back guarantee · No minimum volume · Flat fees from $500") sits under every hero and above every closing button.

**Legora-inspired 3D section.** "How a Goodcase petition is built" is a pinned, scroll-driven stack of three.js glass plates (React Three Fiber). It runs from your strategy and signature, through intake, drafting, two-step review, Casey and your case manager, to a filing-ready package that splits into the six case types.
- Hovering a plate highlights its layer, and the cursor tilts the stack.
- Phones, reduced-motion settings and browsers without WebGL get a CSS isometric version.

## Stack

- **Core:** Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) and Tailwind CSS v4. Design tokens are in `src/app/globals.css`.
- **Motion and 3D:** Motion, plus GSAP ScrollTrigger for the sticky process. three.js with @react-three/fiber and @react-three/drei powers the 3D stack.
- **UI and state:** Radix primitives, Lucide icons and Sonner toasts. Zustand holds the simulated bookings, messages and newsletter state in localStorage.
- **Fonts:** Newsreader (display serif) and DM Sans (interface), loaded through `next/font`.

## Project layout

```
src/app/                    routes (one folder per page)
src/components/gc/          Goodcase sections: offer, facts, services, process, roi, testimonials,
                            team, security, pricing, faq, final-cta, booking, contact-form
src/components/gc/home/     hero, case board, 3D petition stack (scene + fallback)
src/components/site/        nav, footer, page shell + hero, concept pill, reveal
src/components/ui/          buttons, form controls, dialogs, accordion, badges
src/lib/content/site.ts     all copy and facts (single source of truth)
src/lib/leads.ts            simulated lead store (bookings, messages, newsletter)
docs/source/                the RFP text and goodcase.io text captures
docs/reference-legora/      Legora 3D section reference frames
```

## Assets

```bash
npm run assets
```

This regenerates the testimonial placeholder videos (`public/media/*.mp4`, posters and WebVTT captions) and `src/app/opengraph-image.png`.
- Slides are rendered with Playwright.
- The real published quotes are narrated with macOS `say`.
- Everything is encoded with ffmpeg.

## Checks

```bash
npm run lint
npm run build && npx next start -p 3100
BASE_URL=http://localhost:3100 npm run test:e2e
BASE=http://localhost:3100 node scripts/route-sweep.mjs docs/screenshots 1440
```

The Playwright suite covers:
- The nav dropdowns and the mobile menu.
- The first-case offer placement.
- The 3D section and its fallbacks.
- The practice selector.
- The ROI math.
- The booking flow, including the `.ics` file.
- Contact and newsletter validation.
- The testimonial player.
- Every route at 390, 768 and 1440px: HTTP 200, no horizontal overflow and no console errors.

## Context for future sessions

`GOODCASE_PROJECT_CONTEXT.md` (brief, decisions, content sources, progress log) and `GOODCASE_BUILD_PLAN.md` (site map and checklist) in the repo root hold the full project context.
