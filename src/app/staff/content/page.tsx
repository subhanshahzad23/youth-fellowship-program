"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Lock, PencilLine } from "lucide-react";
import { canEditTrack } from "@/lib/domain/permissions";
import { modulesOfTrack } from "@/lib/domain/selectors";
import { useNow } from "@/lib/hooks";
import { useDb, useMe } from "@/lib/store/store";
import { fmtRelative } from "@/lib/utils";
import { Badge, PageHeader, Panel, RestrictedState } from "@/components/ui/display";
import { moduleCounts } from "@/components/learning/data";

export default function StaffContentPage() {
  const db = useDb();
  const me = useMe()!;
  const now = useNow();

  const tracks = useMemo(() => {
    return Object.values(db.tracks)
      .sort((a, b) => a.order - b.order)
      .map((t) => ({ t, access: canEditTrack(db, me.id, t.id), modules: modulesOfTrack(db, t.id).map((m) => ({ m, c: moduleCounts(db, m.id) })) }))
      .sort((a, b) => Number(b.access.ok) - Number(a.access.ok) || a.t.order - b.t.order);
  }, [db, me.id]);

  const editable = tracks.filter((x) => x.access.ok).length;

  return (
    <>
      <PageHeader
        eyebrow="Curriculum"
        title="Content"
        description="Edit sessions as private drafts, preview them exactly as fellows will see them, and publish when they're ready. Fellows only ever see published versions."
      />
      {editable === 0 && (
        <div className="mb-4">
          <RestrictedState title="View only" reason="Content editing is for track instructors. You can see how the curriculum is organized, but not change it." />
        </div>
      )}
      <div className="space-y-4">
        {tracks.map(({ t, access, modules }) => (
          <Panel key={t.id} aria-labelledby={`track-${t.id}`}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow flex items-center gap-2 text-muted">
                  <span className="inline-block size-2.5 rounded-full" style={{ background: t.color }} aria-hidden />
                  Track {t.order}
                </p>
                <h2 id={`track-${t.id}`} className="mt-1 font-display text-[28px] leading-tight tracking-[-0.03em]">
                  {t.name}
                </h2>
                <p className="mt-1 max-w-2xl text-[14.5px] text-muted">{t.tagline}</p>
              </div>
              {access.ok ? (
                <Badge tone="green" icon={<PencilLine className="size-3.5" aria-hidden />}>
                  You can edit
                </Badge>
              ) : (
                <Badge tone="neutral" icon={<Lock className="size-3.5" aria-hidden />}>
                  Locked
                </Badge>
              )}
            </div>
            {!access.ok && <p className="mb-3 flex items-start gap-2 rounded-[12px] bg-fog px-3.5 py-2.5 text-[13.5px] text-muted"><Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />{access.reason}</p>}
            <ol className={access.ok ? "grid gap-2 md:grid-cols-2" : "grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3"}>
              {modules.map(({ m, c }) =>
                access.ok ? (
                  <li key={m.id}>
                    <Link href={`/staff/content/${m.id}`} className="group flex h-full items-center gap-4 rounded-[14px] bg-fog p-4 transition-colors hover:bg-ash">
                      <span className="font-display text-[30px] leading-none tracking-[-0.04em] text-muted-display tabular" aria-hidden>
                        {String(m.order).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug">{m.title}</span>
                        <span className="mt-0.5 block text-[13px] text-muted">
                          {m.suggestedMonths} · {c.total} session{c.total === 1 ? "" : "s"} · updated {fmtRelative(m.updatedAt, now)}
                        </span>
                        {(c.drafts > 0 || c.neverPublished > 0) && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {c.drafts > 0 && <Badge tone="amber">{c.drafts} with draft changes</Badge>}
                            {c.neverPublished > 0 && <Badge tone="neutral">{c.neverPublished} never published</Badge>}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                ) : (
                  <li key={m.id} className="flex items-center gap-3 border-b border-line py-2.5 text-[14px] text-muted">
                    <span className="w-5 shrink-0 tabular">{m.order}.</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{m.title}</span>
                    <span className="shrink-0 text-[12.5px] tabular">{c.published} published</span>
                  </li>
                ),
              )}
            </ol>
          </Panel>
        ))}
      </div>
    </>
  );
}
