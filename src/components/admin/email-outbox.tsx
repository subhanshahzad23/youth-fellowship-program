"use client";

import { useMemo, useState } from "react";
import { Download, Inbox, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import type { OutboxEmail } from "@/lib/domain/types";
import { adminCohortIds, isExec } from "@/lib/domain/permissions";
import { useNow } from "@/lib/hooks";
import { downloadBlob } from "@/lib/files";
import { useDb, useMe } from "@/lib/store/store";
import { fmtDateTime, fmtRelative, plural } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Panel, PanelHeader, type Tone } from "@/components/ui/display";
import { Input, Select } from "@/components/ui/form";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { EmailPreview } from "@/components/announcements/previews";
import { buildEml, emlFileName, outboxEml } from "@/components/announcements/email";
import { peopleInScope } from "./people-data";

const KIND: Record<OutboxEmail["kind"], { label: string; tone: Tone; reason: string }> = {
  announcement: { label: "Announcement", tone: "green", reason: "You're receiving this because announcement emails are on. Change this any time in notification settings." },
  welcome: { label: "Welcome", tone: "blue", reason: "Sent once when your application was approved." },
  decision: { label: "Decision", tone: "purple", reason: "Sent when a decision was made on your application." },
  changes_requested: { label: "Changes requested", tone: "amber", reason: "Sent because a reviewer asked for changes to your application." },
  digest: { label: "Digest", tone: "neutral", reason: "You're receiving this because your unread-message digest is on." },
  interest: { label: "Interest", tone: "neutral", reason: "Sent because you registered interest on the public site." },
  submission: { label: "Submission", tone: "neutral", reason: "Sent to confirm your application was received." },
};
const PAGE = 30;

/** Every simulated email in the viewer's scope, with preview and .eml download. */
export function EmailOutbox() {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const now = useNow();
  const exec = isExec(db, meId);
  const [kind, setKind] = useState<"all" | OutboxEmail["kind"]>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const all = useMemo(() => {
    const list = Object.values(db.outbox).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : a.id < b.id ? 1 : -1));
    if (exec) return list;
    const people = new Set(peopleInScope(db, meId).map((r) => r.user.id));
    const slugs = adminCohortIds(db, meId).map((id) => `/cohorts/${db.cohorts[id]?.slug}`);
    return list.filter((e) => (e.toUserId && people.has(e.toUserId)) || (!!e.relatedHref && slugs.includes(e.relatedHref)));
  }, [db, meId, exec]);

  const kinds = useMemo(() => [...new Set(all.map((e) => e.kind))], [all]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((e) => (kind === "all" || e.kind === kind) && (!needle || [e.toName, e.toEmail, e.subject].some((s) => s.toLowerCase().includes(needle))));
  }, [all, kind, q]);
  const current = open ? db.outbox[open] : undefined;

  const download = (e: OutboxEmail) => {
    const eml = outboxEml(db, e);
    downloadBlob(buildEml(eml), emlFileName(e.subject, e.toName.split(" ")[0]?.toLowerCase()), "message/rfc822");
    toast.success("Email downloaded (.eml)");
  };

  return (
    <Panel className="p-0 sm:p-0">
      <div className="p-5 pb-0 sm:p-6 sm:pb-0">
        <PanelHeader
          title="Email outbox"
          description={exec ? "Every simulated email the platform has generated. Nothing leaves this browser." : "Simulated emails to people in your cohorts. Nothing leaves this browser."}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 pb-4 sm:px-6">
        <div className="relative min-w-[200px] flex-[2]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => (setQ(e.target.value), setLimit(PAGE))} placeholder="Search recipient or subject" aria-label="Search outbox" className="h-10 pl-9" />
        </div>
        <div className="min-w-[160px] flex-1">
          <Select value={kind} onChange={(e) => (setKind(e.target.value as typeof kind), setLimit(PAGE))} aria-label="Email type" className="h-10">
            <option value="all">All types ({all.length})</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {KIND[k].label} ({all.filter((e) => e.kind === k).length})
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="px-5 pt-3 text-[13px] text-muted sm:px-6" aria-live="polite">
        {plural(shown.length, "email")}
      </p>

      {shown.length === 0 ? (
        <div className="p-5 sm:p-6">
          <EmptyState icon={<Inbox className="size-5" />} title="No emails match" description="Sending an announcement or approving an application adds simulated emails here." />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table caption="Simulated emails" className="rounded-none">
              <THead>
                <tr>
                  <TH className="w-[220px]">To</TH>
                  <TH>Subject</TH>
                  <TH className="w-[150px]">Type</TH>
                  <TH className="w-[120px]" align="right">
                    Created
                  </TH>
                </tr>
              </THead>
              <tbody>
                {shown.slice(0, limit).map((e) => (
                  <TR key={e.id} onClick={() => setOpen(e.id)}>
                    <TD className="max-w-[220px]">
                      <span className="block truncate text-[13.5px] font-medium">{e.toName}</span>
                      <span className="block truncate text-[12.5px] text-muted">{e.toEmail}</span>
                    </TD>
                    <TD className="w-full max-w-0">
                      <button type="button" onClick={(ev) => (ev.stopPropagation(), setOpen(e.id))} className="block w-full min-w-0 text-left">
                        <span className="block truncate text-[13.5px] font-medium hover:underline">{e.subject}</span>
                        <span className="block truncate text-[12.5px] text-muted">{e.preview}</span>
                      </button>
                    </TD>
                    <TD>
                      <Badge tone={KIND[e.kind].tone}>{KIND[e.kind].label}</Badge>
                    </TD>
                    <TD align="right" className="whitespace-nowrap text-[13px] text-muted">
                      {fmtRelative(e.createdAt, now)}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
          <ul className="grid grid-cols-1 gap-2 p-4 md:hidden">
            {shown.slice(0, limit).map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setOpen(e.id)} className="w-full rounded-[14px] bg-fog p-3.5 text-left hover:bg-ash">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-medium">{e.subject}</span>
                    <Badge tone={KIND[e.kind].tone}>{KIND[e.kind].label}</Badge>
                  </span>
                  <span className="mt-1 block truncate text-[13px] text-muted">
                    To {e.toName} · {fmtRelative(e.createdAt, now)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {shown.length > limit && (
            <div className="flex justify-center border-t border-line p-4">
              <Button variant="soft" onClick={() => setLimit((l) => l + PAGE)}>
                Show more ({shown.length - limit} left)
              </Button>
            </div>
          )}
        </>
      )}

      <DialogRoot open={!!current} onOpenChange={(o) => !o && setOpen(null)}>
        {current && (
          <DialogContent
            size="lg"
            title={current.subject}
            description={`${KIND[current.kind].label} · to ${current.toName} · ${fmtDateTime(current.createdAt)} UTC`}
            footer={
              <Button variant="dark" icon={<Download className="size-4" />} onClick={() => download(current)}>
                Download .eml
              </Button>
            }
          >
            <EmailPreview email={outboxEml(db, current)} downloadable={false} reason={KIND[current.kind].reason} note={<span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" aria-hidden /> Simulated — never actually sent</span>} />
          </DialogContent>
        )}
      </DialogRoot>
    </Panel>
  );
}
