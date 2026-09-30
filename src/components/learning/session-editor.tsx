"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Eye, FileClock, RotateCcw, Save, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Module, Session, SessionContent } from "@/lib/domain/types";
import { discardSessionDraft, publishSession, saveSessionDraft } from "@/lib/actions/learning";
import { useNow, useUnsavedChangesGuard } from "@/lib/hooks";
import { useDb } from "@/lib/store/store";
import { cn, fmtDate, fmtRelative, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Notice, Panel, WarningLine } from "@/components/ui/display";
import { ConfirmDialog, Segmented } from "@/components/ui/overlay";
import { TaskPreview } from "./assignment-panel";
import { BlockList, normalizeContent } from "./block-editor";
import { diffSummary, sameContent } from "./data";
import { EditorStatusBadge, KindLabel } from "./meta";
import { SessionReader } from "./session-reader";

type View = "edit" | "preview" | "published";

const EMPTY: SessionContent = { title: "", summary: "", durationMin: 15, blocks: [] };

/**
 * Instructor editor for one session. Works on a local copy of
 * `draft ?? published`; nothing reaches fellows until Publish.
 */
export function SessionEditor({ session, module, onDirtyChange, onBack }: { session: Session; module: Module; onDirtyChange: (dirty: boolean) => void; onBack: () => void }) {
  const db = useDb();
  const now = useNow();
  const track = db.tracks[module.trackId];
  const base = session.draft ?? session.published ?? EMPTY;
  const [content, setContent] = useState<SessionContent>(() => structuredClone(base));
  const [view, setView] = useState<View>("edit");
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = !sameContent(normalizeContent(content), normalizeContent(base));
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  useUnsavedChangesGuard(dirty);

  const changes = useMemo(() => diffSummary(session.published, normalizeContent(content)), [session.published, content]);
  const hasTask = content.blocks.some((b) => b.type === "task");
  const problems: string[] = [];
  if (!content.title.trim()) problems.push("Give the session a title.");
  if (!content.blocks.length) problems.push("Add at least one content block before publishing.");
  if (session.kind === "task" && !hasTask) problems.push("Assignment sessions need an assignment block before they can be published.");

  const canPublish = dirty || !!session.draft || !session.published;
  const editor = session.draftUpdatedById ? db.users[session.draftUpdatedById] : undefined;

  const set = (patch: Partial<SessionContent>) => {
    setError(null);
    setContent((c) => ({ ...c, ...patch }));
  };

  async function save() {
    setSaving(true);
    await sleep(400);
    const clean = normalizeContent(content);
    const r = saveSessionDraft(session.id, clean);
    setSaving(false);
    if (!r.ok) {
      setError(r.error);
      toast.error(r.error);
      return;
    }
    setContent(structuredClone(clean));
    toast.success("Draft saved", { description: "Fellows still see the published version until you publish." });
  }

  async function publish() {
    await sleep(650);
    const clean = normalizeContent(content);
    if (dirty) {
      const s = saveSessionDraft(session.id, clean);
      if (!s.ok) {
        setError(s.error);
        toast.error(s.error);
        return true;
      }
    }
    const r = publishSession(session.id);
    if (!r.ok) {
      setError(r.error);
      toast.error(r.error, { description: dirty ? "Your changes were saved as a draft." : undefined });
      return true;
    }
    setContent(structuredClone(clean));
    setError(null);
    setView("edit");
    toast.success("Published", { description: `Fellows on ${track?.name ?? "this track"} now see “${clean.title}”.` });
    return true;
  }

  async function discard() {
    await sleep(350);
    const r = discardSessionDraft(session.id);
    if (!r.ok) {
      toast.error(r.error);
      return true;
    }
    if (session.published) setContent(structuredClone(session.published));
    setError(null);
    toast.success("Draft discarded", { description: "The editor now shows the published version." });
    return true;
  }

  const views: { value: View; label: React.ReactNode }[] = [
    { value: "edit", label: "Edit" },
    {
      value: "preview",
      label: (
        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-3.5" aria-hidden />
          Preview as learner
        </span>
      ),
    },
  ];
  if (session.published) views.push({ value: "published", label: "Live version" });

  return (
    <div className="min-w-0">
      <button type="button" onClick={onBack} className="mb-3 inline-flex h-10 items-center gap-1 rounded-[8px] pr-2 text-[14px] text-muted hover:text-void lg:hidden">
        <ChevronLeft className="size-4" aria-hidden /> All sessions
      </button>

      {/* Header + visibility */}
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow flex flex-wrap items-center gap-2 text-muted">
              Session {session.order} · <KindLabel kind={session.kind} className="gap-1 [&_svg]:size-3.5" />
            </p>
            <h2 className="mt-1 text-[21px] font-semibold leading-snug tracking-[-0.015em]">{content.title.trim() || "Untitled session"}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#fff1cc] px-2.5 text-[12.5px] font-medium text-[#7a4b00]" role="status">
                <span className="size-1.5 rounded-full bg-[#b26b00]" aria-hidden /> Unsaved changes
              </span>
            )}
            <EditorStatusBadge session={session} />
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-[12px] bg-fog p-3.5">
            <dt className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
              <Users className="size-3.5" aria-hidden /> What fellows see
            </dt>
            <dd className="mt-1 text-[14px] leading-snug">
              {session.published ? (
                <>
                  Published version from {fmtDate(session.publishedAt)}
                  {session.published.title !== content.title.trim() && <span className="block truncate text-muted">“{session.published.title}”</span>}
                </>
              ) : (
                "Nothing yet — this session has never been published."
              )}
            </dd>
          </div>
          <div className="rounded-[12px] bg-fog p-3.5">
            <dt className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
              <FileClock className="size-3.5" aria-hidden /> Your draft
            </dt>
            <dd className="mt-1 text-[14px] leading-snug">
              {session.draft ? (
                <>
                  Saved {fmtRelative(session.draftUpdatedAt, now)}
                  {editor && ` by ${editor.name}`}
                  {dirty && <span className="text-[#7a4b00]"> · plus unsaved edits</span>}
                </>
              ) : dirty ? (
                <span className="text-[#7a4b00]">Unsaved edits to the published version</span>
              ) : (
                "No draft — edits start a new draft"
              )}
              {session.published && (
                <span className="mt-0.5 block text-[13px] text-muted">{changes.length ? `Differs from live: ${changes.join(", ")}` : "Matches the live version"}</span>
              )}
            </dd>
          </div>
        </dl>
      </Panel>

      {/* Toolbar */}
      <div className="sticky top-16 z-20 -mx-1 mt-3 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-fog/80">
        <div className="flex flex-wrap items-center gap-2">
          <div className="no-scrollbar max-w-full overflow-x-auto">
            <Segmented label="Editor view" value={view} onChange={setView} options={views} />
          </div>
          <span className="flex-1" />
          {dirty && (
            <Button variant="ghost" size="sm" icon={<RotateCcw className="size-4" />} onClick={() => setContent(structuredClone(base))}>
              Undo changes
            </Button>
          )}
          {session.draft && session.published && (
            <Button variant="ghost" size="sm" icon={<Trash2 className="size-4" />} onClick={() => setDiscardOpen(true)}>
              Discard draft
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<Save className="size-4" />} onClick={() => void save()} loading={saving} disabled={!dirty}>
            Save draft
          </Button>
          <Button size="sm" icon={<Send className="size-4" />} onClick={() => setPublishOpen(true)} disabled={!canPublish}>
            Publish
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-[10px] bg-[#fff1f2] px-3.5 py-2.5 text-[14px] text-[#9f1239]">
          {error}
        </p>
      )}

      <div className="mt-3">
        {view === "edit" && (
          <div className="grid grid-cols-1 gap-4">
            <Panel className="grid grid-cols-1 gap-4 p-5 sm:p-6">
              <Field label="Title" htmlFor="sess-title" required>
                <Input id="sess-title" value={content.title} onChange={(e) => set({ title: e.target.value })} aria-invalid={!content.title.trim() || undefined} />
              </Field>
              <Field label="Summary" htmlFor="sess-summary" hint="One or two sentences shown under the title and in module lists.">
                <Textarea id="sess-summary" value={content.summary} rows={2} onChange={(e) => set({ summary: e.target.value })} className="min-h-[72px]" />
              </Field>
              <Field label="Estimated time" htmlFor="sess-duration" hint="Minutes a typical fellow needs.">
                <div className="flex max-w-[200px] items-center gap-2">
                  <Input
                    id="sess-duration"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={600}
                    value={content.durationMin}
                    onChange={(e) => set({ durationMin: Math.max(1, Math.min(600, Math.round(Number(e.target.value) || 1))) })}
                  />
                  <span className="text-[14px] text-muted">min</span>
                </div>
              </Field>
            </Panel>
            <Panel className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[17px] font-semibold">Content blocks</h3>
                <span className="text-[13px] text-muted">{content.blocks.length} blocks · fellows read them top to bottom</span>
              </div>
              <BlockList content={content} kind={session.kind} sessionId={session.id} onChange={(blocks) => set({ blocks })} />
              {problems.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {problems.map((p) => (
                    <WarningLine key={p}>{p}</WarningLine>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {view === "preview" && (
          <SessionReader
            content={normalizeContent(content)}
            kind={session.kind}
            showToc={false}
            preview
            banner={
              <Notice tone="amber" icon={<Eye className="size-4" aria-hidden />} title="Preview — fellows can't see this until you publish" className="mb-3">
                {dirty ? "Includes your unsaved changes." : session.draft ? "This is your saved draft." : "This matches the live version."} Interactive parts like submitting are switched off in preview.
              </Notice>
            }
            eyebrow={
              <p className="eyebrow text-muted">
                Module {module.order} · {module.title}
              </p>
            }
            renderTask={(b) => <TaskPreview task={b} />}
          />
        )}

        {view === "published" && session.published && (
          <SessionReader
            content={session.published}
            kind={session.kind}
            showToc={false}
            preview
            banner={
              <Notice tone="green" icon={<Users className="size-4 text-leaf-ink" aria-hidden />} title="Live version — what fellows see right now" className="mb-3">
                Published {fmtDate(session.publishedAt)}. {session.draft || dirty ? "Your draft changes aren't shown here." : "There are no draft changes."}
              </Notice>
            }
            eyebrow={
              <p className="eyebrow text-muted">
                Module {module.order} · {module.title}
              </p>
            }
            renderTask={(b) => <TaskPreview task={b} />}
          />
        )}
      </div>

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={session.published ? "Publish these changes?" : "Publish this session?"}
        description={`Fellows following ${track?.name ?? "this track"} in every cohort will see this version right away.`}
        confirmLabel={dirty ? "Save and publish" : "Publish"}
        confirmVariant="primary"
        onConfirm={publish}
      >
        {session.published ? (
          changes.length ? (
            <div className="text-[14px]">
              <p className="font-medium">Changes from the live version</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-ink">
                {changes.map((c) => (
                  <li key={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[14px] text-muted">The draft matches the live version.</p>
          )
        ) : (
          <p className="text-[14px] text-ink">It will appear in {module.title} for every fellow on the track.</p>
        )}
        {problems.length > 0 && (
          <div className={cn("mt-3 space-y-1.5")}>
            {problems.map((p) => (
              <WarningLine key={p}>{p}</WarningLine>
            ))}
          </div>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard your draft?"
        description="Your draft changes will be deleted and the editor will show the live version again. Fellows aren't affected."
        confirmLabel="Discard draft"
        confirmVariant="danger"
        onConfirm={discard}
      />
    </div>
  );
}
