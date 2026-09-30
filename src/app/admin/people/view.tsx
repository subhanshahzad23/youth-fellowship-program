"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Users } from "lucide-react";
import { trackProgress } from "@/lib/domain/selectors";
import { useDb, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { plural } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, PageHeader, Panel, ProgressBar, StatusBadge } from "@/components/ui/display";
import { Input, Select } from "@/components/ui/form";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { useAdminScope } from "@/components/admin/scope";
import { PersonSheet } from "@/components/admin/person-panel";
import { PERSON_ROLE_LABEL, peopleInScope, type PersonRole, type PersonRow } from "@/components/admin/people-data";

const ROLE_FILTERS: { value: "all" | PersonRole | "staff"; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "fellow", label: "Fellows" },
  { value: "applicant", label: "Applicants" },
  { value: "staff", label: "All staff" },
  { value: "instructor", label: "Instructors" },
  { value: "mentor", label: "Mentors" },
  { value: "program_admin", label: "Program admins" },
  { value: "executive_admin", label: "Executive admins" },
];
const STAFF: PersonRole[] = ["executive_admin", "program_admin", "instructor", "mentor"];

export function PeopleView() {
  const db = useDb();
  const me = useMe()!;
  const meId = me.id;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { scope, filter, exec } = useAdminScope();
  const setFilter = useUI((s) => s.setAdminCohortFilter);
  const initialRole = params.get("role");
  const [role, setRole] = useState<string>(ROLE_FILTERS.some((r) => r.value === initialRole) ? initialRole! : "all");
  const [q, setQ] = useState("");
  const openId = params.get("u");

  const all = useMemo(() => peopleInScope(db, meId), [db, meId]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((r) => {
      if (filter !== "all") {
        // Execs' unassigned staff (no cohort) only show under "All cohorts".
        if (!r.cohortIds.includes(filter)) return false;
      }
      if (role === "staff" ? !r.roles.some((x) => STAFF.includes(x)) : role !== "all" && !r.roles.includes(role as PersonRole)) return false;
      if (!needle) return true;
      return [r.user.name, r.user.email, r.user.ventureName ?? "", r.user.title ?? ""].some((s) => s.toLowerCase().includes(needle));
    });
  }, [all, filter, role, q]);

  const setOpen = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("u", id);
    else next.delete("u");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const cohortCell = (r: PersonRow) => {
    const names = r.cohortIds.map((id) => db.cohorts[id]?.name).filter(Boolean);
    if (!names.length) return <span className="text-muted">{exec ? "All cohorts" : "—"}</span>;
    return <span>{names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ")}</span>;
  };

  const detailCell = (r: PersonRow) => {
    if (r.fellow) {
      const t = r.fellow.trackId ? db.tracks[r.fellow.trackId] : undefined;
      const p = t ? trackProgress(db, r.user.id, t.id) : undefined;
      return (
        <div className="min-w-[140px]">
          <div className="flex items-center justify-between gap-2 text-[13px]">
            <span className="truncate text-muted">{t?.shortName ?? "No track"}</span>
            <span className="tabular">{p?.pct ?? 0}%</span>
          </div>
          <ProgressBar value={p?.pct ?? 0} className="mt-1 h-1.5" label={`${r.user.name} progress`} />
        </div>
      );
    }
    if (r.apps[0]) return <StatusBadge status={r.apps[0].status} />;
    const staffRoles = Object.values(db.memberships).filter((m) => m.userId === r.user.id && m.status === "active" && m.role !== "fellow" && scope.includes(m.cohortId));
    if (r.roles.includes("mentor")) {
      const n = Object.values(db.mentorAssignments).filter((a) => a.mentorId === r.user.id && a.status === "active" && scope.includes(a.cohortId)).length;
      return <span className="text-[13.5px] text-muted">{plural(n, "mentee")}</span>;
    }
    if (r.roles.includes("instructor")) {
      const tracks = [...new Set(staffRoles.filter((m) => m.role === "instructor").map((m) => db.tracks[m.trackId ?? ""]?.shortName))].filter(Boolean);
      return <span className="text-[13.5px] text-muted">Teaches {tracks.join(", ") || "—"}</span>;
    }
    return <span className="block truncate text-[13.5px] text-muted">{r.user.title ?? "—"}</span>;
  };

  const counts = useMemo(
    () => ({
      fellows: all.filter((r) => r.roles.includes("fellow") && (filter === "all" || r.cohortIds.includes(filter))).length,
      applicants: all.filter((r) => r.roles.includes("applicant") && !r.roles.includes("fellow") && (filter === "all" || r.cohortIds.includes(filter))).length,
      staff: all.filter((r) => r.roles.some((x) => STAFF.includes(x)) && (filter === "all" || r.cohortIds.includes(filter))).length,
    }),
    [all, filter],
  );

  return (
    <>
      <PageHeader
        eyebrow="Program admin"
        title="People"
        description={`Fellows, applicants and staff across ${filter === "all" ? (exec ? "every cohort" : "your cohorts") : db.cohorts[filter]?.name}. Private applicant details stay with assigned reviewers.`}
      />

      <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-xl">
        {[
          ["Fellows", counts.fellows, "fellow"],
          ["Applicants", counts.applicants, "applicant"],
          ["Staff", counts.staff, "staff"],
        ].map(([label, n, value]) => (
          <button
            key={label as string}
            type="button"
            onClick={() => setRole(role === value ? "all" : (value as string))}
            aria-pressed={role === value}
            className={`rounded-[14px] px-4 py-3 text-left transition-colors ${role === value ? "bg-void text-paper" : "bg-paper hover:bg-[#fafafa]"}`}
          >
            <span className={`block text-[12.5px] ${role === value ? "text-paper/70" : "text-muted"}`}>{label}</span>
            <span className="font-display text-[28px] leading-none tracking-[-0.03em] tabular">{n as number}</span>
          </button>
        ))}
      </div>

      <Panel className="p-0 sm:p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          <div className="relative min-w-[200px] flex-[2]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or venture" aria-label="Search people" className="h-10 pl-9" />
          </div>
          <div className="min-w-[150px] flex-1">
            <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role" className="h-10">
              {ROLE_FILTERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[150px] flex-1">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by cohort" className="h-10">
              <option value="all">{exec ? "All cohorts" : "All my cohorts"}</option>
              {scope.map((id) => (
                <option key={id} value={id}>
                  {db.cohorts[id]?.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="px-4 pt-3 text-[13px] text-muted" aria-live="polite">
          {plural(rows.length, "person", "people")}
        </p>

        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Users className="size-5" />}
              title="Nobody matches"
              description="Try a different name, role or cohort."
              action={
                <Button size="sm" variant="outline" onClick={() => (setQ(""), setRole("all"), setFilter("all"))}>
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table caption="People in scope" className="rounded-none rounded-b-[20px]">
                <THead>
                  <tr>
                    <TH>Person</TH>
                    <TH>Role</TH>
                    <TH>Cohort</TH>
                    <TH>Mentor</TH>
                    <TH className="w-[200px]">Progress or status</TH>
                  </tr>
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <TR key={r.user.id} onClick={() => setOpen(r.user.id)} selected={openId === r.user.id}>
                      <TD>
                        <button type="button" onClick={(e) => (e.stopPropagation(), setOpen(r.user.id))} className="group flex items-center gap-3 text-left">
                          <Avatar name={r.user.name} hue={r.user.avatarHue} size={34} />
                          <span className="min-w-0">
                            <span className="block font-medium group-hover:underline">{r.user.name}</span>
                            <span className="block max-w-[260px] truncate text-[13px] text-muted">{r.user.ventureName ?? r.user.title ?? r.user.pronouns ?? ""}</span>
                          </span>
                        </button>
                      </TD>
                      <TD>
                        <span className="flex flex-wrap gap-1">
                          {r.roles.slice(0, 2).map((x) => (
                            <Badge key={x} tone={x === "fellow" ? "green" : x === "applicant" ? "blue" : "neutral"}>
                              {PERSON_ROLE_LABEL[x]}
                            </Badge>
                          ))}
                        </span>
                      </TD>
                      <TD className="text-[13.5px]">{cohortCell(r)}</TD>
                      <TD className="text-[13.5px]">{r.mentorId ? db.users[r.mentorId]?.name : r.fellow ? <span className="text-muted">Unpaired</span> : <span className="text-muted">—</span>}</TD>
                      <TD>{detailCell(r)}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="grid grid-cols-1 gap-2 p-4 md:hidden">
              {rows.map((r) => (
                <li key={r.user.id}>
                  <button type="button" onClick={() => setOpen(r.user.id)} className="w-full rounded-[14px] bg-fog p-3.5 text-left hover:bg-ash">
                    <span className="flex items-center gap-3">
                      <Avatar name={r.user.name} hue={r.user.avatarHue} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{r.user.name}</span>
                        <span className="block truncate text-[13px] text-muted">{r.user.ventureName ?? r.user.title ?? ""}</span>
                      </span>
                      <Badge tone={r.roles[0] === "fellow" ? "green" : r.roles[0] === "applicant" ? "blue" : "neutral"}>{PERSON_ROLE_LABEL[r.roles[0]]}</Badge>
                    </span>
                    <span className="mt-2.5 flex items-center justify-between gap-3 text-[13px] text-muted">
                      <span className="truncate">{cohortCell(r)}</span>
                      <span className="min-w-0 max-w-[60%] shrink-0 truncate text-right">{detailCell(r)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <PersonSheet userId={openId} onClose={() => setOpen(null)} />
    </>
  );
}
