"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";
import { buildDigest, sendDigestToOutbox } from "@/lib/actions/messaging";
import { updateNotificationPrefs } from "@/lib/actions/comms";
import { isApplicantOnly } from "@/lib/domain/permissions";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, Notice } from "@/components/ui/display";
import { RadioCards, Switch } from "@/components/ui/form";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";

/**
 * Notification preferences + simulated unread-message digest.
 * Nothing is actually emailed: "Send to outbox" creates a simulated outbox entry.
 */
export function NotificationSettings() {
  const db = useDb();
  const me = useMe()!;
  const [previewOpen, setPreviewOpen] = useState(false);
  const digest = useMemo(() => buildDigest(db, me.id), [db, me.id]);
  const prefs = me.notificationPrefs;
  const applicantOnly = isApplicantOnly(db, me.id);
  const myOutbox = useMemo(
    () =>
      Object.values(db.outbox)
        .filter((e) => e.toUserId === me.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 6),
    [db.outbox, me.id],
  );

  const save = (p: Parameters<typeof updateNotificationPrefs>[0], msg: string) => {
    const r = updateNotificationPrefs(p);
    if (r.ok) toast.success(msg);
    else toast.error(r.error);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Panel>
        <PanelHeader title="Email preferences" description="In-app notifications always appear under the bell. These settings control simulated emails." />
        <div className="space-y-5">
          <Switch
            label="Announcements by email"
            description="A copy of cohort announcements sent to your inbox."
            checked={prefs.emailAnnouncements}
            onCheckedChange={(v) => save({ emailAnnouncements: v }, v ? "Announcement emails on." : "Announcement emails off.")}
          />
          {!applicantOnly && (
            <>
              <Switch
                label="Unread message digest"
                description="A summary of unread conversations instead of an email for every message."
                checked={prefs.digest !== "off"}
                onCheckedChange={(v) => save({ digest: v ? "daily" : "off" }, v ? "Digest turned on (daily)." : "Digest turned off.")}
              />
              {prefs.digest !== "off" && (
                <div>
                  <p className="mb-2 text-[14px] font-medium">Digest frequency</p>
                  <RadioCards
                    name="digest"
                    value={prefs.digest}
                    onChange={(v) => save({ digest: v }, `Digest set to ${v}.`)}
                    options={[
                      { value: "daily", label: "Daily", description: "Around 5pm when you have unread messages" },
                      { value: "weekly", label: "Weekly", description: "Monday mornings" },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Panel>

      <div className="flex flex-col gap-4">
        {!applicantOnly && (
          <Panel>
            <PanelHeader
              title="Digest preview"
              description={digest.items.length ? `${digest.items.length} unread conversation${digest.items.length === 1 ? "" : "s"} right now` : "You're all caught up"}
              actions={
                <Button size="sm" variant="outline" icon={<Mail className="size-4" />} onClick={() => setPreviewOpen(true)}>
                  Preview email
                </Button>
              }
            />
            {digest.items.length ? (
              <ul className="space-y-2">
                {digest.items.map((i) => (
                  <li key={i.conversationId}>
                    <Link href={i.href} className="block rounded-[12px] bg-fog px-3 py-2.5 hover:bg-ash">
                      <span className="flex items-center justify-between gap-2 text-[14px] font-medium">
                        {i.title}
                        <span className="rounded-full bg-jade px-2 text-[12px] tabular">{i.unread}</span>
                      </span>
                      <span className="line-clamp-1 text-[13px] text-muted">{i.latest}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted">When you have unread messages, they&apos;ll be grouped here.</p>
            )}
            <Button
              className="mt-4"
              size="sm"
              variant="dark"
              icon={<Send className="size-4" />}
              disabled={prefs.digest === "off"}
              onClick={() => {
                const r = sendDigestToOutbox();
                if (r.ok) toast.success("Simulated digest added to the email outbox.", { description: "No real email was sent." });
                else toast.error(r.error);
              }}
            >
              Send digest to outbox
            </Button>
          </Panel>
        )}
        <Panel>
          <PanelHeader title="Recent simulated emails" description="What would have been sent to you" />
          {myOutbox.length ? (
            <ul className="divide-y divide-line">
              {myOutbox.map((e) => (
                <li key={e.id} className="py-2.5">
                  <p className="text-[14px] font-medium">{e.subject}</p>
                  <p className="text-[12.5px] text-muted">
                    {fmtDateTime(e.createdAt)} · {e.kind.replace("_", " ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-muted">No simulated emails yet.</p>
          )}
          <Notice className="mt-3" tone="neutral">
            Demo only — emails are simulated and never leave this browser.
          </Notice>
        </Panel>
      </div>

      <DialogRoot open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent title="Digest email preview" description={`To: ${digest.to}`} size="md">
          <div className="rounded-[12px] border border-line">
            <div className="border-b border-line bg-fog px-4 py-3">
              <p className="text-[13px] text-muted">Subject</p>
              <p className="text-[15px] font-semibold">{digest.subject}</p>
            </div>
            <div className="space-y-3 px-4 py-4 text-[14.5px] leading-relaxed">
              <p>Hi {me.firstName},</p>
              {digest.items.length ? (
                <>
                  <p>Here&apos;s your digest of unread messages:</p>
                  <ul className="space-y-2">
                    {digest.items.map((i) => (
                      <li key={i.conversationId} className="rounded-[10px] bg-fog p-3">
                        <p className="font-medium">
                          {i.title} — {i.unread} new
                        </p>
                        <p className="text-[13.5px] text-muted">“{i.latest}”</p>
                        <Link href={i.href} onClick={() => setPreviewOpen(false)} className="text-[13.5px] font-medium underline underline-offset-2">
                          Open conversation
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>You&apos;re all caught up.</p>
              )}
              <p className="text-[12.5px] text-muted">You&apos;re receiving this because your digest is set to {prefs.digest}. Change it in notification settings.</p>
            </div>
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
