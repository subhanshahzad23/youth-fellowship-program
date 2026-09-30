"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileSearch, History, Info, MapPinned, UserPlus } from "lucide-react";
import type { Application, Database, DocumentRecord, ID } from "@/lib/domain/types";
import { canAssignReviewers, canOpenDocument, isAssignedReviewer } from "@/lib/domain/permissions";
import { questionsForApplication } from "@/lib/domain/selectors";
import { assignReviewer } from "@/lib/actions/applications";
import { SERVICE_AREA } from "@/lib/sim/residence";
import { fmtDate, fmtDateTime, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Panel, PanelHeader, RestrictedState } from "@/components/ui/display";
import { DocumentRow } from "@/components/ui/files";
import { ELIGIBILITY_META, EligibilityBadge } from "./meta";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 py-2 text-[14px] first:pt-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function docLabel(db: Database, app: Application, doc: DocumentRecord) {
  if (doc.kind === "proof_of_residence")
    return `Proof of residence${app.answers.residence.proofDocumentId === doc.id && app.answers.residence.proofType ? ` · ${app.answers.residence.proofType}` : ""}`;
  const qid = Object.keys(app.answers.custom).find((k) => app.answers.custom[k] === doc.id);
  const q = qid ? questionsForApplication(db, app).find((x) => x.id === qid) : undefined;
  return q ? `Attachment · ${q.label}` : "Attachment";
}

export function EligibilityAndDocuments({ db, app, meId }: { db: Database; app: Application; meId: ID }) {
  const [assigning, setAssigning] = useState(false);
  const r = app.answers.residence;
  const check = r.check;
  const status = check?.status ?? "unchecked";
  const docs = app.documentIds.map((id) => db.documents[id]).filter(Boolean);
  const active = docs.filter((d) => !d.removedAt);
  const replaced = docs.filter((d) => d.removedAt);
  const denied = active.map((d) => ({ d, access: canOpenDocument(db, meId, d) })).find((x) => !x.access.ok);
  const assigned = isAssignedReviewer(db, meId, app.id);
  const canAssignSelf = !assigned && canAssignReviewers(db, meId, app).ok && !!db.users[meId];

  async function assignSelf() {
    setAssigning(true);
    await sleep(400);
    const res = assignReviewer(app.id, meId);
    setAssigning(false);
    if (res.ok) toast.success("You're now an assigned reviewer", { description: "You can open this application's documents. The assignment is recorded in the audit log." });
    else toast.error(res.error);
  }

  return (
    <Panel aria-labelledby="elig-h">
      <PanelHeader
        title={<span id="elig-h">Eligibility & documents</span>}
        description="The automated location check and the proof-of-residence document are reviewed separately."
      />
      <div className="grid gap-4 2xl:grid-cols-2">
        {/* Location check — automated */}
        <section aria-labelledby="loc-h" className="rounded-[16px] bg-fog p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="loc-h" className="flex items-center gap-2 text-[15px] font-semibold">
              <MapPinned className="size-4" aria-hidden /> Location check
            </h3>
            <EligibilityBadge status={status} />
          </div>
          <p className="mt-1 text-[13px] text-muted">Automated lookup against the {SERVICE_AREA.name} service area.</p>
          <dl className="mt-4 divide-y divide-line/70">
            <Row label="As entered">{check?.input || r.address || <span className="text-muted">No address</span>}</Row>
            <Row label="Matched">{check?.normalized ?? <span className="text-muted">—</span>}</Row>
            <Row label="District">
              {check?.district ? (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  {check.district}
                  {status === "inside" && <span className="text-[13px] text-leaf-ink">in service area</span>}
                  {status === "outside" && <span className="text-[13px] text-[#9f1239]">outside service area</span>}
                </span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </Row>
            <Row label="Checked">{check?.checkedAt ? fmtDateTime(check.checkedAt) : <span className="text-muted">Never</span>}</Row>
          </dl>
          {status === "ambiguous" && check?.candidates?.length ? (
            <div className="mt-3 rounded-[12px] bg-paper p-3">
              <p className="text-[13px] font-medium">Possible matches</p>
              <ul className="mt-2 space-y-1.5">
                {check.candidates.map((c) => (
                  <li key={c.label} className="flex flex-wrap items-center justify-between gap-2 text-[13.5px]">
                    <span>{c.label}</span>
                    <Badge tone={c.inside ? "green" : "red"}>{c.inside ? "Inside" : "Outside"}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {ELIGIBILITY_META[status].explain} A location match doesn&apos;t prove where someone lives — that&apos;s what the proof of residence is for.
          </p>
        </section>

        {/* Documents — human review */}
        <section aria-labelledby="docs-h" className="rounded-[16px] border-[1.5px] border-line p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="docs-h" className="flex items-center gap-2 text-[15px] font-semibold">
              <FileSearch className="size-4" aria-hidden /> Proof of residence & documents
            </h3>
            <Badge tone={assigned ? "green" : "neutral"}>{assigned ? "You can open these" : "Restricted"}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-muted">Reviewed by assigned reviewers against the address above.</p>

          {active.length === 0 ? (
            <p className="mt-4 rounded-[12px] bg-fog px-3 py-3 text-[14px] text-muted">No documents attached to this application.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {active.map((d) => (
                <li key={d.id}>
                  <p className="mb-1.5 text-[12.5px] font-medium text-muted">{docLabel(db, app, d)}</p>
                  <DocumentRow doc={d} />
                  <p className="mt-1 text-[12px] text-muted">Added {fmtDate(d.uploadedAt)}</p>
                </li>
              ))}
            </ul>
          )}

          {denied && !denied.access.ok && (
            <div className="mt-4">
              <RestrictedState
                title="Why you can't open these"
                reason={`${denied.access.reason} Access is checked again the moment you try to open a file, and denied attempts are recorded in the audit log.`}
                action={
                  canAssignSelf ? (
                    <Button size="sm" variant="outline" icon={<UserPlus className="size-4" />} loading={assigning} onClick={assignSelf}>
                      Assign myself as a reviewer
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}

          {replaced.length > 0 && (
            <p className="mt-4 flex items-start gap-2 text-[12.5px] text-muted">
              <History className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {replaced.length === 1 ? "1 earlier file was" : `${replaced.length} earlier files were`} replaced or removed by the applicant (
              {replaced.map((d) => d.name).join(", ")}).
            </p>
          )}
        </section>
      </div>
    </Panel>
  );
}
