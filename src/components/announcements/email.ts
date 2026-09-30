import type { Announcement, Database, ID, OutboxEmail } from "@/lib/domain/types";

export const FROM_ADDRESS = "announcements@launchpad-fellowship.example";
export const ORG_NAME = "Launchpad Fellowship";

/** Mirrors the body text processSendingAnnouncements() writes to the outbox. */
export function announcementEmailBody(firstName: string, body: string, senderName: string) {
  return `Hi ${firstName},\n\n${body}\n\n— ${senderName}, Launchpad Fellowship`;
}

export interface EmlInput {
  id: string;
  fromName: string;
  toName: string;
  toEmail: string;
  subject: string;
  date: string; // ISO
  bodyText: string;
}

/** RFC 2047 encoded-word for non-ASCII header values. */
function encodeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const bytes = new TextEncoder().encode(value);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `=?UTF-8?B?${btoa(bin)}?=`;
}

/** "Amira Hassan via Launchpad Fellowship", or just the org name for system emails. */
export function displayFrom(fromName: string) {
  return fromName === ORG_NAME ? ORG_NAME : `${fromName} via ${ORG_NAME}`;
}

function quoteName(name: string) {
  return `"${encodeHeader(name).replace(/"/g, "'")}"`;
}

/** A standards-shaped .eml file (plain text, UTF-8, CRLF line endings) that opens in any mail client. */
export function buildEml(e: EmlInput) {
  const headers = [
    `From: ${quoteName(displayFrom(e.fromName))} <${FROM_ADDRESS}>`,
    `To: ${quoteName(e.toName)} <${e.toEmail}>`,
    `Subject: ${encodeHeader(e.subject)}`,
    `Date: ${new Date(e.date).toUTCString()}`,
    `Message-ID: <${e.id.replace(/[^a-zA-Z0-9._-]/g, "")}@launchpad-fellowship.example>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "X-Launchpad-Demo: simulated email - fictional data, never sent",
  ];
  const body = `${e.bodyText}\n\n--\nThis is a simulated email from the Launchpad Fellowship demo. Nothing was actually sent.`;
  return `${headers.join("\r\n")}\r\n\r\n${body.replace(/\r?\n/g, "\r\n")}\r\n`;
}

export function emlFileName(subject: string, suffix?: string) {
  const slug = subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
  return `${slug || "email"}${suffix ? `-${suffix}` : ""}.eml`;
}

/** Any simulated outbox email as an .eml input. */
export function outboxEml(db: Database, e: OutboxEmail): EmlInput {
  const an = e.announcementId ? db.announcements[e.announcementId] : undefined;
  return { id: e.id, fromName: an ? db.users[an.senderId]?.name ?? ORG_NAME : ORG_NAME, toName: e.toName, toEmail: e.toEmail, subject: e.subject, date: e.createdAt, bodyText: e.bodyText };
}

/** The email a given recipient receives (or would receive) for an announcement. */
export function announcementEmailFor(db: Database, a: Announcement, recipientId: ID | undefined): EmlInput & { outbox?: OutboxEmail } {
  const sender = db.users[a.senderId];
  const r = recipientId ? db.users[recipientId] : undefined;
  const sent = recipientId ? Object.values(db.outbox).find((e) => e.announcementId === a.id && e.toUserId === recipientId) : undefined;
  if (sent)
    return { id: sent.id, fromName: sender?.name ?? "Launchpad Fellowship", toName: sent.toName, toEmail: sent.toEmail, subject: sent.subject, date: sent.createdAt, bodyText: sent.bodyText, outbox: sent };
  return {
    id: `${a.id}.${recipientId ?? "preview"}`,
    fromName: sender?.name ?? "Launchpad Fellowship",
    toName: r?.name ?? "Fellow",
    toEmail: r?.email ?? "fellow@example.org",
    subject: a.title || "(no subject)",
    date: a.deliveredAt ?? a.sentAt ?? a.createdAt,
    bodyText: announcementEmailBody(r?.firstName ?? "there", a.body, sender?.name ?? "Launchpad Fellowship"),
  };
}
