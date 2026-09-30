# Launchpad Fellowship — interactive platform demo

This is a front-end demonstration of a platform for a fictional **18-month entrepreneurship fellowship for people aged 16–24**. It includes a public website, applications and review, cohort management, a learning platform, and supervised messaging, all built in **Next.js** (App Router) with no backend.

> **Demo · fictional data.** Every person, place, venture, document and message is invented. Nothing leaves your browser.

## Run it

Requires Node 20+ (tested with Node 22).

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**. For a production build:

```bash
npm run build && npm run start
```

- Start at **`/demo`** to pick an identity, or open the **guided walkthrough**.
- The dark **Demo · fictional data** pill in the bottom-left corner opens the presenter controls. From there you can switch identity, set application windows to before-open, open or closed, open the walkthrough, or reset.

## Demo identities

| Persona | Role | Starting point |
|---|---|---|
| **Maya Chen** | Applicant | Has a saved Winter 2027 draft that resumes at *Residence*. Can also apply to Spring 2027. |
| **Amira Hassan** | Program admin (Summer 2026, Winter 2027) | Review queue, rubric scoring, approvals, safeguarding, announcements. |
| **Noah Williams** | Fellow · Summer 2026 · Founder Foundations | Assignment draft in progress, unread mentor messages. |
| **Elena Ruiz** | Track instructor · Founder Foundations | Submissions to review; edits and publishes sessions. |
| **Daniel Brooks** | Mentor | Supervised threads with three assigned fellows (Noah, Diego, Lily). |
| **Priya Shah** | Executive admin | Sees every cohort and can export conversations, but can't open residence documents she isn't assigned to. |

The seed also includes a second program admin, a second executive, two more instructors, three more mentors, 24 fellows across two active cohorts, and 12 applicants in varied statuses.

## What works

- **Public site**: a Mural-inspired homepage with a floating nav and dropdowns, a black dotted hero, a live animated workspace with a role selector, a scroll-led journey, track and cohort pages, dates, fictional stories, FAQs and a footer.
- **Applications**:
  - Multistep wizard with autosave and resume.
  - Validation, conditional questions and guardian fields for under-18s.
  - Mock residence check (inside / outside / ambiguous fixtures).
  - Sample or uploaded proof of residence.
  - Submit once with a reference number.
  - Requested changes, then resubmission.
  - Concurrent applications to different cohorts.
- **Review**:
  - Searchable queue.
  - Restricted documents (assigned reviewers only).
  - Weighted rubric.
  - Approve, waitlist, reject or request changes.
  - Approval enrolls the *same* identity, sends a simulated welcome email and writes an audit entry.
  - Form builder with versioned publishing.
- **Cohorts and people**:
  - 18-month timelines.
  - Staff, mentor and reviewer assignments.
  - Scoped directories.
  - Announcements with recipient previews, simulated delivery and an email outbox.
  - Audit log.
- **Learning**:
  - 3 tracks × 6 modules, 56 sessions.
  - Narrated sample videos with captions and transcripts.
  - Worksheets, assignments, feedback and resubmission.
  - Instructor drafts with preview and publish.
  - Simulated Notion migration that is idempotent.
- **Messaging and safeguarding**:
  - Permission-checked inbox (cohort, mentor and instructor boundaries).
  - Read receipts and scripted replies.
  - Attachments.
  - Report, hide or restore, and resolve.
  - Scoped JSON/CSV/HTML exports.
  - Digest preview.

## How it's built

- `src/lib/domain/`: typed normalized model (`types.ts`), **shared permission rules** (`permissions.ts`), derived data (`selectors.ts`) and application validation.
- `src/lib/actions/`: every mutation, run through a single atomic `commit()`. If any step fails, nothing is applied.
- `src/lib/store/`: a Zustand store persisted to `localStorage` (versioned, with a recovery path for corrupt or full storage). User-added file bytes live in IndexedDB (`src/lib/files.ts`).
- `src/lib/seed/`: a deterministic seed, the curriculum content and the video manifest.
- `src/lib/sim/`: simulated services — the address check, keyword moderation rules and Notion fixtures.
- `src/lib/clock.ts`: an injectable demo clock that starts on **October 30, 2026**.
- `scripts/generate-assets.ts` (`npm run assets`): regenerates the watermarked sample documents, worksheet PDFs and narrated videos. It needs macOS `say` and `ffmpeg`. The generated files are already committed under `public/`.

## Reset

- Presenter controls → **Reset demo data**, or the button on `/demo`.
- This restores every seeded record and clears files added in this browser.
- Reloading never overwrites your changes. The seed only loads when there's no saved state or the data version changes.

## Tests

With the app running on port 3000 (or set `BASE_URL`, e.g. against `npm run start`):

```bash
npm run test:e2e
```

The suite covers the connected journeys and permission boundaries: application → review → enrollment, requested changes, window scenarios, assignments and feedback, draft/publish, the Notion import, messaging boundaries, scripted replies, moderation and export, announcement scope, and reset. Set `BASE_URL` to test another port.

## Important: demo vs. production security

The role checks run in the browser. They demonstrate the intended workflows, but **they are not security**. Documents in this demo are not encrypted, and all data sits in the viewer's browser storage.

A production build needs server-side authentication and authorization, private encrypted document storage with short-lived access, server-enforced message oversight and a trustworthy audit store. See `docs/production-handoff.md`.

## Docs

- `docs/reference-audit.md`: the Mural design and motion audit (observed vs. added) and adaptation decisions. Screenshots are in `docs/reference/`.
- `docs/production-handoff.md`: date interpretation, production requirements and the decisions the client needs to make.
- `docs/demo-walkthrough.md`: a 5–7 minute presentation script.
- `docs/ui-conventions.md`: implementation conventions.
- `docs/screenshots/`: screenshots of the finished demo.
