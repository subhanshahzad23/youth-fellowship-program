# Reference audit: mural.co homepage

**When:** September 30, 2026, using headless Chromium (Playwright). The scripts are `scripts/mural-audit-1.mjs` through `scripts/mural-audit-6.mjs`.
**Inputs:** the attached `DESIGN MURAL.md`, the live homepage, and computed styles captured in the browser. The raw data is in `docs/reference/mural-audit-*.json`, and the screenshots are in `docs/reference/`.
**Widths checked:** 1440 px, 1024 px, 768 px and 390 px.
**Cookie banner:** the consent banner and the third-party chat widget (Qualified/"Muriel") were hidden from screenshots. No Mural forms were submitted and no messages were sent to the assistant.

In the tables below, **Observed** means measured or seen on mural.co, and **Added** means extra motion or behavior we chose for Launchpad.

## 1. Measured values (desktop, 1440 px)

| Element | Observed on mural.co | Launchpad translation |
|---|---|---|
| Nav | Sticky wrapper with a floating inner bar at `x=40, y=16`, **1360 × 64**, `border-radius: 16px`, white, `padding: 0 12px 0 16px`. Shadow: `rgba(11,41,70,.32) 0 0 1px, rgba(42,82,121,.08) 0 24px 20px`. Nav links are 16px/300 ABC Social. | `SiteNav`: same geometry and shadow (`--shadow-float`), DM Sans 15.5px. |
| Nav CTA | "Sign up free" is **jade over the dark hero** and turns **black with a grey arrow box** once the page scrolls past the hero. | The "Apply" CTA follows the same rule. An IntersectionObserver on `[data-hero]` drives it. |
| Nav dropdown | Opens on hover. The active trigger gets a fog pill. The panel is a white 16px card with a float shadow and a plain list of links. | A Radix NavigationMenu for keyboard and hover, with the same card. The Tracks panel adds a one-line description per track. |
| Hero bg | `.home_hero_dots-background`: black with a dot-texture PNG, **1072px tall**. The workspace overlaps its bottom edge. | `.dots-dark` uses a CSS radial-gradient (22px grid) instead of the PNG. The black ends about 45% of the way down the workspace. |
| Hero H1 | STK Bureau **80px / 88px / −4px, weight 300**, colour `#8c8c8c`. The emphasised line is white (`span.text-color-white`). The glyphs are serif-like. | **Newsreader 300** (optical sizing), `clamp(46px, 6.4vw, 84px)`, line height 1.06, tracking −0.048em. First line muted, second line white. |
| Hero copy | 18px/27px, weight 300, white, 720px column. | 17–18px DM Sans, 720px column. |
| Hero form | Email input: 2px `#4f5457` border, 8px radius, black fill. Submit button: jade, `padding 9px 52.8px 9px 16px`, arrow graphic. | **No email gate** (per brief). A primary jade "Apply" CTA and a secondary ghost button "Explore the demo". |
| Buttons | 8px radius, jade `#00c27a`, black text. The mint (`#b4f5c8`) arrow box is 36 × 36, 6px radius, inset 2px. **Hover:** a 10% black overlay (via `background-position`) over **0.3s `cubic-bezier(0.23,1,0.32,1)`**, and the hovered colour becomes `rgb(3,175,110)`. Transitions are declared on the icon's transform and the box width, but no movement was visible. | `Button`/`ButtonLink`: identical overlay and timing. **Added:** a 3px arrow nudge on hover. |
| Section headings | STK Bureau 70px/70px, −2.8px (h2). 54px/64.8px (tab headings). 40px/48px (card titles). | `.display-xl` / `.display-lg` / `.display-md` built with `clamp()`. |
| Eyebrows | 14px, weight 300, uppercase, **3.5px tracking** (≈0.25em). | `.eyebrow`: 11.5px/500, 0.2em tracking. It is smaller, as the brief asks for 11–12px. |
| Section rhythm | Padding of 192/208/112/80px. Dotted textures on alternating sections. | `--space-section: clamp(80px, 9vw, 120px)`, with `.dots-light` on alternating sections. |
| Tabs | Fog tiles (`#f3f3f3`), 8px radius, 23 × 44px padding, 16px/300 type, 112px tall. **Sticky at top 104px.** The active tile turns jade, with a mint progress bar underneath. | The Journey section uses the same system: jade active tile, a mint track and a forest fill. |
| Product visuals | `tabs1_3d-img` is `rotateY(−10deg)`. Wrappers swap with **opacity 0/1**. | The Journey previews use `rotateY(-10deg)` with an opacity/y swap. |
| Dark card | `card1_component` is black, radius 24px, **inset 10px from the viewport** (1420px wide). Text on the left; photo and jade/mint blocks on the right. | The Safeguarding card uses the same inset and radius. The photo is replaced by product cards on #141414. |
| Testimonial | Card `#fbfbfb` with dot texture, 24px radius, 1.5px border, serif quote and a jade quote mark. Chevrons sit outside the card. | Stories carousel, labelled "Fictional example". |
| Final CTA | Mint `#b4f5c8` dotted panel, 24px radius, floating cursor tags (CEO/CPO), two CTAs (jade + black). | `FinalCta`, with "Mentor" and "Fellow" cursor tags. |
| Footer | Five link columns (16px/300, 28px line height), then a giant multicolour wordmark bleeding to the edges. | Five columns. Giant **monochrome** Launchpad wordmark plus the step mark (brand colours kept in-canvas only). |

## 2. Hero workspace and role selector (observed)

- There is a white canvas with a dot grid. On its left edge sits a **dark vertical tool rail** (about 60px wide, 14px radius, white outline icons). A **floating toolbar pill** (logo, board name, chevron, download, search) sits on the top-left and overlaps the canvas edge.
- In-canvas content includes circled groupings drawn with hand-drawn red/blue/pink strokes, profile cards, speech-bubble callouts, arrows, **collaborator cursors with coloured name tags** (Olivia, David, Andrea), sticky notes, and an avatar strip with a coloured ring around each avatar at the bottom centre.
- A floating white card reads **"Which team are you part of?"** and holds a **2×2 grid of ash tiles**. The active tile has a **multicolour border that rotates** (it changes between frames), the copy for that team, and a black CTA.
- **Clicking a tile:** at about 200ms the canvas has faded out completely, and by about 1.1s the new board is shown. The copy and CTA change immediately.
- **Mobile (390 px):** the selector tiles overlap and break on mural.co itself. We noted this and did **not** copy it. Launchpad shows a clean 2×2 selector with a compact preview list below it.

Launchpad keeps the rail, pill, cursors, avatar strip, 2×2 selector with a rotating spectrum ring (CSS `@property` conic gradient) and the cross-fade. Four original boards (Fellow, Instructor, Mentor, Program team) read **live counts from the demo store**. For example, approving an applicant changes the Program team board. "Explore this workspace" signs in as the matching persona.

## 3. Motion inventory

| Behavior | Observed on mural.co | Launchpad |
|---|---|---|
| Button hover | Observed: 300ms overlay, easeOutQuint | Same timing. Added: 3px arrow nudge |
| Nav CTA colour change on scroll | Observed | Same |
| Dropdown open on hover | Observed (instant, no measurable animation) | Added: 180ms pop-in (opacity plus 4px y) |
| Hero on load | **No reveal seen** 400ms after DOMContentLoaded; the content was already visible | Added: CSS masked line reveal (0.9s, easeOutQuint, 120/260ms stagger), with copy and CTAs rising 520–720ms. CSS-only, so the text stays visible without JS |
| Workspace | Static on load; cross-fade on role change | Same cross-fade. Added: assembly (0.97 scale plus 48px rise, staggered items) and slow bounded cursor drift (12s loop, ±34px), paused off-screen and under reduced motion |
| Active tile border | Observed rotating spectrum | Same (5s linear loop; static under reduced motion) |
| Sticky tabs, scroll-linked progress, image swap | Observed | GSAP ScrollTrigger sets the active step and scrubs the progress bars (desktop and motion-safe only). Previews use opacity/y |
| Section reveals | **Not observed**: sections were already at opacity 1 before entering the viewport | Added: a restrained 32px rise, run once per element (`whileInView once`) |
| Testimonial carousel | Click-driven arrows, no autoplay observed | Same: arrows, dots, keyboard and swipe, no autoplay |
| Explainer panel | A video with drifting words | Added: a live mini application/learning UI that plays only while on screen |

The brief suggested timings (600–900ms reveals, 150–250ms UI) where nothing measurable was observed. Those are **our choices, not claims about Mural**.

## 4. Responsive observations

- **1024 / 768:** the nav keeps the floating bar. The menu collapses to a hamburger below about 992px (a vertical divider stays next to it at 768). The hero H1 stays at 80px at 768 and drops to 48px/52.8px at 390.
- **390:** the nav is a white rounded bar with the logo and a hamburger. The menu opens a full-screen white list with stacked full-width CTAs. Launchpad does the same, adding accordion groups for Fellowship and Tracks.

## 5. Adaptation decisions

- **Display font.** STK Bureau is proprietary and not available to us. We compared Instrument Serif, Newsreader, Source Serif 4, Fraunces and Literata against the captured hero glyphs (`font-comparison.png`). **Newsreader Light** is closest in width, x-height and contrast at display sizes. Instrument Serif is noticeably more condensed. Barlow Condensed is not serif-like, so we rejected it.
- **Interface font.** DM Sans stands in for ABC Social. Both fonts are self-hosted through `next/font/google` at build time, and no font requests go to Google from the browser.
- **Assets.** We did not copy Mural's logo, copy, photography, customer logos or any runtime assets. All imagery is CSS/SVG or product UI, and there are no trackers or remote widgets.
- **Palette.** In-canvas colours (lemon, sky, flamingo, grape) appear only inside illustrated workspaces and sticky notes. Marketing chrome stays monochrome plus jade.
- **Not copied.** The email-capture hero, customer logos, the pricing page, results figures and customer testimonials. These are replaced with fellowship facts and clearly fictional stories.

## 6. Not inspected or not available

- **Exact animation curves.** Mural uses Webflow IX2 (25 `data-w-id` nodes) plus GSAP and ScrollTrigger. We could not read the curves for scroll interactions from the DOM. Where a timing wasn't shown in a computed `transition`, we recorded behaviour from before/after screenshots only.
- **Secondary pages.** Product, Features and Trust & Security were not inspected in depth. The homepage patterns were enough for the public site.
- **Chat widget.** The third-party "Muriel" widget was hidden, and we did not interact with it.
