"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, ScanText, SendHorizontal, UploadCloud, X } from "lucide-react";
import type { Conversation, MessageAttachment } from "@/lib/domain/types";
import { sendMessage } from "@/lib/actions/messaging";
import { MODERATION_RULES } from "@/lib/sim/moderation";
import { ACCEPTED_DOC_TYPES, saveFileBytes, validateUpload } from "@/lib/files";
import { useDemoStore } from "@/lib/store/store";
import { cn, fmtBytes, uid } from "@/lib/utils";
import { Kbd } from "@/components/ui/display";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlay";
import { MAX_ATTACHMENTS, MESSAGE_LIMIT, SAMPLE_ATTACHMENTS } from "./lib";

/** Unsent text per conversation for this browser tab (switching threads keeps your draft). */
const drafts = new Map<string, string>();

export function Composer({ conv, recipientName }: { conv: Conversation; recipientName: string }) {
  const [text, setText] = useState(() => drafts.get(conv.id) ?? "");
  const [atts, setAtts] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flagNotice, setFlagNotice] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = MESSAGE_LIMIT - text.length;
  const canSend = (text.trim().length > 0 || atts.length > 0) && !uploading && remaining >= 0;

  const update = (v: string) => {
    setText(v);
    drafts.set(conv.id, v);
    if (error) setError(null);
  };

  const autosize = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const addAttachment = (a: MessageAttachment) => {
    setAtts((cur) => (cur.length >= MAX_ATTACHMENTS ? cur : [...cur, a]));
    setError(null);
  };

  const addSample = (s: (typeof SAMPLE_ATTACHMENTS)[number]) => {
    setAttachOpen(false);
    if (atts.length >= MAX_ATTACHMENTS) return setError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
    addAttachment({ id: uid("att"), name: s.name, mime: s.mime, size: s.size, sampleUrl: s.sampleUrl });
    areaRef.current?.focus();
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (atts.length >= MAX_ATTACHMENTS) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
      return;
    }
    const invalid = validateUpload(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setUploading(file.name);
    try {
      const key = uid("blob");
      await saveFileBytes(key, file);
      addAttachment({ id: uid("att"), name: file.name, mime: file.type, size: file.size, blobKey: key });
    } catch {
      setError("This browser couldn't store the file (storage may be full or disabled). Try a sample file instead.");
    } finally {
      setUploading(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const send = () => {
    if (uploading) return;
    if (!text.trim() && !atts.length) {
      setError("Write a message or attach a file first.");
      return;
    }
    if (text.length > MESSAGE_LIMIT) {
      setError("Messages are limited to 2,000 characters.");
      return;
    }
    const r = sendMessage(conv.id, text, atts);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    const sent = useDemoStore.getState().db.messages[r.value.id];
    const rule = sent?.autoFlag ? MODERATION_RULES.find((x) => x.id === sent.autoFlag!.rule) : undefined;
    setFlagNotice(r.value.flagged ? rule?.label ?? "Keyword rule" : null);
    setText("");
    drafts.delete(conv.id);
    setAtts([]);
    setError(null);
    requestAnimationFrame(autosize);
    areaRef.current?.focus();
  };

  const nearLimit = remaining <= 200;

  return (
    <div className="shrink-0 border-t border-line bg-paper px-3 pb-3 pt-2.5 sm:px-4">
      <AnimatePresence initial={false}>
        {flagNotice && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="mb-2 flex items-start gap-2.5 rounded-[12px] bg-[#fff6dd] px-3 py-2.5 text-[13.5px] text-[#5c3a00]"
            role="status"
          >
            <ScanText className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="min-w-0 flex-1 leading-snug">
              Your message was sent. It matched a simple keyword rule ({flagNotice}), so a member of the program team will take a look. Keep contact details and plans on the platform.
            </p>
            <button type="button" onClick={() => setFlagNotice(null)} className="-m-1 grid size-8 shrink-0 place-items-center rounded-[8px] hover:bg-black/5" aria-label="Dismiss notice">
              <X className="size-4" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDrag(true);
          }
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files?.length) return;
          e.preventDefault();
          setDrag(false);
          void upload(e.dataTransfer.files[0]);
        }}
        className={cn(
          "rounded-[16px] border-[1.5px] bg-paper transition-colors focus-within:border-void",
          drag ? "border-void bg-leaf/40" : error ? "border-[#c8102e]" : "border-line",
        )}
      >
        {(atts.length > 0 || uploading) && (
          <ul className="flex flex-wrap gap-2 px-3 pt-3" aria-label="Attachments to send">
            {atts.map((a) => (
              <li key={a.id} className="flex h-10 max-w-full items-center gap-2 rounded-[10px] bg-fog pl-2.5 pr-1 text-[13px]">
                {a.mime.startsWith("image/") ? <ImageIcon className="size-4 shrink-0" aria-hidden /> : <FileText className="size-4 shrink-0" aria-hidden />}
                <span className="max-w-[180px] truncate font-medium">{a.name}</span>
                <span className="shrink-0 text-muted">{fmtBytes(a.size)}</span>
                <button
                  type="button"
                  onClick={() => setAtts((cur) => cur.filter((x) => x.id !== a.id))}
                  className="grid size-8 shrink-0 place-items-center rounded-[8px] hover:bg-ash"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
            {uploading && (
              <li className="flex h-10 items-center gap-2 rounded-[10px] bg-fog px-3 text-[13px] text-muted" role="status">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Adding {uploading}…
              </li>
            )}
          </ul>
        )}
        <label htmlFor={`composer-${conv.id}`} className="sr-only">
          Message {recipientName}
        </label>
        <textarea
          id={`composer-${conv.id}`}
          ref={areaRef}
          rows={1}
          value={text}
          maxLength={MESSAGE_LIMIT}
          onChange={(e) => {
            update(e.target.value);
            autosize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={`Message ${recipientName}…`}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `composer-error-${conv.id}` : `composer-hint-${conv.id}`}
          className="block max-h-[180px] min-h-[48px] w-full resize-none bg-transparent px-4 pb-1 pt-3 text-[15px] leading-relaxed text-void placeholder:text-[#8a8a8a] focus:outline-none focus-visible:outline-none"
        />
        <div className="flex items-center gap-1 px-2 pb-2">
          <PopoverRoot open={attachOpen} onOpenChange={setAttachOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={atts.length >= MAX_ATTACHMENTS || !!uploading}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-2.5 text-[13.5px] text-muted transition-colors hover:bg-fog hover:text-void disabled:opacity-40"
                aria-label="Attach a file"
              >
                <Paperclip className="size-[18px]" aria-hidden />
                <span className="hidden sm:inline">Attach</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-[300px] p-1.5">
              <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted">Sample files</p>
              {SAMPLE_ATTACHMENTS.map((s) => (
                <button key={s.key} type="button" onClick={() => addSample(s)} className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-left hover:bg-fog">
                  <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-fog">
                    {s.mime.startsWith("image/") ? <ImageIcon className="size-4" aria-hidden /> : <FileText className="size-4" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{s.label}</span>
                    <span className="block truncate text-[12px] text-muted">
                      {s.name} · {fmtBytes(s.size)}
                    </span>
                  </span>
                </button>
              ))}
              <div className="my-1 h-px bg-line" />
              <button
                type="button"
                onClick={() => {
                  setAttachOpen(false);
                  fileRef.current?.click();
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-left hover:bg-fog"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-fog">
                  <UploadCloud className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">Upload from this device</span>
                  <span className="block text-[12px] text-muted">PDF, PNG, JPG or WebP · up to 8 MB</span>
                </span>
              </button>
            </PopoverContent>
          </PopoverRoot>
          <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden accept={ACCEPTED_DOC_TYPES.join(",")} onChange={(e) => void upload(e.target.files?.[0])} />
          <span className="flex-1" />
          {nearLimit && (
            <span className={cn("px-2 text-[12.5px] tabular", remaining <= 0 ? "font-medium text-[#b00d28]" : "text-muted")} aria-live="polite">
              {text.length.toLocaleString("en-US")} / {MESSAGE_LIMIT.toLocaleString("en-US")}
            </span>
          )}
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-[10px] bg-jade px-3.5 text-[14.5px] font-medium text-void transition-opacity hover:bg-jade-press disabled:opacity-40"
          >
            <SendHorizontal className="size-4" aria-hidden />
            <span className="hidden sm:inline">Send</span>
            <span className="sr-only sm:hidden">Send message</span>
          </button>
        </div>
      </div>
      {error ? (
        <p id={`composer-error-${conv.id}`} role="alert" className="mt-1.5 px-1 text-[13px] text-[#b00d28]">
          {error}
        </p>
      ) : (
        <p id={`composer-hint-${conv.id}`} className="mt-1.5 hidden px-1 text-[12px] text-muted sm:block">
          <Kbd>Enter</Kbd> to send · <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> for a new line
        </p>
      )}
    </div>
  );
}
