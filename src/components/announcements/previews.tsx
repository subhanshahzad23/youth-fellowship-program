"use client";

import { Download, Mail, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/files";
import { cn, fmtDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buildEml, displayFrom, emlFileName, FROM_ADDRESS, type EmlInput } from "./email";

/** Renders an email the way a simple mail client would, with a real .eml download. */
export function EmailPreview({
  email,
  note,
  className,
  downloadable = true,
  reason = "You're receiving this because announcement emails are on. Change this any time in notification settings.",
}: {
  email: EmlInput;
  note?: React.ReactNode;
  className?: string;
  downloadable?: boolean;
  reason?: string | null;
}) {
  const paras = email.bodyText.split(/\n{2,}/);
  return (
    <div className={cn("overflow-hidden rounded-[14px] border border-line bg-paper", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-line bg-fog px-4 py-3">
        <dl className="min-w-0 space-y-0.5 text-[13px]">
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-muted">From</dt>
            <dd className="min-w-0 truncate">
              {displayFrom(email.fromName)} <span className="text-muted">&lt;{FROM_ADDRESS}&gt;</span>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-muted">To</dt>
            <dd className="min-w-0 truncate">
              {email.toName} <span className="text-muted">&lt;{email.toEmail}&gt;</span>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-muted">Subject</dt>
            <dd className="min-w-0 font-semibold">{email.subject || "(no subject)"}</dd>
          </div>
        </dl>
        <Mail className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
      </div>
      <div className="space-y-3 px-4 py-4 text-[14.5px] leading-relaxed">
        {paras.map((p, i) => (
          <p key={i} className="whitespace-pre-line break-words">
            {p}
          </p>
        ))}
        {reason && <p className="border-t border-line pt-3 text-[12px] text-muted">{reason}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#fafafa] px-4 py-2.5">
        <p className="text-[12px] text-muted">{note ?? `Simulated email · ${fmtDateTime(email.date)} UTC · never actually sent`}</p>
        {downloadable && (
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="size-3.5" />}
            onClick={() => {
              downloadBlob(buildEml(email), emlFileName(email.subject, email.toName.split(" ")[0]?.toLowerCase()), "message/rfc822");
              toast.success("Email downloaded (.eml)", { description: "Opens in Mail, Outlook or any email client." });
            }}
          >
            Download .eml
          </Button>
        )}
      </div>
    </div>
  );
}

/** How the announcement appears under the bell in the portal. */
export function NotificationPreview({ title, body, when = "just now", unread = true }: { title: string; body: string; when?: string; unread?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-paper">
      <div className="border-b border-line px-4 py-2.5 text-[13px] font-semibold">Notifications</div>
      <div className={cn("flex items-start gap-3 px-4 py-3", unread && "bg-leaf/35")}>
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line">
          <Megaphone className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="text-[14px] font-medium">{title || "Untitled announcement"}</span>
            {unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-jade" aria-label="unread" />}
          </span>
          <span className="line-clamp-2 block text-[13px] text-muted">{body.split("\n")[0].slice(0, 140) || "Your message preview appears here."}</span>
          <span className="mt-0.5 block text-[12px] text-muted">{when}</span>
        </span>
      </div>
    </div>
  );
}
