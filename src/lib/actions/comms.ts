"use client";

import type { Announcement, Database, ID, NotificationPrefs } from "@/lib/domain/types";
import { canAnnounce } from "@/lib/domain/permissions";
import { commit, useDemoStore } from "@/lib/store/store";
import { nowISO } from "@/lib/clock";
import { uid } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export function recipientsFor(db: Database, scope: "all" | ID, audience: Announcement["audience"], senderId?: ID): ID[] {
  const cohortIds = scope === "all" ? Object.values(db.cohorts).filter((c) => c.status === "active" || c.status === "intake").map((c) => c.id) : [scope];
  const ids = new Set<ID>();
  for (const m of Object.values(db.memberships)) {
    if (m.status !== "active" || !cohortIds.includes(m.cohortId)) continue;
    if (m.role === "fellow" || audience === "fellows_and_staff") ids.add(m.userId);
  }
  if (senderId) ids.delete(senderId);
  return [...ids];
}

export function saveAnnouncementDraft(input: { id?: ID; scope: "all" | ID; audience: Announcement["audience"]; title: string; body: string }) {
  return commit((db, ctx) => {
    const d = canAnnounce(db as Database, ctx.actorId, input.scope);
    if (!d.ok) ctx.fail(d.reason);
    if (!input.title.trim()) ctx.fail("Add a title.");
    if (input.id) {
      const a = db.announcements[input.id];
      if (!a) ctx.fail("Announcement not found.");
      if (a.status !== "draft") ctx.fail("Sent announcements can't be edited.");
      if (a.senderId !== ctx.actorId && !canAnnounce(db as Database, ctx.actorId, a.scope).ok) ctx.fail("You can't edit this draft.");
      Object.assign(a, { scope: input.scope, audience: input.audience, title: input.title.trim(), body: input.body });
      return a.id;
    }
    const id = uid("an");
    db.announcements[id] = { id, senderId: ctx.actorId, scope: input.scope, audience: input.audience, title: input.title.trim(), body: input.body, status: "draft", recipientIds: [], createdAt: ctx.now };
    return id;
  });
}

export function deleteAnnouncementDraft(id: ID) {
  return commit((db, ctx) => {
    const a = db.announcements[id];
    if (!a || a.status !== "draft") ctx.fail("Only drafts can be deleted.");
    if (!canAnnounce(db as Database, ctx.actorId, a!.scope).ok) ctx.fail("You can't delete this draft.");
    delete db.announcements[id];
  });
}

/** Phase 1: lock recipients and mark as sending. Delivery completes in processSendingAnnouncements(). */
export function sendAnnouncement(id: ID) {
  return commit((db, ctx) => {
    const a = db.announcements[id];
    if (!a) ctx.fail("Announcement not found.");
    if (a.status !== "draft") ctx.fail("This announcement was already sent.");
    const d = canAnnounce(db as Database, ctx.actorId, a.scope);
    if (!d.ok) ctx.fail(d.reason);
    if (!a.title.trim() || !a.body.trim()) ctx.fail("Add a title and a message before sending.");
    const recipients = recipientsFor(db as Database, a.scope, a.audience, ctx.actorId);
    if (!recipients.length) ctx.fail("There's nobody in that audience yet.");
    a.senderId = ctx.actorId;
    a.recipientIds = recipients;
    a.status = "sending";
    a.sentAt = ctx.now;
    ctx.audit({ action: "announcement.send", entityType: "announcement", entityId: id, cohortId: a.scope === "all" ? undefined : a.scope, summary: `Sent “${a.title}” to ${recipients.length} recipients (${a.scope === "all" ? "all cohorts" : db.cohorts[a.scope]?.name})` });
    return recipients.length;
  });
}

const DELIVERY_MS = 1800;

/** Phase 2: simulated delivery — portal notifications + outbox emails. Idempotent. */
export function processSendingAnnouncements() {
  const { db, hydrated } = useDemoStore.getState();
  if (!hydrated) return;
  const now = nowISO();
  const ready = Object.values(db.announcements).filter((a) => a.status === "sending" && a.sentAt && Date.parse(now) - Date.parse(a.sentAt) >= DELIVERY_MS);
  if (!ready.length) return;
  commit(
    (d, ctx) => {
      for (const r of ready) {
        const a = d.announcements[r.id];
        if (!a || a.status !== "sending") continue;
        a.status = "delivered";
        a.deliveredAt = ctx.now;
        const sender = d.users[a.senderId];
        for (const rid of a.recipientIds) {
          const u = d.users[rid];
          if (!u) continue;
          const base = u.staffRoles.length ? (u.staffRoles.some((x) => x === "executive_admin" || x === "program_admin") ? "/admin" : "/staff") : "/workspace";
          const href = base === "/admin" ? `/admin/announcements?id=${a.id}` : `${base}/announcements?id=${a.id}`;
          ctx.notify({ userId: rid, kind: "announcement", title: a.title, body: a.body.split("\n")[0].slice(0, 140), href });
          if (u.notificationPrefs.emailAnnouncements)
            ctx.email({
              toUserId: rid,
              toEmail: u.email,
              toName: u.name,
              subject: a.title,
              preview: a.body.split("\n")[0].slice(0, 120),
              bodyText: `Hi ${u.firstName},\n\n${a.body}\n\n— ${sender?.name}, Launchpad Fellowship`,
              kind: "announcement",
              announcementId: a.id,
              relatedHref: href,
            });
        }
      }
    },
    { allowAnonymous: true },
  );
}

/* ------------------------------------------------------------------ */
/* Notifications and preferences                                       */
/* ------------------------------------------------------------------ */

export function markNotificationRead(id: ID) {
  return commit((db, ctx) => {
    const n = db.notifications[id];
    if (!n || n.userId !== ctx.actorId) return;
    n.readAt ??= ctx.now;
  });
}

export function markAllNotificationsRead() {
  return commit((db, ctx) => {
    for (const n of Object.values(db.notifications)) if (n.userId === ctx.actorId && !n.readAt) n.readAt = ctx.now;
  });
}

export function updateNotificationPrefs(prefs: Partial<NotificationPrefs>) {
  return commit((db, ctx) => {
    const u = db.users[ctx.actorId];
    if (!u) ctx.fail("Choose an identity first.");
    u.notificationPrefs = { ...u.notificationPrefs, ...prefs };
  });
}

/* ------------------------------------------------------------------ */
/* Accounts, interest and demo scenarios                               */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Simulated sign-up: creates a fictional applicant identity and signs in as them. */
export function createApplicantAccount(input: { name: string; email: string; pronouns?: string }) {
  const res = commit(
    (db, ctx) => {
      const name = input.name.trim();
      if (name.split(/\s+/).length < 2) ctx.fail("Enter your first and last name.");
      if (!EMAIL_RE.test(input.email)) ctx.fail("Enter a valid email address.");
      const email = input.email.trim().toLowerCase();
      const existing = Object.values(db.users).find((u) => u.email.toLowerCase() === email);
      if (existing) {
        if (existing.staffRoles.length) ctx.fail("That email belongs to a staff account. Use a different email.");
        return { userId: existing.id, existed: true };
      }
      const id = uid("u");
      db.users[id] = {
        id,
        name,
        firstName: name.split(/\s+/)[0],
        email,
        pronouns: input.pronouns || undefined,
        avatarHue: Math.floor(Math.random() * 360),
        staffRoles: [],
        createdAt: ctx.now,
        notificationPrefs: { digest: "daily", emailAnnouncements: true, emailMessages: true },
        createdViaSignup: true,
      };
      ctx.audit({ action: "user.signup", entityType: "user", entityId: id, actorId: id, summary: `Created an applicant account (simulated sign-up)` });
      return { userId: id, existed: false };
    },
    { allowAnonymous: true },
  );
  if (res.ok) useDemoStore.setState({ personaId: res.value.userId });
  return res;
}

export function registerInterest(cohortId: ID, name: string, email: string) {
  return commit(
    (db, ctx) => {
      if (!name.trim()) ctx.fail("Enter your name.");
      if (!EMAIL_RE.test(email)) ctx.fail("Enter a valid email address.");
      const cohort = db.cohorts[cohortId];
      if (!cohort) ctx.fail("Cohort not found.");
      if (Object.values(db.interest).some((i) => i.cohortId === cohortId && i.email.toLowerCase() === email.toLowerCase())) return { duplicate: true };
      const id = uid("int");
      db.interest[id] = { id, cohortId, name: name.trim(), email: email.trim(), createdAt: ctx.now };
      ctx.email({
        toEmail: email.trim(),
        toName: name.trim(),
        subject: `You're on the list for ${cohort.name}`,
        preview: "We'll email you the day applications open.",
        bodyText: `Hi ${name.trim().split(" ")[0]},\n\nThanks for registering interest in Launchpad Fellowship ${cohort.name}. We'll email you the day applications open.\n\nLaunchpad Fellowship`,
        kind: "interest",
        relatedHref: `/cohorts/${cohort.slug}`,
      });
      return { duplicate: false };
    },
    { allowAnonymous: true },
  );
}

export type WindowScenario = "upcoming" | "open" | "closed";

/**
 * Presenter scenario control: shift one form's window relative to the demo
 * clock so before-open / open / closed states can be shown without changing
 * the real date. Recorded as a demo-control event.
 */
export function setWindowScenario(formId: ID, scenario: WindowScenario) {
  return commit(
    (db, ctx) => {
      const f = db.forms[formId];
      if (!f) ctx.fail("Form not found.");
      const now = Date.parse(ctx.now);
      const day = 86400000;
      const iso = (ms: number) => new Date(ms).toISOString();
      if (scenario === "upcoming") {
        f.opensAt = iso(now + 14 * day);
        f.closesAt = iso(now + 74 * day);
      } else if (scenario === "open") {
        f.opensAt = iso(now - 30 * day);
        f.closesAt = iso(now + 16 * day);
      } else {
        f.opensAt = iso(now - 75 * day);
        f.closesAt = iso(now - 2 * day);
      }
      if (f.status !== "published" && f.publishedVersionId) f.status = "published";
      ctx.audit({ action: "demo.window_scenario", entityType: "form", entityId: formId, cohortId: f.cohortId, actorId: "demo_control", summary: `Demo control: set ${f.title} to “${scenario}”` });
    },
    { allowAnonymous: true },
  );
}

export function currentDemoDate() {
  return nowISO();
}
