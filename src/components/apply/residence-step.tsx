"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, FileText, Image as ImageIcon, Info, Loader2, MapPin, MapPinOff, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { ResidenceCheck } from "@/lib/domain/types";
import { attachSampleProof, attachUploadedDocument, chooseResidenceCandidate, removeDocument, runResidenceCheck } from "@/lib/actions/applications";
import { SAMPLE_PROOFS } from "@/lib/seed/applications";
import { ELIGIBILITY_COPY, RESIDENCE_FIXTURES, SERVICE_AREA } from "@/lib/sim/residence";
import { deleteFileBytes } from "@/lib/files";
import { useDb } from "@/lib/store/store";
import { cn, fmtBytes, fmtDateTime, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Notice, Panel } from "@/components/ui/display";
import { Input, RadioCards, Select } from "@/components/ui/form";
import { DocumentRow, FileDrop } from "@/components/ui/files";
import { PROOF_TYPES } from "./answers";
import { CHECK_TONE } from "./answer-summary";
import { controlProps, errorFor, Q, type StepProps } from "./fields";

const EASE = [0.23, 1, 0.32, 1] as const;

const STATUS_ICON: Record<ResidenceCheck["status"], typeof MapPin> = {
  unchecked: MapPin,
  inside: CheckCircle2,
  outside: MapPinOff,
  ambiguous: AlertTriangle,
  not_found: AlertTriangle,
};

function StepHeading({ n, title, question }: { n: number; title: string; question: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-void text-[13px] font-semibold text-paper tabular">{n}</span>
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="text-[14px] text-muted">{question}</p>
      </div>
    </div>
  );
}

function LocationResult({ check, p }: { check: ResidenceCheck; p: StepProps }) {
  const Icon = STATUS_ICON[check.status];
  const copy = ELIGIBILITY_COPY[check.status];
  const [choosing, setChoosing] = useState(false);
  const editable = p.canEdit("residence.address");
  return (
    <div className="rounded-[16px] border-[1.5px] border-line p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={CHECK_TONE[check.status]} icon={<Icon className="size-3.5" aria-hidden />}>
          Location: {copy.label}
        </Badge>
        {check.checkedAt && <span className="text-[12.5px] text-muted">Checked {fmtDateTime(check.checkedAt)}</span>}
      </div>
      {check.normalized && check.status !== "ambiguous" && (
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <dt className="eyebrow text-muted">Matched address</dt>
            <dd className="mt-1 break-words text-[16px] font-medium">{check.normalized}</dd>
          </div>
          {check.district && (
            <div>
              <dt className="eyebrow text-muted">District</dt>
              <dd className="mt-1 text-[16px] font-medium">{check.district}</dd>
            </div>
          )}
        </dl>
      )}
      <p className="mt-3 text-[14px] leading-relaxed text-ink">{copy.detail}</p>

      {check.status === "ambiguous" && check.candidates && (
        <div className="mt-4">
          <p className="mb-2 text-[14px] font-medium">Which one is your address?</p>
          <RadioCards
            name="residence-candidate"
            onChange={async (label) => {
              setChoosing(true);
              await sleep(250);
              const r = chooseResidenceCandidate(p.app.id, label);
              setChoosing(false);
              if (!r.ok) toast.error(r.error);
            }}
            options={check.candidates.map((c) => ({ value: c.label, label: c.label, description: c.inside ? "Inside Greater Larkhaven" : "Outside the service area" }))}
            columns={1}
            disabled={!editable || choosing}
          />
        </div>
      )}
      {check.status === "outside" && (
        <Notice tone="amber" className="mt-4" icon={<Info className="size-4" aria-hidden />}>
          Launchpad is funded to serve {SERVICE_AREA.name}, so a reviewer will look at your circumstances before a decision — for example, if you&apos;re moving into the area or study there. Your application isn&apos;t blocked.
        </Notice>
      )}
    </div>
  );
}

function ProofPicker({ p, replacing, onDone }: { p: StepProps; replacing: boolean; onDone: () => void }) {
  const db = useDb();
  const [busy, setBusy] = useState<string | null>(null);
  const currentId = p.view.residence.proofDocumentId;
  const current = currentId ? db.documents[currentId] : undefined;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[14.5px] font-medium">Use a sample document</p>
        <p className="text-[13px] text-muted">Fictional, watermarked files bundled with this demo — never use real documents here.</p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SAMPLE_PROOFS.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                disabled={!!busy}
                onClick={async () => {
                  setBusy(s.key);
                  await sleep(350);
                  const prevBlob = current?.blobKey;
                  const r = attachSampleProof(p.app.id, s.key);
                  setBusy(null);
                  if (!r.ok) return toast.error(r.error);
                  if (prevBlob) void deleteFileBytes(prevBlob);
                  onDone();
                  toast.success(`${s.title.replace(" (sample)", "")} attached`, { description: "Sample document · fictional and watermarked." });
                }}
                className="flex h-full w-full items-center gap-3 rounded-[14px] border-[1.5px] border-line bg-paper p-3 text-left transition-colors hover:border-void disabled:opacity-60 sm:flex-col sm:items-start sm:gap-2"
              >
                <span className="flex shrink-0 items-center justify-between sm:w-full">
                  <span className="grid size-9 place-items-center rounded-[8px] bg-fog">
                    {busy === s.key ? <Loader2 className="size-4 animate-spin" aria-hidden /> : s.mime.startsWith("image/") ? <ImageIcon className="size-4" aria-hidden /> : <FileText className="size-4" aria-hidden />}
                  </span>
                  <Badge className="hidden h-5 text-[11px] sm:inline-flex">Sample</Badge>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-medium leading-snug">{s.title.replace(" (sample)", "")}</span>
                  <span className="block truncate text-[12.5px] text-muted">
                    {s.name} · {fmtBytes(s.size)}
                  </span>
                </span>
                <Badge className="h-5 text-[11px] sm:hidden">Sample</Badge>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-[14.5px] font-medium">Or upload your own</p>
        <FileDrop
          label={replacing ? "Upload a replacement" : "Upload proof of residence"}
          hint="PDF, PNG, JPG or WebP · up to 8 MB · stored in this browser only"
          onStored={(file) => {
            const prevBlob = current?.blobKey;
            const r = attachUploadedDocument(p.app.id, file, { kind: "proof" });
            if (!r.ok) {
              void deleteFileBytes(file.blobKey);
              return toast.error(r.error);
            }
            if (prevBlob) void deleteFileBytes(prevBlob);
            onDone();
            toast.success(`${file.name} uploaded`, { description: "Only you and your assigned reviewers can open it." });
          }}
        />
      </div>
    </div>
  );
}

export function ResidenceStep(p: StepProps) {
  const db = useDb();
  const r = p.view.residence;
  const address = r.address ?? "";
  const check = r.check;
  const [checking, setChecking] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const canAddress = p.canEdit("residence.address");
  const canProof = p.canEdit("residence.proof");
  const proof = r.proofDocumentId ? db.documents[r.proofDocumentId] : undefined;
  const liveProof = proof && !proof.removedAt ? proof : undefined;
  const stored = p.app.answers.residence;
  const changedSinceCheck = !!stored.check && address !== (stored.address ?? "");

  const runCheck = async (input: string, fixture?: string) => {
    if (!input.trim()) {
      toast.error("Enter an address first.");
      return;
    }
    setChecking(fixture ?? "manual");
    await sleep(550);
    const res = runResidenceCheck(p.app.id, input, fixture);
    setChecking(null);
    if (!res.ok) return toast.error(res.error);
    p.drop(["residence.address"]);
    const label = ELIGIBILITY_COPY[res.value.status].label;
    if (res.value.status === "inside") toast.success(`Location check: ${label}`);
    else toast(`Location check: ${label}`);
  };

  return (
    <div className="space-y-4">
      <Notice tone="blue" icon={<Info className="size-4 text-[#1e40af]" aria-hidden />}>
        <strong>Two separate checks.</strong> The location check only tells us whether an address is inside {SERVICE_AREA.name}. An address existing isn&apos;t proof that you live there — that&apos;s what the proof of residence document is for, and only reviewers assigned to your application can open it.
      </Notice>

      <Panel className="sm:p-8">
        <StepHeading n={1} title="Location check" question="Is your home address inside our service area?" />
        <Q k="residence.address" p={p} label="Home address" required hint="Street, district and ZIP code — for example “14 Alder Row, Eastbank 00212”.">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void runCheck(address);
            }}
          >
            <Input
              {...controlProps(p, "residence.address", true)}
              value={address}
              onChange={(e) => p.edit({ residence: { address: e.target.value } })}
              autoComplete="street-address"
              placeholder="Start typing your address"
              className="sm:flex-1"
            />
            <Button type="submit" variant="dark" loading={checking === "manual"} disabled={!canAddress || !!checking} icon={<Search className="size-4" />} className="h-11">
              Check location
            </Button>
          </form>
        </Q>

        {canAddress && (
          <div className="mt-4 rounded-[14px] bg-fog p-3 sm:p-4">
            <p className="text-[13.5px] font-medium">Try a sample address</p>
            <p className="text-[12.5px] text-muted">Fictional addresses that show each result. Filling one runs the check.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {RESIDENCE_FIXTURES.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  disabled={!!checking}
                  onClick={() => {
                    p.edit({ residence: { address: f.input } });
                    void runCheck(f.input, f.key);
                  }}
                  className="flex flex-col items-start gap-0.5 rounded-[10px] bg-paper px-3 py-2.5 text-left ring-1 ring-line transition-colors hover:ring-void disabled:opacity-60"
                >
                  <span className="flex items-center gap-1.5 text-[13.5px] font-medium">
                    {checking === f.key && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                    {f.label}
                  </span>
                  <span className="text-[12.5px] text-muted">{f.input}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {checking ? (
              <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center gap-3 rounded-[16px] border-[1.5px] border-dashed border-line p-5 text-[14px] text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Looking up the address in the (simulated) address service…
              </motion.div>
            ) : check && check.status !== "unchecked" ? (
              <motion.div key={`${check.status}-${check.checkedAt}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}>
                <LocationResult check={check} p={p} />
              </motion.div>
            ) : (
              <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[14px] text-muted">
                <MapPin className="size-4" aria-hidden />
                {changedSinceCheck ? "Address changed — run the location check again." : address.trim() ? "Not checked yet — select “Check location”." : "Not checked yet."}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </Panel>

      <Panel className="sm:p-8">
        <StepHeading n={2} title="Proof of residence" question="Can you show that you live at this address?" />
        <div id="f-residence-proof" className={cn("scroll-mt-28 space-y-4", p.requested.includes("residence.proof") && "-mx-3 rounded-[14px] bg-[#fffaeb] p-3 ring-1 ring-[#f5d98a]")}>
          <p className="flex items-start gap-2 text-[14px] leading-relaxed text-ink">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            A recent utility bill, tenancy letter or school enrollment letter showing your name and address. It&apos;s reviewed by a person, separately from the location check, and it&apos;s restricted: executives and other staff can see that it exists, but not open it.
          </p>

          {liveProof ? (
            <div className="space-y-3">
              <DocumentRow
                doc={liveProof}
                onReplace={canProof ? () => setReplacing((x) => !x) : undefined}
                removable={canProof}
                onRemove={() => {
                  const res = removeDocument(p.app.id, liveProof.id);
                  if (!res.ok) return toast.error(res.error);
                  if (res.value) void deleteFileBytes(res.value);
                  setReplacing(false);
                  toast.success(`Removed ${liveProof.name}`);
                }}
              />
              <div className="max-w-sm">
                <label htmlFor="proof-type" className="text-[13.5px] font-medium">
                  Document type
                </label>
                <Select
                  id="proof-type"
                  className="mt-1"
                  value={r.proofType ?? ""}
                  disabled={!canProof}
                  onChange={(e) => p.edit({ residence: { proofType: e.target.value } })}
                >
                  <option value="">Choose a type…</option>
                  {[...new Set([...(r.proofType ? [r.proofType] : []), ...PROOF_TYPES])].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : (
            !canProof && <p className="text-[14px] text-muted">No document attached.</p>
          )}

          {canProof && (!liveProof || replacing) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }}>
              {replacing && <p className="mb-3 text-[13.5px] text-muted">Choose a replacement. The current file is retired once the new one is attached.</p>}
              <ProofPicker p={p} replacing={replacing} onDone={() => setReplacing(false)} />
            </motion.div>
          )}

          {errorFor(p, "residence.proof") && (
            <p className="flex items-start gap-1.5 text-[13.5px] text-[#b00d28]" role="alert">
              <AlertTriangle className="mt-[2px] size-3.5 shrink-0" aria-hidden />
              {errorFor(p, "residence.proof")}
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
