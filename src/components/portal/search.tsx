"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, MessagesSquare, Search, User } from "lucide-react";
import { Dialog as D } from "radix-ui";
import type { Portal } from "@/lib/domain/permissions";
import { directoryVisibleUserIds, fellowMembership, instructorTrackIds, isAdmin } from "@/lib/domain/permissions";
import { applicationsInScope, applicationsOf, conversationTitle, visibleConversations } from "@/lib/domain/selectors";
import { useDb, usePersonaId } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/display";

interface Result {
  id: string;
  group: "People" | "Applications" | "Learning" | "Conversations";
  title: string;
  detail: string;
  href: string;
}

const GROUP_ICON = { People: User, Applications: FileText, Learning: BookOpen, Conversations: MessagesSquare };

/**
 * Global search. Only indexes records the current persona can access — the
 * same permission helpers used by listings and route guards.
 */
export function GlobalSearch({ portal }: { portal: Portal }) {
  const db = useDb();
  const me = usePersonaId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const index = useMemo<Result[]>(() => {
    if (!me) return [];
    const out: Result[] = [];
    const peopleBase = portal === "admin" ? "/admin/people?u=" : portal === "staff" ? "/staff/mentees?u=" : "/workspace/cohort?u=";
    for (const id of directoryVisibleUserIds(db, me)) {
      const u = db.users[id];
      if (!u || id === me) continue;
      out.push({ id: `p-${id}`, group: "People", title: u.name, detail: u.ventureName ? `${u.ventureName} · ${db.cohorts[fellowMembership(db, id)?.cohortId ?? ""]?.name ?? ""}` : "", href: `${peopleBase}${id}` });
    }
    const apps = portal === "admin" ? applicationsInScope(db, me) : portal === "applicant" ? applicationsOf(db, me) : [];
    for (const a of apps)
      out.push({
        id: `a-${a.id}`,
        group: "Applications",
        title: `${db.users[a.applicantId]?.name} — ${a.reference ?? "Draft"}`,
        detail: `${db.cohorts[a.cohortId]?.name} · ${a.status.replace("_", " ")}`,
        href: portal === "admin" ? `/admin/applications/${a.id}` : `/applicant/applications/${a.id}`,
      });
    let trackIds: string[] = [];
    if (portal === "workspace") trackIds = fellowMembership(db, me)?.trackId ? [fellowMembership(db, me)!.trackId!] : [];
    else if (portal === "staff") trackIds = instructorTrackIds(db, me);
    else if (portal === "admin" && isAdmin(db, me)) trackIds = Object.keys(db.tracks);
    for (const m of Object.values(db.modules).filter((m) => trackIds.includes(m.trackId)))
      for (const sid of m.sessionIds) {
        const s = db.sessions[sid];
        const c = portal === "staff" ? s?.draft ?? s?.published : s?.published;
        if (!s || !c) continue;
        out.push({
          id: `s-${sid}`,
          group: "Learning",
          title: c.title,
          detail: `${db.tracks[m.trackId]?.shortName} · ${m.title}`,
          href: portal === "workspace" ? `/workspace/learning/${m.id}/${sid}` : portal === "staff" ? `/staff/content/${m.id}?s=${sid}` : `/admin/curriculum?m=${m.id}`,
        });
      }
    if (portal !== "applicant")
      for (const c of visibleConversations(db, me, portal === "admin" ? "supervision" : "inbox"))
        out.push({ id: `c-${c.id}`, group: "Conversations", title: conversationTitle(db, c, me), detail: db.cohorts[c.cohortId]?.name ?? "", href: `/${portal}/messages?c=${c.id}` });
    return out;
  }, [db, me, portal]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return index.filter((r) => r.group !== "Learning").slice(0, 8);
    return index.filter((r) => `${r.title} ${r.detail}`.toLowerCase().includes(term)).slice(0, 30);
  }, [index, q]);

  const go = (r: Result) => {
    setOpen(false);
    setQ("");
    router.push(r.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-10 items-center gap-2 rounded-[10px] bg-paper px-3 text-[14px] text-muted ring-1 ring-line transition-colors hover:text-void md:flex md:w-56 lg:w-72"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Search</span>
        <Kbd>⌘K</Kbd>
      </button>
      <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-[10px] hover:bg-paper md:hidden" aria-label="Search">
        <Search className="size-[19px]" aria-hidden />
      </button>
      <D.Root open={open} onOpenChange={setOpen}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-[70] bg-black/40" />
          <D.Content className="fixed left-1/2 top-[12vh] z-[71] w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[16px] bg-paper shadow-float outline-none" aria-describedby={undefined}>
            <D.Title className="sr-only">Search</D.Title>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-5 text-muted" aria-hidden />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  } else if (e.key === "Enter" && results[active]) go(results[active]);
                }}
                placeholder="Search people, applications, sessions, conversations…"
                className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#8a8a8a]"
                aria-label="Search"
                role="combobox"
                aria-expanded
                aria-controls="search-results"
              />
            </div>
            <ul id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-8 text-center text-[14px] text-muted">No results you have access to.</li>}
              {results.map((r, i) => {
                const Icon = GROUP_ICON[r.group];
                return (
                  <li key={r.id} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left", i === active && "bg-fog")}
                    >
                      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium">{r.title}</span>
                        {r.detail && <span className="block truncate text-[12.5px] text-muted">{r.detail}</span>}
                      </span>
                      <span className="text-[11.5px] uppercase tracking-[0.12em] text-muted">{r.group}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-line px-4 py-2 text-[12px] text-muted">Results are limited to records your role can access.</p>
          </D.Content>
        </D.Portal>
      </D.Root>
    </>
  );
}
