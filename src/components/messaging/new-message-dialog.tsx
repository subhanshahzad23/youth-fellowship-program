"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, MessageCircle, SendHorizontal, ShieldCheck } from "lucide-react";
import type { ID } from "@/lib/domain/types";
import { startConversation } from "@/lib/actions/messaging";
import { canMessage, fellowMembership, roleLabel } from "@/lib/domain/permissions";
import { useDb, useMe } from "@/lib/store/store";
import { cn, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Notice, RestrictedState } from "@/components/ui/display";
import { Textarea } from "@/components/ui/form";
import { DialogClose, DialogContent, DialogRoot } from "@/components/ui/overlay";
import { SearchBox } from "./conversation-list";
import { findDirectConversation, matchesPerson, MESSAGE_LIMIT, messagingRuleFor, recipientCandidates, SUPERVISION_NOTICE, type Candidate } from "./lib";

const DENIED_PREVIEW = 6;

function PersonLine({ c, existing }: { c: Candidate; existing?: boolean }) {
  return (
    <>
      <Avatar name={c.user.name} hue={c.user.avatarHue} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium">{c.user.name}</span>
        <span className="block truncate text-[12.5px] text-muted">{[c.role.replace(/^Fellow · .*/, "Fellow"), c.detail].filter(Boolean).join(" · ")}</span>
      </span>
      {existing && (
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted">
          <MessageCircle className="size-3.5" aria-hidden /> Existing chat
        </span>
      )}
    </>
  );
}

/**
 * Recipient picker + first message. Eligible people are selectable; people
 * who match the search but can't be messaged are listed with the exact reason.
 * startConversation re-checks eligibility on send.
 */
export function NewMessageDialog({
  open,
  onOpenChange,
  initialRecipientId,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialRecipientId?: ID | null;
  onSent: (conversationId: ID) => void;
}) {
  const db = useDb();
  const me = useMe()!;
  const [query, setQuery] = useState("");
  const [recipientId, setRecipientId] = useState<ID | null>(initialRecipientId ?? null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const candidates = useMemo(() => recipientCandidates(db, me.id), [db, me.id]);
  const term = query.trim();
  const allowed = candidates.filter((c) => c.decision.ok && (!term || matchesPerson(c.user, term)));
  const deniedAll = term ? candidates.filter((c) => !c.decision.ok && matchesPerson(c.user, term)) : [];
  const denied = deniedAll.slice(0, DENIED_PREVIEW);
  const staff = allowed.filter((c) => !fellowMembership(db, c.user.id));
  const fellows = allowed.filter((c) => fellowMembership(db, c.user.id));

  const recipient = recipientId ? db.users[recipientId] : undefined;
  const decision = recipientId ? canMessage(db, me.id, recipientId) : null;
  const existing = recipientId ? findDirectConversation(db, me.id, recipientId) : undefined;
  const ready = !!recipient && !!decision?.ok;

  const pick = (id: ID) => {
    setRecipientId(id);
    setError(null);
  };

  const send = async () => {
    if (!recipientId || !ready) return;
    if (!text.trim()) {
      setError("Write a message first.");
      return;
    }
    setBusy(true);
    await sleep(400);
    const r = startConversation(recipientId, text);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    toast.success(`Message sent to ${recipient?.firstName ?? "them"}`);
    onSent(r.value);
  };

  const section = (label: string, list: Candidate[]) =>
    list.length > 0 && (
      <div>
        <p className="eyebrow px-1 pb-1.5 text-muted">{label}</p>
        <ul className="flex flex-col gap-0.5">
          {list.map((c) => (
            <li key={c.user.id}>
              <button type="button" onClick={() => pick(c.user.id)} className="flex min-h-12 w-full items-center gap-3 rounded-[12px] px-2 py-1.5 text-left transition-colors hover:bg-fog">
                <PersonLine c={c} existing={!!findDirectConversation(db, me.id, c.user.id)} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <DialogRoot open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent
        title="New message"
        description={messagingRuleFor(db, me.id)}
        size="md"
        footer={
          <>
            <p className="mr-auto hidden items-center gap-1.5 text-[12.5px] text-muted sm:flex">
              <ShieldCheck className="size-3.5 text-leaf-ink" aria-hidden /> {SUPERVISION_NOTICE}
            </p>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={send} loading={busy} disabled={!ready || !text.trim()} icon={<SendHorizontal className="size-4" />}>
              Send
            </Button>
          </>
        }
      >
        {recipient ? (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[14.5px] font-medium">To</p>
              <div className={cn("flex items-center gap-3 rounded-[12px] border-[1.5px] px-3 py-2", ready ? "border-line" : "border-dashed border-line bg-[#fafafa]")}>
                <Avatar name={recipient.name} hue={recipient.avatarHue} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium">{recipient.name}</span>
                  <span className="block truncate text-[12.5px] text-muted">{roleLabel(db, recipient)}</span>
                </span>
                <Button
                  size="sm"
                  variant="soft"
                  disabled={busy}
                  onClick={() => {
                    setRecipientId(null);
                    setError(null);
                  }}
                >
                  Change
                </Button>
              </div>
            </div>
            {!ready ? (
              <RestrictedState title={`You can't message ${recipient.firstName}`} reason={decision && !decision.ok ? decision.reason : "This person can't be messaged."} />
            ) : (
              <>
                {existing && (
                  <Notice tone="neutral" icon={<MessageCircle className="size-4" />}>
                    You already have a conversation with {recipient.firstName}. This message will be added to it.
                  </Notice>
                )}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="new-message-body" className="text-[14.5px] font-medium">
                      Message
                    </label>
                    {text.length > MESSAGE_LIMIT - 200 && (
                      <span className="text-[12.5px] tabular text-muted">
                        {text.length.toLocaleString("en-US")} / {MESSAGE_LIMIT.toLocaleString("en-US")}
                      </span>
                    )}
                  </div>
                  <Textarea
                    id="new-message-body"
                    autoFocus
                    value={text}
                    maxLength={MESSAGE_LIMIT}
                    onChange={(e) => {
                      setText(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder={`Say hello to ${recipient.firstName}…`}
                    aria-invalid={!!error || undefined}
                    className="min-h-[120px]"
                  />
                </div>
              </>
            )}
            {error && (
              <p role="alert" className="text-[13.5px] text-[#b00d28]">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <SearchBox value={query} onChange={setQuery} label="Search people" placeholder="Search by name or venture" />
            {allowed.length === 0 && denied.length === 0 && (
              <p className="px-1 py-6 text-center text-[14px] text-muted">{term ? `No one matches “${term}”.` : "There's no one you can message yet."}</p>
            )}
            {section("Program staff", staff)}
            {section("Fellows", fellows)}
            {denied.length > 0 && (
              <div>
                <p className="eyebrow px-1 pb-1.5 text-muted">Not available</p>
                <ul className="flex flex-col gap-1">
                  {denied.map((c) => (
                    <li key={c.user.id} className="flex items-start gap-3 rounded-[12px] bg-[#fafafa] px-2 py-2">
                      <span className="opacity-60">
                        <Avatar name={c.user.name} hue={c.user.avatarHue} size={36} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium text-muted">
                          {c.user.name} <span className="font-normal">· {c.role.replace(/^Fellow · /, "Fellow, ")}</span>
                        </span>
                        <span className="mt-0.5 flex items-start gap-1.5 text-[13px] text-ink">
                          <Lock className="mt-[3px] size-3.5 shrink-0" aria-hidden />
                          {c.decision.ok ? "" : c.decision.reason}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                {deniedAll.length > denied.length && <p className="mt-1.5 px-1 text-[12.5px] text-muted">+{deniedAll.length - denied.length} more people you can&apos;t message. Refine your search to see them.</p>}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  );
}
