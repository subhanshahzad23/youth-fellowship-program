"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Database as DatabaseIcon, HardDrive, Inbox, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useNow } from "@/lib/hooks";
import { resetDemo, STORAGE_KEY, useDb } from "@/lib/store/store";
import { fmtBytes, fmtDateLong, fmtTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Notice, PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { ConfirmDialog, TabsContent, TabsList, TabsRoot, TabsTrigger } from "@/components/ui/overlay";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { EmailOutbox } from "@/components/admin/email-outbox";

const TABS = ["notifications", "outbox", "demo", "security"] as const;
type Tab = (typeof TABS)[number];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("notifications");
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1) as Tab;
      if (TABS.includes(h)) setTab(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const change = (v: string) => {
    setTab(v as Tab);
    window.history.replaceState(null, "", v === "notifications" ? window.location.pathname : `#${v}`);
  };

  return (
    <>
      <PageHeader eyebrow="Program admin" title="Settings" description="Your notifications, the simulated email outbox and the demo's own data." />
      <TabsRoot value={tab} onValueChange={change}>
        <TabsList aria-label="Settings sections" className="mb-5">
          <TabsTrigger value="notifications">
            <Bell className="size-4" aria-hidden /> Notifications
          </TabsTrigger>
          <TabsTrigger value="outbox">
            <Inbox className="size-4" aria-hidden /> Email outbox
          </TabsTrigger>
          <TabsTrigger value="demo">
            <DatabaseIcon className="size-4" aria-hidden /> Demo data
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-4" aria-hidden /> Security note
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="outbox">
          <EmailOutbox />
        </TabsContent>
        <TabsContent value="demo">
          <DemoData />
        </TabsContent>
        <TabsContent value="security">
          <SecurityNote />
        </TabsContent>
      </TabsRoot>
    </>
  );
}

function DemoData() {
  const db = useDb();
  const now = useNow();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const stats = useMemo(
    () => ({
      bytes: new Blob([JSON.stringify(db)]).size,
      rows: [
        ["People", Object.keys(db.users).length],
        ["Cohorts", Object.keys(db.cohorts).length],
        ["Applications", Object.keys(db.applications).length],
        ["Messages", Object.keys(db.messages).length],
        ["Announcements", Object.keys(db.announcements).length],
        ["Simulated emails", Object.keys(db.outbox).length],
        ["Audit events", Object.keys(db.audit).length],
        ["Uploaded files", Object.values(db.documents).filter((d) => d.blobKey && !d.removedAt).length],
      ] as [string, number][],
    }),
    [db],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel>
        <PanelHeader title="Where the demo keeps its data" description="Everything lives in this browser. There is no server and no shared database." />
        <ul className="grid grid-cols-1 gap-3">
          <li className="flex items-start gap-3 rounded-[12px] bg-fog p-4">
            <DatabaseIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold">Records · localStorage</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted">
                People, applications, reviews, messages, announcements, the email outbox and the audit log are saved under <code className="rounded bg-paper px-1 font-mono text-[12.5px]">{STORAGE_KEY}</code>. About {fmtBytes(stats.bytes)} right now.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-[12px] bg-fog p-4">
            <HardDrive className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold">Uploaded files · IndexedDB</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted">The bytes of files people add (proof of residence, attachments) are stored in IndexedDB. Only a key is kept in the record — never a temporary link.</p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-[12px] bg-fog p-4">
            <KeyRound className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold">Sign-in · simulated</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted">Choosing a demo identity stands in for signing in. There are no passwords. Changes survive a refresh and sync between tabs of this browser, but other people and devices won&apos;t see them.</p>
            </div>
          </li>
        </ul>
        <p className="mt-4 text-[13px] text-muted">
          Demo date: {fmtDateLong(now)}, {fmtTime(now)} UTC. The clock starts on October 30, 2026 and moves forward in real time.
        </p>
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel>
          <PanelHeader title="What's saved" />
          <dl className="grid grid-cols-2 gap-2">
            {stats.rows.map(([label, n]) => (
              <div key={label} className="rounded-[10px] bg-fog px-3 py-2">
                <dt className="text-[12.5px] text-muted">{label}</dt>
                <dd className="text-[18px] font-semibold tabular">{n}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel>
          <PanelHeader title="Reset the demo" description="Restore the original fictional data for a fresh walkthrough." />
          <Notice tone="amber" className="mb-4">
            This clears every change made in this browser — new applications, messages, announcements, uploads and audit entries — and signs you out.
          </Notice>
          <Button variant="danger" icon={<RotateCcw className="size-4" />} onClick={() => setConfirm(true)}>
            Reset demo data
          </Button>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Reset all demo data?"
        description="You'll return to the identity picker with the original seed data."
        confirmLabel="Reset demo"
        confirmVariant="danger"
        onConfirm={async () => {
          await resetDemo();
          toast.success("Demo data reset", { description: "Choose an identity to start again." });
          router.push("/demo");
        }}
      >
        <p className="text-[14px] leading-relaxed">Uploaded files in this browser are deleted too. This can&apos;t be undone.</p>
      </ConfirmDialog>
    </div>
  );
}

function SecurityNote() {
  const points: [string, string][] = [
    ["Permissions live in one place", "Every screen, search result and action asks the same rules module who may see or change what — for example, program admins only reach their own cohorts and executives can't open residence documents they aren't assigned to review."],
    ["Every action re-checks access", "Buttons are hidden when you can't use them, and the action itself checks again before changing anything. Denied attempts on sensitive records are written to the audit log."],
    ["Private applicant details stay narrow", "Date of birth, phone, guardian contact, address and residence documents are shown only to the applicant and reviewers assigned to that application."],
    ["Nothing is really sent", "Emails are simulated in an outbox inside this browser. Notifications are in-app only."],
  ];
  const production = [
    "Enforce the same rules on the server for every request and every file download — never trust the browser.",
    "Real authentication with verified accounts, session expiry and staff multi-factor sign-in.",
    "Database-level access policies so a query can't return records outside someone's scope.",
    "Short-lived, per-request links for restricted documents and an append-only audit store.",
    "A real email provider with consent records, unsubscribe handling and delivery logs.",
    "Data retention, export and deletion policies agreed with safeguarding and legal advisors.",
  ];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel>
        <PanelHeader title="How this demo protects data" description="Client-side role checks that demonstrate the intended workflows." />
        <ul className="grid grid-cols-1 gap-3">
          {points.map(([t, d]) => (
            <li key={t} className="rounded-[12px] bg-fog p-4">
              <p className="text-[14.5px] font-semibold">{t}</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel className="dots-dark text-paper">
        <p className="eyebrow text-jade">Before real people use it</p>
        <h2 className="mt-2 font-display text-[30px] leading-tight tracking-[-0.03em]">A production build needs server-side authorization.</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-paper/75">This demo runs entirely in your browser, so its checks show how the product should behave — they are not a security boundary. A production version would add:</p>
        <ul className="mt-4 grid grid-cols-1 gap-2.5">
          {production.map((p) => (
            <li key={p} className="flex gap-2.5 text-[14px] leading-relaxed text-paper/90">
              <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-jade" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
