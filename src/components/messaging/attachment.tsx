"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MessageAttachment } from "@/lib/domain/types";
import { downloadFileRecord, resolveFileUrl } from "@/lib/files";
import { cn, fmtBytes } from "@/lib/utils";
import { FileIcon } from "@/components/ui/files";

/** Image preview for an uploaded (IndexedDB) attachment. The object URL is created on demand and revoked on unmount. */
function BlobImage({ blobKey, alt }: { blobKey: string; alt: string }) {
  const [state, setState] = useState<{ key: string; url: string | null; missing: boolean }>({ key: blobKey, url: null, missing: false });
  useEffect(() => {
    let cancelled = false;
    let revoke = () => {};
    resolveFileUrl({ blobKey })
      .then((r) => {
        if (cancelled) {
          r?.revoke();
          return;
        }
        if (!r) setState({ key: blobKey, url: null, missing: true });
        else {
          revoke = r.revoke;
          setState({ key: blobKey, url: r.url, missing: false });
        }
      })
      .catch(() => !cancelled && setState({ key: blobKey, url: null, missing: true }));
    return () => {
      cancelled = true;
      revoke();
    };
  }, [blobKey]);
  const current = state.key === blobKey ? state : { url: null, missing: false };
  if (current.missing) return null;
  if (!current.url) return <div className="skeleton h-36 w-full" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={current.url} alt={alt} className="max-h-56 w-full bg-fog object-contain" />;
}

function kindOf(mime: string) {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return mime.replace("image/", "").toUpperCase();
  return "File";
}

export function AttachmentCard({ att, className }: { att: MessageAttachment; className?: string }) {
  const [busy, setBusy] = useState(false);
  const isImage = att.mime.startsWith("image/");
  const download = async () => {
    setBusy(true);
    try {
      await downloadFileRecord(att);
    } catch {
      toast.error("This file isn't available in this browser.", { description: "Uploaded files are stored in the browser they were added from." });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={cn("w-[min(100%,300px)] overflow-hidden rounded-[14px] border border-line bg-paper text-void", className)}>
      {isImage &&
        (att.sampleUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={att.sampleUrl} alt={`Attachment preview: ${att.name}`} className="max-h-56 w-full bg-fog object-contain" />
        ) : att.blobKey ? (
          <BlobImage blobKey={att.blobKey} alt={`Attachment preview: ${att.name}`} />
        ) : null)}
      <div className="flex items-center gap-3 py-2 pl-3 pr-1.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-fog">
          <FileIcon mime={att.mime} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium" title={att.name}>
            {att.name}
          </p>
          <p className="text-[12px] text-muted">
            {kindOf(att.mime)} · {fmtBytes(att.size)}
          </p>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={busy}
          aria-label={`Download ${att.name}`}
          title="Download"
          className="grid size-10 shrink-0 place-items-center rounded-[8px] text-void transition-colors hover:bg-fog disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
