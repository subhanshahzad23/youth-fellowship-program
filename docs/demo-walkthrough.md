# 5–7 minute client walkthrough

**Before you start:** open `/demo`, choose **Reset demo data**, then **Start the guided walkthrough**. The floating guide in the bottom-left switches identities and opens each page for you. Every step below matches a step in the guide.

## 0. The public site (45 s)

- **Scroll the homepage.** Point out the floating nav, the black hero and the workspace that overlaps it.
- **Switch the role tiles:** Fellow → Instructor → Mentor → Program team. The numbers on each board are live demo data.
- **Scroll "How it works".** The tabs stay pinned and the preview changes at each stage.
- **Show the Dates section.** Two intakes are open at once, and Summer 2027 is taking interest registrations.

## 1. Maya resumes her application (1 min)

- **Resume her draft.** It opens at *Residence eligibility*. Click the **Inside the service area** sample address. The location check result is shown separately from proof of residence.
- **Upload proof.** Pick the **Utility bill** sample document, then preview it.
- **Answer the questions.** Use **Fill with sample answers**, then submit.
- **Point out the result:** a reference number, a status timeline, and answers that are now locked.
- **Optional: refresh mid-way.** The draft comes back exactly where she left it.

## 2. Amira reviews and approves (1.5 min)

- **Open the queue.** Maya's application is at the top, assigned to Amira.
- **Preview the proof of residence.** Amira is the assigned reviewer, so it opens.
- **Score the rubric.** Score the four criteria and watch the weighted total update. Submit the review.
- **Approve.** The success panel shows three things from one transition:
  - Maya's fellow membership, on the same identity;
  - the simulated welcome email;
  - the audit entry.
- **Click Open fellow workspace as Maya.** Her new cohort, track and curriculum are there.

## 3. Learning loop (1.5 min)

- **Noah submits his interview notes.** He continues his saved draft from *Assignments* and submits it.
- **Elena gives feedback.** She opens *Submissions*, requests changes or approves, and Noah's progress updates.
- **Elena edits and publishes a session.** Open *Content*, edit a Founder Foundations session, preview it as a learner, then publish.
  - Fellows see nothing until she publishes.
  - Opening a Venture Building module is denied, because that's not her track.
- **Optional: the Notion migration.** Open *Admin → Curriculum → Notion migration*. The preview shows the mapping, and running the import twice creates no duplicates.

## 4. Supervised messaging and safeguarding (1.5 min)

- **Daniel messages Noah.** The supervision notice is always visible.
- **Daniel tries to message Aisha.** She isn't assigned to him, so the platform explains why he can't.
- **Noah reads and replies.** Unread counts and read receipts update across identities.
- **Amira handles the reported message.** Open *Safeguarding*, review the reported Summer 2026 message in context, hide it with a reason, then resolve the report. Participants now see a placeholder, and the original stays in the record.
- **Amira exports the thread.** Export it as JSON, CSV or a printable transcript. The export is logged in the audit trail.

## 5. Executive oversight (45 s)

- **Priya sees every cohort.** Send an announcement to all cohorts; a program admin can only announce to cohorts they manage.
- **Priya tries a residence document.** She is an executive but not an assigned reviewer, so the document won't open and the attempt is audited.
- **Open the audit log.** Filter for **denied** events.

## Closing talking points

- **It's one connected system.** An approval, a completion or a send changes counts everywhere, including the homepage workspace.
- **The permission rules live in one place.** Listings, search, direct URLs and actions all share them.
- **This is a front-end demo.** Production would enforce the same rules on the server (see `production-handoff.md`).
- **Dates to confirm:** is November 1 the public page, with the application module on November 15?
