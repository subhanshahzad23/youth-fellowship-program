"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, ChevronDown, CircleSlash, DatabaseZap, FilePlus2, FileText, History, Info, Layers, Loader2, Play, RefreshCw, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import type { ImportRun } from "@/lib/domain/types";
import { runNotionImport } from "@/lib/actions/learning";
import { canRunImport } from "@/lib/domain/permissions";
import { notionFixtures, planImport, type PlanItem } from "@/lib/sim/notion";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { cn, fmtDateTime, fmtRelative, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Notice, Panel, PanelHeader, RestrictedState, type Tone } from "@/components/ui/display";
import { ConfirmDialog, Segmented } from "@/components/ui/overlay";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";

const ACTION: Record<PlanItem["action"], { label: string; tone: Tone; Icon: typeof FilePlus2 }> = {
  create: { label: "Create", tone: "green", Icon: FilePlus2 },
  update: { label: "Update", tone: "blue", Icon: RefreshCw },
  skip: { label: "Skip", tone: "neutral", Icon: CircleSlash },
};

const NOTION_TYPE_LABEL: Record<string, string> = {
  heading_2: "Headings",
  paragraph: "Paragraphs",
  bulleted_list_item: "Bulleted items",
  numbered_list_item: "Numbered items",
  callout: "Callouts",
  quote: "Quotes",
  video: "Videos",
  file: "Files",
  to_do: "Tasks",
};

function ActionBadge({ action }: { action: PlanItem["action"] }) {
  const a = ACTION[action];
  return (
    <Badge tone={a.tone} icon={<a.Icon className="size-3.5" aria-hidden />}>
      {a.label}
    </Badge>
  );
}

function mappedLine(m?: Record<string, number>) {
  if (!m) return "—";
  const parts = Object.entries(m).map(([k, v]) => `${k} ${v}`);
  return parts.length ? parts.join(" · ") : "—";
}

type Filter = "all" | PlanItem["action"];

export function NotionTab() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();
  const access = canRunImport(db, me.id);

  const [showPlan, setShowPlan] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirm, setConfirm] = useState(false);
  const [run, setRun] = useState<{ pct: number; label: string } | null>(null);
  const [result, setResult] = useState<ImportRun | null>(null);
  const [openRun, setOpenRun] = useState<string | null>(null);

  const source = useMemo(() => {
    const pages = notionFixtures();
    const sessions = pages.reduce((n, p) => n + p.children.length, 0);
    const types: Record<string, number> = {};
    let blocks = 0;
    for (const p of pages)
      for (const c of p.children)
        for (const b of c.blocks) {
          blocks++;
          types[b.type] = (types[b.type] ?? 0) + 1;
        }
    return { modules: pages.length, sessions, blocks, types };
  }, []);

  // Recomputed from the live database, so after an import it shows everything skipped.
  const livePlan = useMemo(() => planImport(db), [db]);
  const plan = showPlan ? livePlan : [];
  const counts = { all: plan.length, create: plan.filter((p) => p.action === "create").length, update: plan.filter((p) => p.action === "update").length, skip: plan.filter((p) => p.action === "skip").length };
  const visible = filter === "all" ? plan : plan.filter((p) => p.action === filter);
  const history = useMemo(() => Object.values(db.imports).sort((a, b) => (a.at < b.at ? 1 : -1)), [db.imports]);

  if (!access.ok) return <RestrictedState title="Migration is restricted" reason={access.reason} />;

  async function preview() {
    setPlanning(true);
    await sleep(500);
    setShowPlan(true);
    setPlanning(false);
  }

  async function doRun() {
    const items = livePlan;
    setResult(null);
    setRun({ pct: 0, label: "Reading the export…" });
    await sleep(250);
    // Bounded, perceptible progress (~1.5s total regardless of item count).
    const step = Math.max(1, Math.ceil(items.length / 30));
    for (let i = 0; i < items.length; i += step) {
      setRun({ pct: Math.round((i / items.length) * 92), label: `${items[i].kind === "module" ? "Module" : "Session"}: ${items[i].title}` });
      await sleep(45);
    }
    setRun({ pct: 96, label: "Writing changes…" });
    await sleep(250);
    const r = runNotionImport();
    if (!r.ok) {
      setRun(null);
      toast.error(r.error);
      return true;
    }
    setRun({ pct: 100, label: "Done" });
    await sleep(250);
    setRun(null);
    const saved = r.value.runId;
    setResult({ id: saved, at: now, byId: me.id, created: r.value.created, updated: r.value.updated, skipped: r.value.skipped, details: [] });
    setOpenRun(saved);
    setShowPlan(true);
    toast.success("Import complete", { description: `${r.value.created} created · ${r.value.updated} updated · ${r.value.skipped} skipped` });
    return true;
  }

  const pending = livePlan.filter((p) => p.action !== "skip").length;

  return (
    <div className="space-y-4">
      <Notice tone="blue" icon={<Info className="size-4" aria-hidden />} title="Simulated migration">
        This runs against a bundled synthetic Notion export. There&apos;s no live connection to Notion, and nothing leaves this browser.
      </Notice>

      {/* Source summary */}
      <Panel>
        <PanelHeader
          title="Source: Notion curriculum workspace (export)"
          description="Module pages contain session pages; each Notion block maps to a platform content block."
          actions={
            <>
              <Button variant="outline" icon={<ScanSearch className="size-4" />} onClick={() => void preview()} loading={planning}>
                {showPlan ? "Refresh mapping" : "Preview mapping"}
              </Button>
              <Button icon={<Play className="size-4" />} onClick={() => setConfirm(true)} disabled={!!run}>
                Run import
              </Button>
            </>
          }
        />
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Module pages", value: source.modules, Icon: Layers },
            { label: "Session pages", value: source.sessions, Icon: FileText },
            { label: "Blocks", value: source.blocks, Icon: DatabaseZap },
            { label: "Pending changes", value: pending, Icon: RefreshCw },
          ].map((s) => (
            <div key={s.label} className="rounded-[14px] bg-fog p-4">
              <dt className="flex items-center gap-1.5 text-[13px] text-muted">
                <s.Icon className="size-3.5" aria-hidden /> {s.label}
              </dt>
              <dd className="mt-1 font-display text-[34px] leading-none tracking-[-0.04em] tabular">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Object.entries(source.types)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <Badge key={k}>
                {NOTION_TYPE_LABEL[k] ?? k} · {v}
              </Badge>
            ))}
        </div>

        <AnimatePresence>
          {run && (
            <motion.div
              key="run"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="mt-5 rounded-[14px] bg-void p-4 text-paper"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-3 text-[14px]">
                <span className="flex min-w-0 items-center gap-2">
                  <Loader2 className="size-4 shrink-0 animate-spin text-jade" aria-hidden />
                  <span className="truncate">{run.label}</span>
                </span>
                <span className="shrink-0 tabular text-[#cfcfcf]">{run.pct}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#333]">
                <motion.div className="h-full rounded-full bg-jade" animate={{ width: `${run.pct}%` }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {result && !run && (
          <div className="mt-5 rounded-[14px] bg-leaf p-4" role="status">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-leaf-ink">
              <CheckCircle2 className="size-4" aria-hidden /> Import complete
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3 text-center sm:max-w-md">
              {[
                ["Created", result.created],
                ["Updated", result.updated],
                ["Skipped", result.skipped],
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-[10px] bg-paper px-3 py-2">
                  <p className="font-display text-[28px] leading-none tabular">{v}</p>
                  <p className="mt-1 text-[12.5px] text-muted">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-ink">
              {result.created + result.updated > 0
                ? "Imported sessions are published to fellows on their track. Running the import again skips everything that's already in sync."
                : "Everything was already in sync — no duplicates were created."}
            </p>
          </div>
        )}
      </Panel>

      {/* Mapping preview */}
      {showPlan && (
        <Panel>
          <PanelHeader
            title="Mapping preview"
            description="What the import would do right now, compared with the platform's published content."
            actions={
              <div className="no-scrollbar max-w-full overflow-x-auto">
                <Segmented
                  label="Filter mapping"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: `All · ${counts.all}` },
                    { value: "create", label: `Create · ${counts.create}` },
                    { value: "update", label: `Update · ${counts.update}` },
                    { value: "skip", label: `Skip · ${counts.skip}` },
                  ]}
                />
              </div>
            }
          />
          {visible.length === 0 ? (
            <p className="rounded-[12px] bg-fog p-4 text-[14px] text-muted">Nothing in this category.</p>
          ) : (
            <>
              <div className="hidden max-h-[560px] overflow-y-auto rounded-[12px] ring-1 ring-line md:block">
                <Table caption="Import mapping preview">
                  <THead>
                    <tr>
                      <TH>Notion item</TH>
                      <TH>Kind</TH>
                      <TH>Action</TH>
                      <TH>Reason</TH>
                      <TH>Mapped blocks</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {visible.map((p) => (
                      <TR key={p.notionId}>
                        <TD className="max-w-[280px]">
                          <span className="block truncate font-medium">{p.title}</span>
                          <span className="block truncate font-mono text-[11.5px] text-muted">
                            {p.notionId}
                            {p.targetId && ` → ${p.targetId}`}
                          </span>
                        </TD>
                        <TD className="capitalize text-muted">{p.kind}</TD>
                        <TD>
                          <ActionBadge action={p.action} />
                        </TD>
                        <TD className="text-[13.5px] text-ink">{p.reason}</TD>
                        <TD className="text-[12.5px] text-muted">{mappedLine(p.mapped)}</TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              </div>
              <ul className="grid gap-2 md:hidden">
                {visible.map((p) => (
                  <li key={p.notionId} className="rounded-[12px] bg-fog p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-[14.5px] font-medium">{p.title}</span>
                        <span className="block truncate font-mono text-[11.5px] text-muted">{p.notionId}</span>
                      </span>
                      <ActionBadge action={p.action} />
                    </div>
                    <p className="mt-1 text-[13px] text-ink">
                      <span className="capitalize">{p.kind}</span> · {p.reason}
                    </p>
                    {p.mapped && <p className="mt-0.5 text-[12.5px] text-muted">{mappedLine(p.mapped)}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      )}

      {/* History */}
      <Panel>
        <PanelHeader title="Import history" description="Every run is also recorded in the audit log." />
        {history.length === 0 ? (
          <p className="flex items-center gap-2 text-[14px] text-muted">
            <History className="size-4" aria-hidden /> No imports have run yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((h) => {
              const changed = h.details.filter((d) => d.result !== "skipped");
              const open = openRun === h.id;
              return (
                <li key={h.id} className="py-3 first:pt-0 last:pb-0">
                  <button type="button" onClick={() => setOpenRun(open ? null : h.id)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
                    <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200", !open && "-rotate-90")} aria-hidden />
                    <span className="text-[14.5px] font-medium">{fmtDateTime(h.at)}</span>
                    <span className="text-[13px] text-muted">
                      {db.users[h.byId]?.name ?? "Former admin"} · {fmtRelative(h.at, now)}
                    </span>
                    <span className="ml-auto flex flex-wrap gap-1.5">
                      <Badge tone="green">{h.created} created</Badge>
                      <Badge tone="blue">{h.updated} updated</Badge>
                      <Badge>{h.skipped} skipped</Badge>
                    </span>
                  </button>
                  {open && (
                    <div className="mt-2 pl-7">
                      {changed.length === 0 ? (
                        <p className="text-[13.5px] text-muted">Everything was already in sync — {h.skipped} items skipped, nothing duplicated.</p>
                      ) : (
                        <ul className="space-y-1 text-[13.5px]">
                          {changed.map((d) => (
                            <li key={d.notionId} className="flex flex-wrap items-center gap-2">
                              <ActionBadge action={d.result === "created" ? "create" : "update"} />
                              <span className="font-medium">{d.title}</span>
                              <span className="text-muted">
                                {d.kind}
                                {d.targetId && ` · ${d.targetId}`}
                              </span>
                            </li>
                          ))}
                          <li className="pt-1 text-muted">{h.skipped} unchanged items skipped.</li>
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Run the curriculum import?"
        description={
          pending
            ? `${pending} item${pending === 1 ? "" : "s"} will be created or updated from the export. New and updated sessions are published to fellows on their track right away.`
            : "Everything is already in sync. The import will skip every item and create nothing."
        }
        confirmLabel="Run import"
        confirmVariant="primary"
        onConfirm={() => {
          setConfirm(false);
          void doRun();
          return true;
        }}
      />
    </div>
  );
}
