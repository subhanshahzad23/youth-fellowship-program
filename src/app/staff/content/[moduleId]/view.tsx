"use client";

import { useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, FilePenLine, Library, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Session, SessionKind } from "@/lib/domain/types";
import { createSession, deleteDraftSession, moveSession } from "@/lib/actions/learning";
import { canEditTrack } from "@/lib/domain/permissions";
import { sessionsOfModule } from "@/lib/domain/selectors";
import { useDb, useMe } from "@/lib/store/store";
import { cn, sleep } from "@/lib/utils";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/ui/display";
import { ConfirmDialog, Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/overlay";
import { Denied, RecordNotFound } from "@/components/portal/states";
import { useCrumb } from "@/components/portal/crumbs";
import { editorStatus, fmtMinutes, sessionTitleForStaff } from "@/components/learning/data";
import { EditorStatusBadge, KIND_META, KindIcon } from "@/components/learning/meta";
import { SessionEditor } from "@/components/learning/session-editor";

export function ModuleContentView() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const search = useSearchParams();
  const selectedId = search.get("s");
  const router = useRouter();
  const pathname = usePathname();
  const db = useDb();
  const me = useMe()!;
  const mod = db.modules[moduleId];
  const track = mod ? db.tracks[mod.trackId] : undefined;
  useCrumb(mod?.title);

  const sessions = useMemo(() => (mod ? sessionsOfModule(db, mod.id) : []), [db, mod]);
  const [dirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);

  if (!mod) return <RecordNotFound what="module" backHref="/staff/content" backLabel="Back to content" />;
  const access = canEditTrack(db, me.id, mod.trackId);
  if (!access.ok) return <Denied title="This module is outside your tracks" reason={access.reason} backHref="/staff/content" backLabel="Back to content" />;

  const selected = selectedId ? db.sessions[selectedId] : undefined;
  const validSelected = selected && selected.moduleId === mod.id ? selected : undefined;

  function go(href: string) {
    if (dirty) setPendingHref(href);
    else router.push(href);
  }

  async function create(kind: SessionKind) {
    if (dirty) {
      toast.error("Save or undo your changes first", { description: "You have unsaved edits in the open session." });
      return;
    }
    setCreating(true);
    await sleep(300);
    const r = createSession(mod!.id, kind);
    setCreating(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(`New ${KIND_META[kind].label.toLowerCase()} created as a draft`, { description: "Fellows won't see it until you publish." });
    router.push(`${pathname}?s=${r.value}`);
  }

  function move(s: Session, dir: -1 | 1) {
    const r = moveSession(s.id, dir);
    if (!r.ok) toast.error(r.error);
    else toast.success("Order updated", { id: "reorder", description: "Fellows see the new order right away." });
  }

  async function doDelete() {
    if (!deleting) return true;
    await sleep(350);
    const r = deleteDraftSession(deleting.id);
    if (!r.ok) {
      toast.error(r.error);
      return true;
    }
    toast.success("Draft session deleted");
    if (selectedId === deleting.id) router.replace(pathname);
    setDeleting(null);
    return true;
  }

  return (
    <>
      <PageHeader
        eyebrow={`${track?.name} · Module ${mod.order} · ${mod.suggestedMonths}`}
        title={mod.title}
        description={mod.summary}
        actions={
          <ButtonLink href="/staff/content" variant="outline" icon={<Library className="size-4" />}>
            All modules
          </ButtonLink>
        }
        className={cn(validSelected && "hidden lg:flex")}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        {/* Session list */}
        <aside className={cn("lg:sticky lg:top-24", validSelected && "hidden lg:block")} aria-label="Sessions in this module">
          <Panel className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 px-1 pb-2">
              <h2 className="text-[16px] font-semibold">
                Sessions <span className="font-normal text-muted">· {sessions.length}</span>
              </h2>
              <Menu>
                <MenuTrigger asChild>
                  <Button size="sm" variant="dark" icon={<Plus className="size-4" />} loading={creating}>
                    New
                    <ChevronDown className="-mr-1 ml-0.5 inline-block size-3.5 align-[-2px]" aria-hidden />
                  </Button>
                </MenuTrigger>
                <MenuContent align="end">
                  <MenuLabel>New session</MenuLabel>
                  {(["reading", "video", "task"] as SessionKind[]).map((k) => (
                    <MenuItem key={k} icon={<KindIcon kind={k} />} onSelect={() => void create(k)}>
                      {KIND_META[k].label}
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
            </div>
            <p className="px-1 pb-3 text-[12.5px] leading-snug text-muted">Reordering applies to fellows immediately. Content edits wait until you publish.</p>
            {sessions.length === 0 ? (
              <p className="rounded-[12px] bg-fog p-4 text-[14px] text-muted">No sessions yet. Create one with “New”.</p>
            ) : (
              <ol className="grid gap-1">
                {sessions.map((s, i) => {
                  const active = validSelected?.id === s.id;
                  const content = s.draft ?? s.published;
                  const title = sessionTitleForStaff(s);
                  return (
                    <li key={s.id} className={cn("flex items-stretch rounded-[12px] transition-colors", active ? "bg-fog ring-[1.5px] ring-void" : "hover:bg-fog")}>
                      <button type="button" onClick={() => go(`${pathname}?s=${s.id}`)} aria-current={active ? "true" : undefined} className="flex min-w-0 flex-1 items-start gap-2.5 rounded-[12px] p-2.5 text-left">
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] bg-paper text-[12px] font-semibold tabular ring-1 ring-line">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium leading-snug">{title}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
                            <KindIcon kind={s.kind} className="size-3.5" /> {KIND_META[s.kind].label} · {fmtMinutes(content?.durationMin ?? 0)}
                          </span>
                          <EditorStatusBadge session={s} className="mt-1.5" />
                        </span>
                      </button>
                      <div className="flex shrink-0 flex-col items-center justify-center py-1 pr-1">
                        <IconButton label={`Move “${title}” up`} onClick={() => move(s, -1)} disabled={i === 0} className="size-8">
                          <ArrowUp className="size-4" />
                        </IconButton>
                        <IconButton label={`Move “${title}” down`} onClick={() => move(s, 1)} disabled={i === sessions.length - 1} className="size-8">
                          <ArrowDown className="size-4" />
                        </IconButton>
                        {editorStatus(s) === "never_published" && (
                          <IconButton label={`Delete draft “${title}”`} onClick={() => setDeleting(s)} className="size-8 text-[#b00d28] hover:bg-[#fff1f2]">
                            <Trash2 className="size-4" />
                          </IconButton>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>
        </aside>

        {/* Editor */}
        <section className={cn("min-w-0", !validSelected && "hidden lg:block")} aria-label="Session editor">
          {validSelected ? (
            <SessionEditor key={validSelected.id} session={validSelected} module={mod} onDirtyChange={setDirty} onBack={() => go(pathname)} />
          ) : selectedId ? (
            <EmptyState
              icon={<FilePenLine className="size-5" />}
              title="That session isn't in this module"
              description="It may have been deleted, or the link points to a different module."
              action={
                <Button variant="outline" onClick={() => router.replace(pathname)}>
                  Clear selection
                </Button>
              }
              className="bg-paper"
            />
          ) : (
            <EmptyState
              icon={<FilePenLine className="size-5" />}
              title="Choose a session to edit"
              description="Edits are saved as a private draft. Preview them as a learner, then publish when you're ready."
              className="bg-paper py-16"
            />
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!pendingHref}
        onOpenChange={(v) => !v && setPendingHref(null)}
        title="Leave without saving?"
        description="You have unsaved changes in this session. They'll be lost if you switch now."
        confirmLabel="Discard changes"
        confirmVariant="danger"
        onConfirm={() => {
          const href = pendingHref;
          setDirty(false);
          setPendingHref(null);
          if (href) router.push(href);
          return true;
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this draft session?"
        description={deleting ? `“${sessionTitleForStaff(deleting)}” has never been published, so no fellow has seen it. This can't be undone.` : undefined}
        confirmLabel="Delete session"
        confirmVariant="danger"
        onConfirm={doDelete}
      />
    </>
  );
}
