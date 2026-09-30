# Production handoff notes

These are internal notes that go with the Launchpad Fellowship demo. They are **not** shown in the applicant's public navigation. They record our assumptions, the open questions for the client, and what a production build needs beyond this front-end demo.

## 1. Delivery dates (need confirmation)

The job description sets three milestones:

| Module | Stated target |
|---|---|
| Application module live | **November 15, 2026** |
| Learning management (LMS) | **Late November 2026** |
| Messaging | **Mid-December 2026** |

It also mentions **November 1**, without saying what should be ready by then. We shouldn't promise two different application deadlines without checking.

**Proposed interpretation, pending client confirmation:**

- **November 1, 2026:** the public promotional page goes live. That covers the homepage, tracks, cohort dates, FAQs and interest registration.
- **November 15, 2026:** the application module goes live. That covers accounts, the multistep form, residence check and document upload, the review queue, the rubric and decisions.
- **Late November 2026:** LMS (tracks, modules, sessions, assignments and feedback), plus the Notion migration.
- **Mid-December 2026:** supervised messaging, moderation and digests.

The demo's clock starts on **October 30, 2026**, so it previews the state just before these milestones.

## 2. Budget and proposal

- The stated build budget is **$8,000–$12,000**.
- The demo includes no pricing page, no payment flow and no itemized quote.
- A formal quote should come later and itemize:
  - applications (form builder, review, decisions);
  - cohort and people management;
  - the LMS and the Notion migration;
  - messaging, moderation and digests;
  - hosting and third-party fees;
  - training;
  - documentation;
  - the bug-fix and warranty period;
  - payment terms.
- Current vendor or hosting costs are **not** estimated here. They depend on decisions still to be made (see §5).

## 3. What the demo is — and isn't

- **Role checks run in the browser.** Everything in `src/lib/domain/permissions.ts` shows the intended rules, and every screen and action calls it. But anyone with dev tools can bypass client-side checks. **None of this is production security.**
- **Data lives in the viewer's browser.** Records sit in `localStorage` and user-added file bytes in IndexedDB. Nothing is encrypted, and there's no server.
- **Emails, the address lookup, keyword moderation, the Notion import and scripted replies are all simulated.** They're deterministic and bounded.
- **All people, places, documents and messages are fictional.**

## 4. Required for production

### Identity and authorization

- Real authentication for applicants, fellows and staff. That means email verification and passwordless or password sign-in, with MFA for staff. Consider SSO for staff.
- **Server-enforced authorization** on every read and write. The same rules the demo encodes need enforcing:
  - cohort scoping for program admins; executive admins see everything;
  - instructors scoped to their track and cohort;
  - mentors limited to the fellows assigned to them;
  - reviewers limited to their assigned applications;
  - fellows limited to their own cohort.
- Keep one person record per human. An approval should add fellow membership to the existing account, as the demo does — never create a second login.
- Row-level security, or an equivalent policy layer, in the database. This is defense in depth.

### Documents (proof of residence and attachments)

- Encrypt in transit (TLS) and at rest.
- Use **private object storage** with no public URLs. Access should go through **short-lived, authorized, per-request signed URLs**, and permission must be checked again on every open.
- Access policy: the applicant, plus reviewers explicitly assigned to the application. A job title alone must not grant access. Log every view and every denied attempt.
- Upload validation on the server: check the real file type (not just the extension), enforce size limits, run a malware scan, and strip metadata where appropriate.
- Retention rules, such as deleting residence evidence a set time after the decision. This **needs client confirmation**.

### Messaging and safeguarding

- Enforce message permissions on the server, including recipient eligibility and cohort boundaries. Re-evaluate them whenever a relationship changes.
- Staff oversight should be explicit and visible to participants, as it is in the demo.
- A moderation queue with hide and restore. Keep the original text in an access-controlled record.
- The keyword rules should stay transparent and simple, and a human should always decide. Any AI-assisted moderation would need its own policy review.
- Transcript exports should be limited to authorized staff and written to the audit log.

### Audit, reliability and operations

- **Trustworthy audit storage** that is append-only and tamper-evident, with separate access controls. It should cover views, reviews, decisions, exports, moderation actions and changes to permissions or relationships.
- Transactional email through a provider, with SPF, DKIM and DMARC set up. Digest scheduling should run as a background job.
- Backups with a tested restore, and monitoring and alerting.
- An accessibility audit (WCAG 2.2 AA) and a privacy review before launch.
- The client should own the source code, the data and every service account (hosting, database, email, storage, domain). Hand off credentials properly.

### Notion migration

- The demo imports bundled synthetic fixtures. Production needs a Notion integration token scoped to the curriculum workspace, a mapping for Notion block types (headings, text, video embeds, files, to-dos → tasks), and an **idempotent upsert keyed by Notion page and block IDs**. The demo already follows that pattern, so re-running an import updates or skips rather than duplicating.

## 5. Decisions the client needs to make

1. **Jurisdiction.** This decides the applicable privacy law and the rules for data about minors.
2. **Address-service provider and eligibility boundary.** Which public address or geocoding service, and exactly which areas count as inside the service area. The demo's fixtures (Eastbank, Millbrook, Old Quay, Harborside) are fictional.
3. **Consent policy for participants aged 16–17.** Is parent or guardian consent needed, and at which step (application or enrollment)? What can guardians see?
4. **Hosting region.** Also where data may be stored and processed.
5. **Document-access policy.** Who may be assigned as a reviewer, how long residence evidence is kept, and whether executives ever get emergency access. In the demo they don't, by design.
6. **Program-admin scope.** The demo **assumes** program admins manage only their assigned cohorts and executive admins supervise every cohort and conversation. The brief says executives can supervise all conversations. Please confirm the program-admin assumption.
7. **Mentor model.** One active mentor per fellow (the demo's assumption), or more than one?

## 6. Possible production stack (not a commitment)

- **Next.js (App Router)** for the public site and portals, with server components and route handlers or server actions for mutations.
- **Managed PostgreSQL** for the normalized model already in `src/lib/domain/types.ts`, which maps almost one-to-one onto tables.
- **Server-enforced authorization** through a policy layer plus database row-level security.
- **Private object storage** with signed URLs for documents.
- **A transactional email provider** for decisions, welcome emails, announcements and digests.
- **Hosting region and vendor fees are not confirmed.** We have not estimated costs.
