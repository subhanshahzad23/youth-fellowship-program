"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import type { Announcement, ID } from "@/lib/domain/types";
import { recipientsFor, saveAnnouncementDraft, sendAnnouncement } from "@/lib/actions/comms";
import { adminCohortIds, canAnnounce } from "@/lib/domain/permissions";
import { sortedCohorts } from "@/lib/domain/selectors";
import { useUnsavedChangesGuard } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { fmtRelative, plural, sleep } from "@/lib/utils";
import { useNow } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Notice, Panel, PanelHeader } from "@/components/ui/display";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ConfirmDialog, Segmented } from "@/components/ui/overlay";
import { EmailPreview, NotificationPreview } from "@/components/announcements/previews";
import { announcementEmailBody } from "@/components/announcements/email";
import { RecipientBreakdown, scopeLabel } from "./shared";

const TITLE_MAX = 90;
const BODY_MAX = 2000;

export function AnnouncementComposer({ editId, presetScope }: { editId?: ID; presetScope?: string }) {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const router = useRouter();
  const topFilter = useUI((s) => s.adminCohortFilter);

  const scopes = useMemo(() => {
    const opts: { value: "all" | ID; label: string }[] = [];
    if (canAnnounce(db, meId, "all").ok) opts.push({ value: "all", label: "All cohorts" });
    const mine = adminCohortIds(db, meId);
    for (const c of sortedCohorts(db)) if (mine.includes(c.id) && canAnnounce(db, meId, c.id).ok) opts.push({ value: c.id, label: c.name });
    return opts;
  }, [db, meId]);

  const existing = editId ? db.announcements[editId] : undefined;
  const editable = existing && existing.status === "draft" && canAnnounce(db, meId, existing.scope).ok ? existing : undefined;

  const [draftId, setDraftId] = useState<ID | undefined>(editable?.id);
  const [title, setTitle] = useState(editable?.title ?? "");
  const [body, setBody] = useState(editable?.body ?? "");
  const [scope, setScope] = useState<"all" | ID>(() => {
    if (editable) return editable.scope;
    const pick = [presetScope, topFilter !== "all" ? topFilter : undefined].find((s) => s && scopes.some((o) => o.value === s));
    return pick ?? scopes.find((o) => o.value !== "all")?.value ?? scopes[0]?.value ?? "all";
  });
  const [audience, setAudience] = useState<Announcement["audience"]>(editable?.audience ?? "fellows");
  const [saved, setSaved] = useState(() => JSON.stringify({ title: editable?.title ?? "", body: editable?.body ?? "", scope: editable?.scope, audience: editable?.audience ?? "fellows" }));
  const [tried, setTried] = useState<"draft" | "send" | null>(null);
  const [busy, setBusy] = useState<"draft" | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [previewAs, setPreviewAs] = useState<ID | "">("");

  const recipients = useMemo(() => recipientsFor(db, scope, audience, meId), [db, scope, audience, meId]);
  const current = JSON.stringify({ title, body, scope, audience });
  const dirty = current !== saved && (title.trim() !== "" || body.trim() !== "");
  useUnsavedChangesGuard(dirty);

  const errors = {
    title: !title.trim() ? "Add a title." : title.length > TITLE_MAX ? `Keep the title under ${TITLE_MAX} characters.` : undefined,
    body: tried === "send" && !body.trim() ? "Write the message before sending." : body.length > BODY_MAX ? `Keep the message under ${BODY_MAX} characters.` : undefined,
    audience: tried === "send" && recipients.length === 0 ? "There's nobody in that audience yet." : undefined,
  };

  const previewId = previewAs && recipients.includes(previewAs) ? previewAs : recipients[0];
  const previewUser = previewId ? db.users[previewId] : undefined;

  if (!scopes.length)
    return (
      <Panel>
        <Notice tone="amber" title="You can't send announcements">
          Announcements go to cohorts you manage. You aren&apos;t assigned to any cohort yet.
        </Notice>
      </Panel>
    );

  const persist = () => saveAnnouncementDraft({ id: draftId, scope, audience, title, body });

  const saveDraft = async () => {
    setTried("draft");
    if (errors.title || (body.length > BODY_MAX)) return;
    setBusy("draft");
    await sleep(350);
    const r = persist();
    setBusy(null);
    if (!r.ok) return void toast.error(r.error);
    setDraftId(r.value);
    setSaved(current);
    toast.success(draftId ? "Draft updated" : "Draft saved", { description: "Only admins can see drafts. Nothing has been sent." });
    if (!draftId) router.replace(`/admin/announcements?edit=${r.value}`, { scroll: false });
  };

  const openSend = () => {
    setTried("send");
    if (errors.title || !body.trim() || body.length > BODY_MAX || recipients.length === 0) return;
    setConfirm(true);
  };

  const send = async () => {
    await sleep(500);
    const r1 = persist();
    if (!r1.ok) {
      toast.error(r1.error);
      return false;
    }
    setDraftId(r1.value);
    const r2 = sendAnnouncement(r1.value);
    if (!r2.ok) {
      toast.error(r2.error, { description: "Your text is saved as a draft." });
      return false;
    }
    setSaved(current);
    toast.success(`Sending to ${plural(r2.value, "person", "people")}…`, { description: "Portal notifications and simulated emails go out in a moment." });
    router.push(`/admin/announcements?id=${r1.value}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <Panel>
        <PanelHeader
          title={draftId ? "Edit draft" : "New announcement"}
          description={draftId ? (dirty ? "Unsaved changes" : `Draft saved${existing ? ` · created ${fmtRelative(existing.createdAt, now)}` : ""}`) : "Goes to the portal bell and, for people who opted in, by email."}
          actions={
            draftId ? (
              <Button size="sm" variant="ghost" icon={<FilePlus2 className="size-3.5" />} onClick={() => router.push("/admin/announcements")}>
                New
              </Button>
            ) : undefined
          }
        />
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            openSend();
          }}
          className="grid grid-cols-1 gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Send to" required htmlFor="an-scope">
              <Select id="an-scope" value={scope} onChange={(e) => setScope(e.target.value)}>
                {scopes.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Audience" required error={errors.audience}>
              <Segmented
                label="Audience"
                value={audience}
                onChange={setAudience}
                className="h-11 w-full [&>button]:h-9 [&>button]:flex-1"
                options={[
                  { value: "fellows", label: "Fellows" },
                  { value: "fellows_and_staff", label: "Fellows + staff" },
                ]}
              />
            </Field>
          </div>
          {!scopes.some((s) => s.value === "all") && (
            <p className="-mt-2 text-[12.5px] text-muted">You can announce to the cohorts you manage. Announcements to every cohort are sent by the executive team.</p>
          )}
          <Field label="Title" required htmlFor="an-title" error={tried ? errors.title : undefined} counter={<span className="text-[12.5px] tabular text-muted">{title.length}/{TITLE_MAX}</span>}>
            <Input id="an-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Showcase running order is ready" aria-invalid={!!tried && !!errors.title} />
          </Field>
          <Field
            label="Message"
            required
            htmlFor="an-body"
            hint="Plain text. Leave a blank line between paragraphs. The first line becomes the notification preview."
            error={errors.body}
            counter={<span className="text-[12.5px] tabular text-muted">{body.length}/{BODY_MAX}</span>}
          >
            <Textarea id="an-body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[240px]" aria-invalid={!!errors.body} />
          </Field>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button type="submit" icon={<Send className="size-4" />}>
              Send to {plural(recipients.length, "person", "people")}
            </Button>
            <Button variant="outline" icon={<Save className="size-4" />} loading={busy === "draft"} onClick={saveDraft} disabled={draftId !== undefined && !dirty}>
              {draftId ? (dirty ? "Save draft" : "Draft saved") : "Save draft"}
            </Button>
            <p className="text-[12.5px] text-muted sm:ml-auto">Sending can&apos;t be undone.</p>
          </div>
        </form>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel>
          <PanelHeader
            title={
              <span>
                <span className="font-display text-[34px] font-light leading-none tracking-[-0.03em] tabular">{recipients.length}</span>{" "}
                {recipients.length === 1 ? "recipient" : "recipients"}
              </span>
            }
            description={`${scopeLabel(db, scope)} · ${audience === "fellows" ? "fellows only" : "fellows and staff"} · updates as you edit`}
          />
          <RecipientBreakdown ids={recipients} scope={scope} />
        </Panel>
        <Panel>
          <PanelHeader
            title="Preview"
            description="What recipients will see"
            actions={
              recipients.length > 1 ? (
                <Select aria-label="Preview as recipient" value={previewId ?? ""} onChange={(e) => setPreviewAs(e.target.value)} className="h-9 w-[180px] text-[13.5px]">
                  {recipients
                    .map((id) => db.users[id])
                    .filter(Boolean)
                    .sort((a, b) => a.name.localeCompare(b.name))
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
          <NotificationPreview title={title} body={body} />
          <p className="eyebrow mb-2 mt-5 text-muted">Email</p>
          <EmailPreview
            email={{
              id: `${draftId ?? "preview"}.${previewId ?? "x"}`,
              fromName: me.name,
              toName: previewUser?.name ?? "Fellow",
              toEmail: previewUser?.email ?? "fellow@example.org",
              subject: title,
              date: now,
              bodyText: announcementEmailBody(previewUser?.firstName ?? "there", body || "Your message appears here.", me.name),
            }}
            note={previewUser && !previewUser.notificationPrefs.emailAnnouncements ? `${previewUser.firstName} has announcement emails off — portal only.` : "Preview · simulated email, never actually sent"}
          />
        </Panel>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Send to ${plural(recipients.length, "person", "people")}?`}
        description={`${scopeLabel(db, scope)} · ${audience === "fellows" ? "fellows only" : "fellows and staff"}`}
        confirmLabel="Send announcement"
        confirmVariant="primary"
        onConfirm={send}
      >
        <div className="grid grid-cols-1 gap-3 text-[14px] leading-relaxed">
          <p>
            <span className="font-semibold">“{title.trim()}”</span> will appear under the bell for every recipient and go by (simulated) email to those who opted in.
          </p>
          <p className="text-muted">Once sent it can&apos;t be edited or recalled. Other cohorts won&apos;t receive it.</p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
