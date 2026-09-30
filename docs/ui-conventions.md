# Launchpad demo — implementation conventions

Read this before writing any page. The goal is one coherent product: Mural-derived visual language (black/white, light serif display, one jade accent, flat surfaces) applied to readable, fast operational screens.

## Stack and Next.js 16 specifics

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 (tokens in `src/app/globals.css`).
- Portal pages are client components: `"use client"` + `export default function Page()`.
- Dynamic params in client pages: `const { applicationId } = useParams<{ applicationId: string }>();` (from `next/navigation`).
- `useSearchParams()` must be inside a `<Suspense>` boundary. Pattern: `page.tsx` (no "use client") renders `<Suspense fallback={null}><ClientView /></Suspense>` and the client view lives in a sibling file (e.g. `view.tsx`).
- Do **not** run `next build`, `next dev`, or stop/start servers — a dev server is already running on http://localhost:3000. Verify with `npx tsc --noEmit -p .` and `npx eslint <your files>`.
- Visual check: `node scripts/shot.mjs <path> <out.png> <personaId> <width> [fullPage=1]` screenshots a route as a persona (prints horizontal overflow + console errors). Save screenshots in the scratchpad, not the repo. Look at them and fix what looks wrong.

## Data and state

- Store: `src/lib/store/store.ts`. Read with `useDb()`, `useMe()`, `usePersonaId()`. **Never return a new array/object from a Zustand selector** — select `db` and derive with `useMemo`.
- Inside a portal page, `useMe()!` is safe (the shell only renders children for a signed-in, authorized persona).
- Types: `src/lib/domain/types.ts`. Derived data: `src/lib/domain/selectors.ts`. Rules: `src/lib/domain/permissions.ts` (single source of truth — use it to decide what to show and to explain denials).
- **All mutations go through `src/lib/actions/*`** (they run permission checks again and are atomic). Each returns `{ ok: true, value } | { ok: false, error }`. Show `toast.success(...)` only when `ok`, otherwise `toast.error(r.error)` or an inline error. Never fake success.
- For weighty actions (submit, approve, send, publish, import) add a short bounded delay (`await sleep(350–700)`) with a `loading` button so the state change is perceptible. Every action resolves.
- Time: `useNow()` from `src/lib/hooks.ts` (demo clock, starts Oct 30 2026). Format with `fmtDate`, `fmtDateTime`, `fmtRelative(iso, now)` from `src/lib/utils.ts` (UTC-pinned; do not use `toLocaleString` directly).
- Files: `src/lib/files.ts` (IndexedDB bytes, `downloadBlob`, `downloadFileRecord`). Use `FileDrop`, `DocumentRow`, `DocumentViewer` from `src/components/ui/files.tsx`. Never persist object URLs.
- Need a new action/selector? Put it in a **new** file for your area (e.g. `src/lib/actions/review-extra.ts`). Only make minimal, targeted edits to shared files if you find a real bug, and mention it in your report.

## Components (src/components/ui)

- `button.tsx`: `Button`, `ButtonLink` (variants `primary` jade, `dark`, `outline`, `soft`, `ghost`, `danger`, `light`, `ghost-dark`; `arrow` adds the Mural-style arrow box; `loading`; `icon`), `IconButton`.
- `form.tsx`: `Input`, `Textarea`, `Select`, `Field` (label/hint/error/required/counter), `WordCounter`, `Checkbox`, `RadioCards`, `Switch`, `ErrorSummary`, `fieldId(field)`.
- `display.tsx`: `Panel`, `PanelHeader`, `PageHeader` (serif title), `Eyebrow`, `Badge` (tones), `StatusBadge` (application status with icon), `Avatar`, `ProgressBar`, `ProgressRing`, `Stat`, `EmptyState`, `Notice`, `RestrictedState`, `WarningLine`, `Skeleton`, `Kbd`.
- `overlay.tsx`: `DialogRoot/DialogContent/DialogClose`, `ConfirmDialog` (async confirm), `Sheet`, `Menu*`, `Popover*`, `TabsRoot/TabsList/TabsTrigger/TabsContent`, `Segmented`, `Accordion`, `Tooltip`.
- `table.tsx`: `Table`, `THead`, `TH` (sortable), `TR`, `TD`. On mobile (`< md`) render a card list instead of the table.
- `rich-text.tsx`: `Inline`, `Paragraphs` (safe lightweight markdown).
- Portal helpers: `src/components/portal/states.tsx` (`RecordNotFound`, `Denied`), `crumbs.tsx` (`useCrumb(label)` names the last breadcrumb on detail pages), `cohort-timeline.tsx`.
- `src/components/settings/notification-settings.tsx`: `NotificationSettings` (prefs + digest preview) for settings pages.
- Icons: `lucide-react` only. No emoji in UI chrome (message reactions are the one exception).

## Visual rules

- Portal page background is `bg-fog` (set by the shell). Content sits in white `Panel`s (radius 20px) — surface change, not shadows. Shadows only for floating overlays (`shadow-float`).
- Page titles: `PageHeader` (Newsreader light serif, tight tracking). Section titles inside panels: DM Sans 17px semibold. Eyebrows: `.eyebrow` (11.5px uppercase, 0.2em tracking).
- Jade (`bg-jade`) is for the primary CTA, progress, active/selected accents and unread dots — not for text on white (use `text-leaf-ink` for green text). Controls: 8px radius. Badges: pill.
- Status always uses text + icon, not colour alone.
- Keep operational screens dense and legible: 14–15px body in tables, 16px in reading views. Touch targets ≥ 40px. Visible focus (global `:focus-visible` outline is set).
- Motion: `motion/react`, 150–250ms, ease `[0.23, 1, 0.32, 1]`, transform/opacity only. `MotionConfig reducedMotion="user"` is global. No bouncing, no large blurs.
- Responsive: must work at 390px, 768px, 1024px, 1440px with no horizontal page overflow. Mobile message view is list → thread with a clear back button.
- Copy: US English, confident, warm, direct. Everything is fictional — never claim real outcomes, partners, certifications or encryption. Explain restrictions plainly and always give a working next step.

## Empty, denied and missing states

- Unknown ids: `RecordNotFound` with a working destination. Intentional denial (direct URL outside scope): `Denied` with the reason from `permissions.ts`. Never a blank page, never `href="#"`, no "coming soon".

## Personas (user ids)

`u_maya` applicant · `u_amira` program admin (Summer 2026 + Winter 2027) · `u_noah` fellow (Summer 2026, Founder Foundations) · `u_elena` instructor (Founder Foundations) · `u_daniel` mentor (Noah, Diego, Lily) · `u_priya` executive admin. Others: `u_marcus` program admin (Spring 2026 + Spring 2027), `u_jordan` exec, `u_kwame`/`u_hannah` instructors, `u_grace`/`u_sofia`/`u_omar` mentors, `u_aisha` fellow (Summer 2026, not Daniel's mentee).
