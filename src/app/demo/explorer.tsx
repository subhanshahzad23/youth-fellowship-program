"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Compass, RotateCcw, UserPlus } from "lucide-react";
import { createApplicantAccount } from "@/lib/actions/comms";
import { homeFor, roleLabel } from "@/lib/domain/permissions";
import { PERSONAS } from "@/lib/seed/people";
import { resetDemo, setPersona, useDb, useHydrated, useMe } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { WALKTHROUGH } from "@/lib/walkthrough";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/display";
import { Field, Input } from "@/components/ui/form";
import { ConfirmDialog, DialogContent, DialogRoot } from "@/components/ui/overlay";
import { DemoControl } from "@/components/demo/demo-control";

const ease = [0.23, 1, 0.32, 1] as const;

export function DemoExplorer() {
  const db = useDb();
  const me = useMe();
  const hydrated = useHydrated();
  const router = useRouter();
  const { setWalkthrough } = useUI();
  const [signupOpen, setSignupOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const enter = (userId: string) => {
    setPersona(userId);
    router.push(homeFor(db, userId));
  };

  const startWalkthrough = () => {
    const first = WALKTHROUGH[0];
    const p = PERSONAS.find((x) => x.key === first.persona)!;
    setWalkthrough(true, 0);
    setPersona(p.userId);
    router.push(first.href);
  };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="dots-dark text-paper">
        <div className="container-page flex h-20 items-center justify-between">
          <Link href="/" aria-label="Launchpad Fellowship home">
            <Logo dark />
          </Link>
          <Link href="/" className="text-[14.5px] text-muted-display hover:text-paper">
            Back to the website
          </Link>
        </div>
        <div className="container-page pb-20 pt-10 sm:pb-28 sm:pt-16">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="eyebrow text-muted-display">
            Interactive demo · fictional data
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.05 }} className="display-hero mt-4 max-w-4xl">
            <span className="text-muted-display">Explore every side of the fellowship.</span> <span>Pick a person and step in.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.15 }} className="mt-6 max-w-2xl text-[17px] leading-relaxed text-[#d0d0d0]">
            No passwords, no email checks. Each identity is a fictional person tied to real records in this demo — switching changes who you are, not what they&apos;re allowed to do.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.22 }} className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" arrow onClick={startWalkthrough} icon={<Compass className="size-4" />}>
              Start the guided walkthrough
            </Button>
            <Button size="lg" variant="ghost-dark" icon={<UserPlus className="size-4" />} onClick={() => setSignupOpen(true)}>
              Create an applicant account
            </Button>
          </motion.div>
        </div>
      </header>

      <main id="main" className="container-page -mt-10 pb-28 sm:-mt-14">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((p, i) => {
            const u = db.users[p.userId];
            const current = me?.id === p.userId;
            return (
              <motion.li key={p.key} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.25 + i * 0.05 }}>
                <button
                  type="button"
                  onClick={() => enter(p.userId)}
                  className="group flex h-full w-full flex-col rounded-[24px] bg-fog p-6 text-left transition-colors duration-300 hover:bg-ash focus-visible:outline-2 focus-visible:outline-void"
                >
                  <div className="flex items-center justify-between">
                    <Avatar name={p.label} hue={u?.avatarHue} size={48} />
                    {current && <span className="rounded-full bg-void px-2.5 py-1 text-[12px] font-medium text-paper">Signed in</span>}
                  </div>
                  <p className="mt-5 font-display text-[30px] leading-none tracking-[-0.03em]">{p.label}</p>
                  <p className="mt-2 text-[14px] font-medium">{hydrated && u ? roleLabel(db, u) : p.role}</p>
                  <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-muted">{p.blurb}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[14.5px] font-medium">
                    Enter as {p.label.split(" ")[0]}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        <section className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="walk-h">
          <div>
            <p className="eyebrow text-muted">5–7 minute presentation</p>
            <h2 id="walk-h" className="display-md mt-3">The guided walkthrough</h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-muted">
              A floating guide switches identities for you and opens the right page at each step — from a saved application to an approved fellow, feedback, supervised messaging and oversight.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button arrow onClick={startWalkthrough}>
                Start walkthrough
              </Button>
              <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={() => setResetOpen(true)}>
                Reset demo data
              </Button>
            </div>
          </div>
          <ol className="grid gap-2">
            {WALKTHROUGH.map((s, i) => {
              const p = PERSONAS.find((x) => x.key === s.persona)!;
              return (
                <li key={s.id} className="flex items-start gap-4 rounded-[16px] bg-fog px-4 py-3">
                  <span className="font-display text-[24px] leading-none text-muted tabular">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium">{s.title}</span>
                    <span className="text-[13.5px] text-muted">As {p.label}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="mt-16 max-w-3xl text-[13.5px] leading-relaxed text-muted">
          This is a front-end demonstration. Role checks run in the browser to show the intended workflows; they are not production security. Data is stored only in this browser (localStorage and IndexedDB) and can be reset at any time.
        </p>
      </main>

      <DialogRoot open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent
          title="Create an applicant account"
          description="Simulated sign-up — no email is sent and no password is needed."
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setSignupOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="dark"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  await new Promise((r) => setTimeout(r, 450));
                  const r = createApplicantAccount({ name: form.name, email: form.email });
                  setBusy(false);
                  if (!r.ok) return setErr(r.error);
                  toast.success(r.value.existed ? "Welcome back — signed in." : "Account created (simulated). You're signed in.");
                  setSignupOpen(false);
                  router.push("/applicant/dashboard");
                }}
              >
                Create account
              </Button>
            </>
          }
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <Field label="Full name" htmlFor="su-name" required error={err && /name/i.test(err) ? err : undefined}>
              <Input id="su-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jordan Rivera" autoComplete="off" />
            </Field>
            <Field label="Email" htmlFor="su-email" required hint="Use a made-up address — this is a demo." error={err && /email/i.test(err) ? err : undefined}>
              <Input id="su-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.org" autoComplete="off" />
            </Field>
            {err && !/name|email/i.test(err) && <p className="text-[13.5px] text-[#b00d28]">{err}</p>}
          </form>
        </DialogContent>
      </DialogRoot>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all demo data?"
        description="Restores every seeded record and relationship and clears files added in this browser."
        confirmLabel="Reset demo"
        onConfirm={async () => {
          await resetDemo();
          toast.success("Demo data reset to the original seed.");
        }}
      />
      <DemoControl />
    </div>
  );
}
