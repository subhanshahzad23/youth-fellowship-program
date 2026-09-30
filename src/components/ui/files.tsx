"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Eye, FileText, Image as ImageIcon, Lock, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import type { DocumentRecord } from "@/lib/domain/types";
import { openDocument } from "@/lib/actions/applications";
import { canOpenDocument } from "@/lib/domain/permissions";
import { downloadFileRecord, resolveFileUrl, saveFileBytes, validateUpload, ACCEPTED_DOC_TYPES } from "@/lib/files";
import { useDb, usePersonaId } from "@/lib/store/store";
import { cn, fmtBytes, fmtDateTime, sleep, uid } from "@/lib/utils";
import { Button } from "./button";
import { DialogContent, DialogRoot } from "./overlay";
import { RestrictedState } from "./display";

export function FileIcon({ mime, className }: { mime: string; className?: string }) {
  return mime.startsWith("image/") ? <ImageIcon className={className} aria-hidden /> : <FileText className={className} aria-hidden />;
}

/**
 * Opens a document only after re-checking permission at the moment of access.
 * Denied attempts are audited and explained; object URLs are created on demand
 * and revoked on close.
 */
export function DocumentViewer({ docId, open, onOpenChange }: { docId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDb();
  const doc = docId ? db.documents[docId] : undefined;
  const [state, setState] = useState<{ status: "loading" | "ready" | "denied" | "missing"; url?: string; reason?: string }>({ status: "loading" });
  const revokeRef = useRef<() => void>(() => {});

  // Permission is re-checked (and the attempt audited) each time the viewer opens.
  useEffect(() => {
    if (!open || !docId) return;
    let cancelled = false;
    void (async () => {
      const res = openDocument(docId);
      if (!res.ok) {
        if (!cancelled) setState({ status: "denied", reason: res.error });
        return;
      }
      try {
        const r = await resolveFileUrl(res.doc);
        if (cancelled) return r?.revoke();
        if (!r) setState({ status: "missing", reason: "The file's contents aren't available in this browser. Uploaded files live in this browser's storage only." });
        else {
          revokeRef.current = r.revoke;
          setState({ status: "ready", url: r.url });
        }
      } catch {
        if (!cancelled) setState({ status: "missing", reason: "The file couldn't be loaded." });
      }
    })();
    return () => {
      cancelled = true;
      revokeRef.current();
      revokeRef.current = () => {};
    };
  }, [open, docId]);

  const handleOpenChange = (v: boolean) => {
    if (!v) setState({ status: "loading" });
    onOpenChange(v);
  };

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="lg"
        title={doc?.name ?? "Document"}
        description={doc ? `${doc.source === "sample" ? "Bundled sample document" : "Uploaded"} · ${fmtBytes(doc.size)} · ${fmtDateTime(doc.uploadedAt)}` : undefined}
        footer={
          state.status === "ready" && doc ? (
            <Button
              variant="outline"
              icon={<Download className="size-4" />}
              onClick={async () => {
                try {
                  await downloadFileRecord(doc);
                } catch {
                  toast.error("Download failed — the file isn't available.");
                }
              }}
            >
              Download
            </Button>
          ) : undefined
        }
      >
        {state.status === "loading" && <div className="skeleton h-[60vh] w-full rounded-[12px]" />}
        {state.status === "denied" && <RestrictedState title="You can't open this document" reason={state.reason ?? ""} />}
        {state.status === "missing" && <RestrictedState title="File unavailable" reason={state.reason ?? ""} />}
        {state.status === "ready" && doc && state.url && (
          <div className="overflow-hidden rounded-[12px] bg-fog">
            {doc.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.url} alt={`Preview of ${doc.name}`} className="mx-auto max-h-[65vh] w-auto" />
            ) : (
              <object data={state.url} type="application/pdf" className="h-[65vh] w-full" aria-label={`Preview of ${doc.name}`}>
                <div className="p-6 text-[14px]">
                  Your browser can&apos;t show PDFs inline.{" "}
                  <a href={state.url} target="_blank" rel="noreferrer" className="underline">
                    Open the PDF
                  </a>
                  .
                </div>
              </object>
            )}
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  );
}

/** A compact row describing a document, with a permission-aware open button. */
export function DocumentRow({ doc, onRemove, onReplace, removable, className }: { doc: DocumentRecord; onRemove?: () => void; onReplace?: () => void; removable?: boolean; className?: string }) {
  const db = useDb();
  const me = usePersonaId();
  const [open, setOpen] = useState(false);
  const allowed = canOpenDocument(db, me, doc);
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-[12px] border-[1.5px] border-line bg-paper px-3 py-2.5", className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-fog">{allowed.ok ? <FileIcon mime={doc.mime} className="size-5" /> : <Lock className="size-4" aria-hidden />}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium">{doc.name}</p>
        <p className="text-[12.5px] text-muted">
          {doc.source === "sample" ? "Sample document" : "Uploaded"} · {fmtBytes(doc.size)}
          {!allowed.ok && " · restricted"}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="soft" icon={allowed.ok ? <Eye className="size-4" /> : <Lock className="size-3.5" />} onClick={() => setOpen(true)}>
          {allowed.ok ? "Preview" : "Check access"}
        </Button>
        {onReplace && (
          <Button size="sm" variant="ghost" icon={<RefreshCw className="size-4" />} onClick={onReplace}>
            Replace
          </Button>
        )}
        {removable && onRemove && (
          <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={onRemove} aria-label={`Remove ${doc.name}`}>
            Remove
          </Button>
        )}
      </div>
      <DocumentViewer docId={doc.id} open={open} onOpenChange={setOpen} />
    </div>
  );
}

/**
 * Local file picker with validation and an accessible (bounded, simulated)
 * upload progress state. Bytes are stored in IndexedDB before `onStored`.
 */
export function FileDrop({
  onStored,
  accept = ACCEPTED_DOC_TYPES,
  label = "Upload a file",
  hint = "PDF, PNG, JPG or WebP · up to 8 MB",
  disabled,
  compact,
  inputRef,
}: {
  onStored: (file: { name: string; mime: string; size: number; blobKey: string }) => void;
  accept?: string[];
  label?: string;
  hint?: string;
  disabled?: boolean;
  compact?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);
    const err = validateUpload(file, accept);
    if (err) {
      setError(err);
      return;
    }
    try {
      setProgress(8);
      for (const p of [28, 52, 74]) {
        await sleep(160);
        setProgress(p);
      }
      const key = uid("blob");
      await saveFileBytes(key, file);
      setProgress(100);
      await sleep(180);
      onStored({ name: file.name, mime: file.type, size: file.size, blobKey: key });
    } catch {
      setError("This browser couldn't store the file (storage may be full or disabled). Try the sample document instead.");
    } finally {
      setProgress(null);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!disabled) void handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex items-center gap-3 rounded-[12px] border-[1.5px] border-dashed bg-[#fafafa] transition-colors",
          compact ? "px-3 py-2.5" : "flex-col px-5 py-6 text-center sm:flex-row sm:text-left",
          drag ? "border-void bg-leaf/40" : "border-[#c5ccd2]",
          disabled && "opacity-60",
        )}
      >
        <UploadCloud className="size-6 shrink-0 text-muted" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-medium">{label}</p>
          <p className="text-[13px] text-muted">{hint} · drag and drop or browse</p>
        </div>
        <Button size="sm" variant="outline" disabled={disabled || progress !== null} onClick={() => ref.current?.click()}>
          Browse files
        </Button>
        <input ref={ref} type="file" className="sr-only" tabIndex={-1} accept={accept.join(",")} onChange={(e) => void handle(e.target.files?.[0])} aria-label={label} />
      </div>
      {progress !== null && (
        <div className="mt-2" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-[12.5px] text-muted">
            <span>Uploading…</span>
            <span className="tabular">{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ash">
            <div className="h-full rounded-full bg-void transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && (
        <p className="mt-2 text-[13.5px] text-[#b00d28]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
