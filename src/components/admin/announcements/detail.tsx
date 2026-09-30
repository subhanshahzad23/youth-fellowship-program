"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Bell, CheckCircle2, FileEdit, Loader2, Mail, Pencil, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Announcement } from "@/lib/domain/types";
import { deleteAnnouncementDraft, recipientsFor, sendAnnouncement } from "@/lib/actions/comms";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDateTime, plural, sleep } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, Notice, Panel, PanelHeader } from "@/components/ui/display";
import { Select } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { Paragraphs } from "@/components/ui/rich-text";
import { Denied, RecordNotFound } from "@/components/portal/states";
import { useCrumb } from "@/components/portal/crumbs";
import { EmailPreview, NotificationPreview } from "@/components/announcements/previews";
import { announcementEmailFor } from "@/components/announcements/email";
import { AnnouncementStatusBadge, audienceLabel, canEditAnnouncement, canViewAnnouncement, listableRecipients, RecipientBreakdown, relPast, scopeLabel } from "./shared";

export function AnnouncementDetail({ id }: { id: string }) {
  const db = useDb();
  const me = useMe()!;
  const a = db.announcements[id];
  useCrumb(a?.title);
  if (!a) return <RecordNotFound what="announcement" backHref="/admin/announcements" backLabel="All announcements" detail="It may have been a draft that was deleted, or the demo data was reset." />;
  if (!canViewAnnouncement(db, me.id, a))
    return <Denied reason={`This announcement went to ${scopeLabel(db, a.scope)}, which is outside your assigned scope.`} backHref="/admin/announcements" backLabel="All announcements" />;
  return <Detail a={a} />;
}

function Detail({ a }: { a: Announcement }) {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const router = useRouter();
  const editable = canEditAnnouncement(db, meId, a);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewAs, setPreviewAs] = useState("");

  const sender = db.users[a.senderId];
  const recipients = useMemo(() => (a.status === "draft" ? recipientsFor(db, a.scope, a.audience, meId) : a.recipientIds), [db, a, meId]);
  const stats = useMemo(() => {
    const notes = Object.values(db.notifications).filter((n) => n.kind === "announcement" && n.href.endsWith(`id=${a.id}`));
    return {
      notifications: notes.length,
      read: notes.filter((n) => n.readAt).length,
      emails: Object.values(db.outbox).filter((e) => e.announcementId === a.id).length,
    };
  }, [db.notifications, db.outbox, a.id]);

  // Watch the store: the global ticker flips "sending" → "delivered".
  const prev = useRef(a.status);
  useEffect(() => {
    if (prev.current === "sending" && a.status === "delivered") {
      toast.success(`Delivered to ${plural(a.recipientIds.length, "person", "people")}`, { description: `${stats.notifications} portal notifications · ${stats.emails} simulated emails` });
    }
    prev.current = a.status;
  }, [a.status, a.recipientIds.length, stats.notifications, stats.emails]);

  const listable = useMemo(() => listableRecipients(db, meId, recipients), [db, meId, recipients]);
  const previewId = previewAs && listable.includes(previewAs) ? previewAs : listable[0];
  const email = announcementEmailFor(db, a, previewId);
  const previewUser = previewId ? db.users[previewId] : undefined;

  return (
    <>
      <Link href="/admin/announcements" className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-[8px] pr-2 text-[14px] text-muted hover:text-void">
        <ArrowLeft className="size-4" aria-hidden /> All announcements
      </Link>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <AnnouncementStatusBadge status={a.status} />
            <span className="text-[13.5px] text-muted">
              {scopeLabel(db, a.scope)} · {audienceLabel(a.audience)}
            </span>
          </div>
          <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.035em] sm:text-[42px]">{a.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-[14px] text-muted">
            {sender && <Avatar name={sender.name} hue={sender.avatarHue} size={24} />}
            {sender?.name ?? "Former member"} ·{" "}
            {a.status === "draft" ? `Draft created ${relPast(a.createdAt, now)}` : `Sent ${fmtDateTime(a.sentAt)} UTC`}
          </p>
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
              Delete draft
            </Button>
            <ButtonLink href={`/admin/announcements?edit=${a.id}`} variant="outline" icon={<Pencil className="size-4" />}>
              Edit
            </ButtonLink>
            <Button icon={<Send className="size-4" />} onClick={() => setConfirmSend(true)} disabled={!a.body.trim() || recipients.length === 0}>
              Send
            </Button>
          </div>
        )}
      </header>

      {a.status === "draft" && !editable && (
        <Notice tone="neutral" className="mb-4">
          This draft belongs to a scope you can&apos;t announce to, so you can view it but not send or edit it.
        </Notice>
      )}
      {a.recipientIds.includes(meId) && a.status === "delivered" && (
        <Notice tone="green" className="mb-4" icon={<Bell className="size-4" aria-hidden />}>
          {a.scope === "all" ? "You received this announcement too — it went to fellows and staff across every active cohort." : `You received this announcement as a member of ${scopeLabel(db, a.scope)}.`}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <DeliveryCard a={a} recipients={recipients.length} stats={stats} now={now} />
          <Panel>
            <PanelHeader title="Message" />
            <div className="space-y-3 text-[16px] leading-relaxed text-ink">
              {a.body.trim() ? <Paragraphs text={a.body} /> : <p className="text-muted">No message yet — edit the draft to add one.</p>}
            </div>
          </Panel>
          <Panel>
            <PanelHeader
              title={a.status === "draft" ? `Would reach ${plural(recipients.length, "person", "people")}` : `${plural(recipients.length, "recipient")}`}
              description={a.status === "draft" ? "Calculated now — the list is locked in when you send." : "Locked in when it was sent. Cohorts outside the scope didn't receive it."}
            />
            <RecipientBreakdown ids={recipients} scope={a.scope} delivered={a.status === "delivered"} announcementId={a.status === "delivered" ? a.id : undefined} />
          </Panel>
        </div>

        <Panel className="h-fit">
          <PanelHeader
            title="What recipients see"
            actions={
              listable.length > 1 ? (
                <Select aria-label="Preview as recipient" value={previewId ?? ""} onChange={(e) => setPreviewAs(e.target.value)} className="h-9 w-[180px] text-[13.5px]">
                  {listable
                    .map((id) => db.users[id])
                    .filter(Boolean)
                    .sort((x, y) => x.name.localeCompare(y.name))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </Select>
              ) : undefined
            }
          />
          <p className="eyebrow mb-2 text-muted">Portal notification</p>
          <NotificationPreview title={a.title} body={a.body} when={a.deliveredAt ? relPast(a.deliveredAt, now) : "when delivered"} />
          <p className="eyebrow mb-2 mt-5 text-muted">Email</p>
          <EmailPreview
            email={email}
            note={
              email.outbox
                ? `Delivered to the outbox ${fmtDateTime(email.date)} UTC · simulated`
                : previewUser && !previewUser.notificationPrefs.emailAnnouncements
                  ? `${previewUser.firstName} has announcement emails off — portal only.`
                  : a.status === "delivered"
                    ? "Not emailed — portal notification only"
                    : "Preview · simulated email"
            }
          />
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title={`Send to ${plural(recipients.length, "person", "people")}?`}
        description={`${scopeLabel(db, a.scope)} · ${audienceLabel(a.audience).toLowerCase()}`}
        confirmLabel="Send announcement"
        confirmVariant="primary"
        onConfirm={async () => {
          await sleep(500);
          const r = sendAnnouncement(a.id);
          if (!r.ok) {
            toast.error(r.error);
            return false;
          }
          toast.success(`Sending to ${plural(r.value, "person", "people")}…`);
        }}
      >
        <p className="text-[14px] leading-relaxed">
          <span className="font-semibold">“{a.title}”</span> goes to the portal bell for everyone listed and by simulated email to those who opted in. It can&apos;t be edited or recalled afterwards.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this draft?"
        description="Drafts were never sent, so nobody has seen it."
        confirmLabel="Delete draft"
        confirmVariant="danger"
        onConfirm={async () => {
          await sleep(300);
          const r = deleteAnnouncementDraft(a.id);
          if (!r.ok) {
            toast.error(r.error);
            return false;
          }
          toast.success("Draft deleted");
          router.push("/admin/announcements");
        }}
      />
    </>
  );
}

function DeliveryCard({ a, recipients, stats, now }: { a: Announcement; recipients: number; stats: { notifications: number; read: number; emails: number }; now: string }) {
  if (a.status === "draft")
    return (
      <Panel className="border-[1.5px] border-dashed border-[#c9ced3] bg-transparent">
        <p className="inline-flex items-center gap-2 text-[15px] font-semibold">
          <FileEdit className="size-4" aria-hidden /> Not sent yet
        </p>
        <p className="mt-1 text-[14px] text-muted">Only admins can see drafts. Sending locks the recipient list ({plural(recipients, "person", "people")} right now) and delivers within a few seconds.</p>
      </Panel>
    );
  if (a.status === "sending")
    return (
      <Panel className="dots-dark text-paper" aria-live="polite">
        <p className="inline-flex items-center gap-2 text-[15px] font-semibold">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Sending to {plural(a.recipientIds.length, "person", "people")}…
        </p>
        <p className="mt-1 text-[14px] text-paper/70">Creating portal notifications and simulated emails.</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
          <motion.div className="h-full w-1/3 rounded-full bg-jade" initial={{ x: "-100%" }} animate={{ x: "300%" }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </Panel>
    );
  return (
    <Panel aria-live="polite">
      <p className="inline-flex items-center gap-2 text-[15px] font-semibold">
        <CheckCircle2 className="size-4 text-leaf-ink" aria-hidden /> Delivered {relPast(a.deliveredAt, now)}
      </p>
      <p className="mt-0.5 text-[13.5px] text-muted">{fmtDateTime(a.deliveredAt)} UTC</p>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        {[
          [Users, "Recipients", a.recipientIds.length],
          [Bell, "Opened", `${stats.read} / ${stats.notifications}`],
          [Mail, "Emailed", stats.emails],
        ].map(([Icon, label, value]) => {
          const I = Icon as typeof Users;
          return (
            <div key={label as string} className="rounded-[12px] bg-fog px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-[12.5px] text-muted">
                <I className="size-3.5" aria-hidden />
                <span className="truncate">{label as string}</span>
              </dt>
              <dd className="mt-0.5 font-display text-[26px] leading-none tracking-[-0.03em] tabular">{value as string | number}</dd>
            </div>
          );
        })}
      </dl>
    </Panel>
  );
}
