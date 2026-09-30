"use client";

import type { Draft } from "immer";
import type { Conversation, Database, ID, MessageAttachment, MessageReport } from "@/lib/domain/types";
import { adminCohortIds, canMessage, canModerate, conversationAccess, isAssignedMentor } from "@/lib/domain/permissions";
import { conversationTitle, messagesOf, unreadIn, userName, visibleConversations } from "@/lib/domain/selectors";
import { matchRules, MODERATION_RULES } from "@/lib/sim/moderation";
import { SCRIPTED_REPLIES } from "@/lib/seed/messaging";
import { commit, useDemoStore } from "@/lib/store/store";
import { nowISO } from "@/lib/clock";
import { fmtDateTime, hashString, uid } from "@/lib/utils";

type D = Draft<Database>;

const PERSONA_IDS = new Set(["u_maya", "u_amira", "u_noah", "u_elena", "u_daniel", "u_priya"]);
export const REPLY_DELAY_MS = 3200;

function appendMessage(db: D, convId: ID, senderId: ID, body: string, now: string, attachments: MessageAttachment[] = [], simulated = false) {
  const id = uid("msg");
  const flag = matchRules(body);
  db.messages[id] = {
    id,
    conversationId: convId,
    senderId,
    body,
    attachments,
    sentAt: now,
    readBy: { [senderId]: now },
    autoFlag: flag ? { rule: flag.rule.id, matched: flag.matched, at: now } : undefined,
    simulated: simulated || undefined,
  };
  db.conversations[convId].lastMessageAt = now;
  return { id, flag };
}

function notifyRecipients(db: D, conv: Draft<Conversation>, senderId: ID, preview: string, notify: (n: { userId: ID; kind: "message"; title: string; body: string; href: string }) => void) {
  for (const p of conv.participantIds) {
    if (p === senderId) continue;
    // One unread notification per conversation per person keeps the bell calm.
    const hasUnread = Object.values(db.notifications).some((n) => n.userId === p && n.kind === "message" && !n.readAt && n.href.endsWith(`c=${conv.id}`));
    if (hasUnread) continue;
    const u = db.users[p];
    const base = u?.staffRoles.length ? (u.staffRoles.some((r) => r === "executive_admin" || r === "program_admin") ? "/admin" : "/staff") : "/workspace";
    notify({ userId: p, kind: "message", title: `New message from ${db.users[senderId]?.name}`, body: preview.slice(0, 120), href: `${base}/messages?c=${conv.id}` });
  }
}

function autoReport(db: D, convId: ID, messageId: ID, rule: string, matched: string, now: string, notify: (n: { userId: ID; kind: "moderation"; title: string; body: string; href: string }) => void) {
  const conv = db.conversations[convId];
  const r = MODERATION_RULES.find((x) => x.id === rule);
  const id = uid("rp");
  db.reports[id] = {
    id,
    messageId,
    conversationId: convId,
    cohortId: conv.cohortId,
    source: "keyword_rule",
    reason: r?.label ?? "Keyword rule",
    details: `Automatic flag: matched “${matched}”.`,
    status: "open",
    createdAt: now,
    history: [{ at: now, action: `Keyword rule “${r?.label}” matched “${matched}”` }],
  };
  for (const uidAdmin of adminsFor(db, conv.cohortId))
    notify({ userId: uidAdmin, kind: "moderation", title: `A message was flagged in ${db.cohorts[conv.cohortId]?.name}`, body: `Rule: ${r?.label}`, href: `/admin/safeguarding?r=${id}` });
}

function adminsFor(db: D, cohortId: ID) {
  return Object.values(db.users)
    .filter((u) => adminCohortIds(db as Database, u.id).includes(cohortId))
    .map((u) => u.id);
}

function scheduleReply(db: D, convId: ID, senderId: ID, triggerId: ID, nowMs: number) {
  const conv = db.conversations[convId];
  if (conv.kind === "group" || db.repliedConversations[convId]) return;
  if (Object.values(db.pendingReplies).some((p) => p.conversationId === convId)) return;
  const other = conv.participantIds.find((p) => p !== senderId);
  if (!other || PERSONA_IDS.has(other)) return; // walkthrough personas reply for themselves
  const pool = SCRIPTED_REPLIES[other] ?? SCRIPTED_REPLIES.default;
  const body = pool[hashString(convId) % pool.length];
  const id = uid("pr");
  db.pendingReplies[id] = { id, conversationId: convId, fromId: other, body, dueAt: new Date(nowMs + REPLY_DELAY_MS).toISOString(), triggeredByMessageId: triggerId };
}

/* ------------------------------------------------------------------ */
/* Sending                                                             */
/* ------------------------------------------------------------------ */

export function sendMessage(convId: ID, body: string, attachments: MessageAttachment[] = []) {
  return commit((db, ctx) => {
    const conv = db.conversations[convId];
    if (!conv) ctx.fail("Conversation not found.");
    const access = conversationAccess(db as Database, ctx.actorId, conv as Conversation);
    if (!access.view) ctx.fail(access.reason ?? "You can't view this conversation.");
    if (!access.send) ctx.fail(access.readOnlyReason ?? "You can't send messages here.");
    const text = body.trim();
    if (!text && !attachments.length) ctx.fail("Write a message first.");
    if (text.length > 2000) ctx.fail("Messages are limited to 2,000 characters.");
    const { id, flag } = appendMessage(db, convId, ctx.actorId, text, ctx.now, attachments);
    notifyRecipients(db, conv, ctx.actorId, text || "Sent an attachment", ctx.notify);
    if (flag) autoReport(db, convId, id, flag.rule.id, flag.matched, ctx.now, ctx.notify);
    scheduleReply(db, convId, ctx.actorId, id, Date.parse(ctx.now));
    return { id, flagged: !!flag };
  });
}

/** Start (or reuse) a one-to-one conversation. Recipient eligibility is re-checked here, not just in the picker. */
export function startConversation(recipientId: ID, body: string, attachments: MessageAttachment[] = []) {
  return commit((db, ctx) => {
    const d = canMessage(db as Database, ctx.actorId, recipientId);
    if (!d.ok) ctx.fail(d.reason);
    const text = body.trim();
    if (!text && !attachments.length) ctx.fail("Write a message first.");
    let conv = Object.values(db.conversations).find(
      (c) => c.kind !== "group" && c.participantIds.length === 2 && c.participantIds.includes(ctx.actorId) && c.participantIds.includes(recipientId),
    );
    if (!conv) {
      const id = uid("cv");
      const mentorPair = isAssignedMentor(db as Database, ctx.actorId, recipientId) || isAssignedMentor(db as Database, recipientId, ctx.actorId);
      db.conversations[id] = { id, kind: mentorPair ? "mentor" : "direct", cohortId: d.cohortId!, participantIds: [ctx.actorId, recipientId], createdAt: ctx.now, createdById: ctx.actorId, lastMessageAt: ctx.now };
      conv = db.conversations[id];
      ctx.audit({ action: "conversation.start", entityType: "conversation", entityId: id, cohortId: d.cohortId, summary: `Started a conversation with ${db.users[recipientId]?.name}` });
    }
    const { id: msgId, flag } = appendMessage(db, conv.id, ctx.actorId, text, ctx.now, attachments);
    notifyRecipients(db, conv, ctx.actorId, text, ctx.notify);
    if (flag) autoReport(db, conv.id, msgId, flag.rule.id, flag.matched, ctx.now, ctx.notify);
    scheduleReply(db, conv.id, ctx.actorId, msgId, Date.parse(ctx.now));
    return conv.id;
  });
}

/** Deliver scripted replies whose delay has passed. Safe to call repeatedly (idempotent). */
export function processDueReplies() {
  const { db, hydrated } = useDemoStore.getState();
  if (!hydrated) return;
  const now = nowISO();
  const due = Object.values(db.pendingReplies).filter((p) => p.dueAt <= now);
  if (!due.length) return;
  commit(
    (d, ctx) => {
      for (const p of due) {
        if (!d.pendingReplies[p.id]) continue;
        delete d.pendingReplies[p.id];
        if (d.repliedConversations[p.conversationId] || !d.conversations[p.conversationId]) continue;
        d.repliedConversations[p.conversationId] = true;
        appendMessage(d, p.conversationId, p.fromId, p.body, ctx.now, [], true);
        notifyRecipients(d, d.conversations[p.conversationId], p.fromId, p.body, ctx.notify);
      }
    },
    { allowAnonymous: true },
  );
}

export function markConversationRead(convId: ID) {
  const { db, personaId } = useDemoStore.getState();
  if (!personaId) return;
  const conv = db.conversations[convId];
  if (!conv || !conv.participantIds.includes(personaId)) return; // supervisors don't change read state
  const needs = unreadIn(db, personaId, convId) > 0 || Object.values(db.notifications).some((n) => n.userId === personaId && !n.readAt && n.href.endsWith(`c=${convId}`));
  if (!needs) return;
  commit((d, ctx) => {
    for (const m of Object.values(d.messages)) if (m.conversationId === convId && !m.readBy[ctx.actorId]) m.readBy[ctx.actorId] = ctx.now;
    for (const n of Object.values(d.notifications)) if (n.userId === ctx.actorId && !n.readAt && n.href.endsWith(`c=${convId}`)) n.readAt = ctx.now;
  });
}

export function toggleReaction(messageId: ID, emoji: string) {
  return commit((db, ctx) => {
    const m = db.messages[messageId];
    if (!m) ctx.fail("Message not found.");
    const access = conversationAccess(db as Database, ctx.actorId, db.conversations[m.conversationId] as Conversation);
    if (access.mode !== "participant") ctx.fail("Only participants can react.");
    m.reactions ??= {};
    const list = m.reactions[emoji] ?? [];
    m.reactions[emoji] = list.includes(ctx.actorId) ? list.filter((x) => x !== ctx.actorId) : [...list, ctx.actorId];
    if (!m.reactions[emoji].length) delete m.reactions[emoji];
  });
}

/* ------------------------------------------------------------------ */
/* Reporting and moderation                                            */
/* ------------------------------------------------------------------ */

export function reportMessage(messageId: ID, reason: string, details: string) {
  return commit((db, ctx) => {
    const m = db.messages[messageId];
    if (!m) ctx.fail("Message not found.");
    const conv = db.conversations[m.conversationId];
    if (!conv.participantIds.includes(ctx.actorId)) ctx.fail("Only participants can report messages.");
    if (m.senderId === ctx.actorId) ctx.fail("You can't report your own message.");
    if (Object.values(db.reports).some((r) => r.messageId === messageId && r.reporterId === ctx.actorId && r.status !== "resolved")) ctx.fail("You've already reported this message. The program team is looking at it.");
    const existing = Object.values(db.reports).find((r) => r.messageId === messageId && r.status !== "resolved");
    let id: ID;
    if (existing) {
      existing.reporterId ??= ctx.actorId;
      existing.source = "participant";
      existing.history.push({ at: ctx.now, byId: ctx.actorId, action: "Reported by participant", note: reason });
      id = existing.id;
    } else {
      id = uid("rp");
      db.reports[id] = {
        id,
        messageId,
        conversationId: conv.id,
        cohortId: conv.cohortId,
        reporterId: ctx.actorId,
        source: "participant",
        reason,
        details: details.trim() || undefined,
        status: "open",
        createdAt: ctx.now,
        history: [{ at: ctx.now, byId: ctx.actorId, action: "Reported by participant", note: reason }],
      };
    }
    for (const a of adminsFor(db, conv.cohortId))
      ctx.notify({ userId: a, kind: "moderation", title: `A message was reported in ${db.cohorts[conv.cohortId]?.name}`, body: `${db.users[ctx.actorId]?.name}: ${reason}`, href: `/admin/safeguarding?r=${id}` });
    ctx.audit({ action: "report.create", entityType: "report", entityId: id, cohortId: conv.cohortId, summary: `Reported a message in ${conversationTitle(db as Database, conv as Conversation, ctx.actorId)} (${reason})` });
    return id;
  });
}

function reportForModeration(db: D, reportId: ID, actorId: ID, fail: (r: string) => never) {
  const r = db.reports[reportId];
  if (!r) fail("Report not found.");
  const d = canModerate(db as Database, actorId, r!.cohortId);
  if (!d.ok) fail(d.reason);
  return r!;
}

export function startReportReview(reportId: ID) {
  return commit((db, ctx) => {
    const r = reportForModeration(db, reportId, ctx.actorId, ctx.fail);
    if (r.status !== "open") return;
    r.status = "in_review";
    r.assignedToId = ctx.actorId;
    r.history.push({ at: ctx.now, byId: ctx.actorId, action: "Review started" });
    ctx.audit({ action: "report.review", entityType: "report", entityId: r.id, cohortId: r.cohortId, summary: "Started reviewing a reported message" });
  });
}

export function hideMessage(messageId: ID, reason: string, reportId?: ID) {
  return commit((db, ctx) => {
    const m = db.messages[messageId];
    if (!m) ctx.fail("Message not found.");
    const conv = db.conversations[m.conversationId];
    const d = canModerate(db as Database, ctx.actorId, conv.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    if (!reason.trim()) ctx.fail("Record a reason for hiding the message.");
    if (m.hidden) ctx.fail("This message is already hidden.");
    m.hidden = { byId: ctx.actorId, reason: reason.trim(), at: ctx.now };
    const r = reportId ? db.reports[reportId] : Object.values(db.reports).find((x) => x.messageId === messageId && x.status !== "resolved");
    if (r) {
      if (r.status === "open") r.status = "in_review";
      r.assignedToId ??= ctx.actorId;
      r.history.push({ at: ctx.now, byId: ctx.actorId, action: "Message hidden", note: reason.trim() });
    }
    ctx.audit({ action: "message.hide", entityType: "message", entityId: messageId, cohortId: conv.cohortId, summary: `Hid a message from ${db.users[m.senderId]?.name}: ${reason.trim()}` });
  });
}

export function restoreMessage(messageId: ID, note: string) {
  return commit((db, ctx) => {
    const m = db.messages[messageId];
    if (!m || !m.hidden) ctx.fail("This message isn't hidden.");
    const conv = db.conversations[m!.conversationId];
    const d = canModerate(db as Database, ctx.actorId, conv.cohortId);
    if (!d.ok) ctx.fail(d.reason);
    const prev = m!.hidden;
    m!.hidden = undefined;
    const r = Object.values(db.reports).find((x) => x.messageId === messageId);
    r?.history.push({ at: ctx.now, byId: ctx.actorId, action: "Message restored", note: note.trim() || undefined });
    ctx.audit({ action: "message.restore", entityType: "message", entityId: messageId, cohortId: conv.cohortId, summary: `Restored a message hidden on ${fmtDateTime(prev?.at)}${note.trim() ? `: ${note.trim()}` : ""}` });
  });
}

export function resolveReport(reportId: ID, outcome: NonNullable<MessageReport["resolution"]>["outcome"], note: string) {
  return commit((db, ctx) => {
    const r = reportForModeration(db, reportId, ctx.actorId, ctx.fail);
    if (r.status === "resolved") ctx.fail("This report is already resolved.");
    if (!note.trim()) ctx.fail("Add a short resolution note for the record.");
    r.status = "resolved";
    r.resolution = { outcome, note: note.trim(), byId: ctx.actorId, at: ctx.now };
    r.history.push({ at: ctx.now, byId: ctx.actorId, action: "Resolved", note: note.trim() });
    if (r.reporterId)
      ctx.notify({ userId: r.reporterId, kind: "moderation", title: "Your report has been reviewed", body: "Thank you for flagging it. The program team has taken appropriate action.", href: `/workspace/messages?c=${r.conversationId}` });
    ctx.audit({ action: "report.resolve", entityType: "report", entityId: r.id, cohortId: r.cohortId, summary: `Resolved report (${outcome.replace("_", " ")}): ${note.trim()}` });
  });
}

/* ------------------------------------------------------------------ */
/* Export and digest                                                   */
/* ------------------------------------------------------------------ */

export type ExportFormat = "json" | "csv" | "html";

/**
 * Scoped export for supervisors. Includes moderation metadata and the
 * original text of hidden messages (authorized record). Records an audit event.
 */
export function exportConversations(convIds: ID[], format: ExportFormat): { ok: true; content: string; fileName: string; mime: string } | { ok: false; error: string } {
  const { db, personaId } = useDemoStore.getState();
  if (!personaId) return { ok: false, error: "Choose an identity first." };
  const allowed = convIds.filter((id) => db.conversations[id] && canModerate(db, personaId, db.conversations[id].cohortId).ok);
  if (!allowed.length) return { ok: false, error: "None of the selected conversations are within your supervision scope." };
  const exportedAt = nowISO();
  const exporter = db.users[personaId];
  const data = allowed.map((id) => {
    const c = db.conversations[id];
    return {
      conversationId: c.id,
      title: conversationTitle(db, c, null),
      kind: c.kind,
      cohort: db.cohorts[c.cohortId]?.name,
      participants: c.participantIds.map((p) => ({ id: p, name: userName(db, p) })),
      messages: messagesOf(db, id).map((m) => ({
        id: m.id,
        sentAt: m.sentAt,
        sender: userName(db, m.senderId),
        body: m.body,
        attachments: m.attachments.map((a) => a.name),
        hidden: m.hidden ? { by: userName(db, m.hidden.byId), reason: m.hidden.reason, at: m.hidden.at } : null,
        autoFlag: m.autoFlag ? { rule: m.autoFlag.rule, matched: m.autoFlag.matched } : null,
        reports: Object.values(db.reports)
          .filter((r) => r.messageId === m.id)
          .map((r) => ({ id: r.id, status: r.status, reason: r.reason, resolution: r.resolution?.outcome ?? null })),
      })),
    };
  });
  const meta = {
    generatedAt: exportedAt,
    generatedBy: `${exporter?.name} (${exporter?.title ?? "admin"})`,
    scope: [...new Set(allowed.map((id) => db.cohorts[db.conversations[id].cohortId]?.name))].join(", "),
    conversationCount: allowed.length,
    messageCount: data.reduce((n, c) => n + c.messages.length, 0),
    notice: "Launchpad Fellowship demo — all people and messages are fictional. Hidden messages are included with moderation metadata.",
  };
  const stamp = exportedAt.slice(0, 10);
  let content = "";
  let mime = "application/json";
  let ext = "json";
  if (format === "json") {
    content = JSON.stringify({ meta, conversations: data }, null, 2);
  } else if (format === "csv") {
    mime = "text/csv";
    ext = "csv";
    const rows = [["conversation_id", "conversation", "cohort", "sent_at", "sender", "message", "hidden", "hidden_reason", "auto_flag", "report_status"]];
    for (const c of data)
      for (const m of c.messages)
        rows.push([c.conversationId, c.title, c.cohort ?? "", m.sentAt, m.sender, m.body, m.hidden ? "yes" : "no", m.hidden?.reason ?? "", m.autoFlag?.rule ?? "", m.reports.map((r) => r.status).join("; ")]);
    content = `# ${meta.notice}\n# Generated ${meta.generatedAt} by ${meta.generatedBy}; scope: ${meta.scope}\n` + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  } else {
    mime = "text/html";
    ext = "html";
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    content = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Conversation transcript — ${esc(meta.scope)}</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;color:#111}h1{font-weight:400;font-size:28px}h2{font-size:18px;margin-top:32px;border-top:1px solid #ddd;padding-top:16px}.meta{color:#555;font-size:13px}.m{margin:10px 0;padding:10px 12px;background:#f3f3f3;border-radius:8px}.m.h{background:#fff4d6}.s{font-weight:600}.t{color:#666;font-size:12px}.flag{color:#a3161a;font-size:12px}@media print{.m{break-inside:avoid}}</style></head><body><h1>Conversation transcript</h1><p class="meta">${esc(meta.notice)}<br>Generated ${esc(fmtDateTime(meta.generatedAt))} UTC by ${esc(meta.generatedBy)} · Scope: ${esc(meta.scope)} · ${meta.conversationCount} conversations, ${meta.messageCount} messages</p>${data
      .map(
        (c) =>
          `<h2>${esc(c.title)} <span class="meta">(${esc(c.cohort ?? "")} · ${c.kind})</span></h2><p class="meta">Participants: ${c.participants.map((p) => esc(p.name)).join(", ")}</p>${c.messages
            .map(
              (m) =>
                `<div class="m${m.hidden ? " h" : ""}"><span class="s">${esc(m.sender)}</span> <span class="t">${esc(fmtDateTime(m.sentAt))}</span><div>${esc(m.body)}</div>${m.attachments.length ? `<div class="t">Attachments: ${m.attachments.map(esc).join(", ")}</div>` : ""}${m.hidden ? `<div class="flag">Hidden from participants by ${esc(m.hidden.by)}: ${esc(m.hidden.reason)}</div>` : ""}${m.autoFlag ? `<div class="flag">Keyword rule: ${esc(m.autoFlag.rule)} (“${esc(m.autoFlag.matched)}”)</div>` : ""}</div>`,
            )
            .join("")}`,
      )
      .join("")}</body></html>`;
  }
  const fileName = `launchpad-conversations-${stamp}.${ext}`;
  commit((_d, ctx) =>
    ctx.audit({
      action: "export.conversations",
      entityType: "export",
      entityId: uid("exp"),
      cohortId: allowed.length ? db.conversations[allowed[0]].cohortId : undefined,
      summary: `Exported ${allowed.length} conversation${allowed.length === 1 ? "" : "s"} (${format.toUpperCase()}) — ${meta.scope}`,
      meta: { format, conversations: allowed.length, messages: meta.messageCount },
    }),
  );
  return { ok: true, content, fileName, mime };
}

export interface DigestPreview {
  to: string;
  subject: string;
  items: { conversationId: ID; title: string; unread: number; latest: string; href: string }[];
  bodyText: string;
}

export function buildDigest(db: Database, userId: ID): DigestPreview {
  const u = db.users[userId];
  const base = u?.staffRoles.some((r) => r === "executive_admin" || r === "program_admin") ? "/admin" : u?.staffRoles.length ? "/staff" : "/workspace";
  const items = visibleConversations(db, userId, "inbox")
    .map((c) => {
      const unread = unreadIn(db, userId, c.id);
      const last = messagesOf(db, c.id).filter((m) => m.senderId !== userId).slice(-1)[0];
      return { conversationId: c.id, title: conversationTitle(db, c, userId), unread, latest: last ? (last.hidden ? "Message hidden by the program team" : last.body.slice(0, 90)) : "", href: `${base}/messages?c=${c.id}` };
    })
    .filter((i) => i.unread > 0);
  const subject = items.length ? `You have ${items.length} unread conversation${items.length === 1 ? "" : "s"}` : "No unread messages today";
  const bodyText = `Hi ${u?.firstName},\n\n${items.length ? "Here's your digest of unread messages:\n\n" + items.map((i) => `• ${i.title} — ${i.unread} new: “${i.latest}”\n  Open: ${i.href}`).join("\n") : "You're all caught up."}\n\nYou're receiving this because your digest is set to ${u?.notificationPrefs.digest}. Change it in notification settings.\n\nLaunchpad Fellowship`;
  return { to: `${u?.name} <${u?.email}>`, subject, items, bodyText };
}

export function sendDigestToOutbox() {
  return commit((db, ctx) => {
    const u = db.users[ctx.actorId];
    if (!u) ctx.fail("Choose an identity first.");
    if (u.notificationPrefs.digest === "off") ctx.fail("Your digest is turned off. Choose daily or weekly first.");
    const d = buildDigest(db as Database, ctx.actorId);
    ctx.email({ toUserId: u.id, toEmail: u.email, toName: u.name, subject: d.subject, preview: d.items[0]?.latest ?? "You're all caught up.", bodyText: d.bodyText, kind: "digest", relatedHref: d.items[0]?.href ?? "/" });
    return d.items.length;
  });
}
