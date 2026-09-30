"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ChevronRight, ExternalLink, LogOut, Menu as MenuIcon, Settings, ShieldCheck, UserRound, X } from "lucide-react";
import type { Portal } from "@/lib/domain/permissions";
import { adminCohortIds, canAccessPortal, homeFor, roleLabel } from "@/lib/domain/permissions";
import { setPersona, useDb, useHydrated, useMe, usePersonaId } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar, Skeleton } from "@/components/ui/display";
import { ButtonLink, Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger, Sheet } from "@/components/ui/overlay";
import { DemoControl } from "@/components/demo/demo-control";
import { PERSONAS } from "@/lib/seed/people";
import { CrumbProvider, useCrumbLabel } from "./crumbs";
import { navFor, PORTAL_LABEL, type NavItem } from "./nav-config";
import { NotificationsButton } from "./notifications";
import { GlobalSearch } from "./search";

function isActive(pathname: string, item: NavItem) {
  return pathname === item.href || pathname.startsWith(item.href + "/") || (item.match ?? []).some((m) => pathname.startsWith(m));
}

function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Portal" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14.5px] transition-colors",
              active ? "bg-fog font-medium text-void" : "text-[#3d3d3d] hover:bg-fog/70 hover:text-void",
            )}
          >
            {active && <motion.span layoutId="nav-active" className="absolute left-0 top-2 h-6 w-[3px] rounded-full bg-jade" transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }} />}
            <Icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-void px-1.5 text-[11px] font-semibold text-paper tabular">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Breadcrumbs({ portal, items }: { portal: Portal; items: NavItem[] }) {
  const pathname = usePathname();
  const label = useCrumbLabel();
  const section = items.find((i) => isActive(pathname, i));
  const deeper = section && pathname !== section.href;
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[14px] text-muted sm:flex">
      <span className="shrink-0">{PORTAL_LABEL[portal]}</span>
      {section && (
        <>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          {deeper ? (
            <Link href={section.href} className="shrink-0 hover:text-void hover:underline">
              {section.label}
            </Link>
          ) : (
            <span className="font-medium text-void" aria-current="page">
              {section.label}
            </span>
          )}
        </>
      )}
      {deeper && label && (
        <>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate font-medium text-void" aria-current="page">
            {label}
          </span>
        </>
      )}
    </nav>
  );
}

function ProfileMenu({ portal }: { portal: Portal }) {
  const db = useDb();
  const me = useMe();
  const router = useRouter();
  if (!me) return null;
  return (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" className="flex h-10 items-center gap-2 rounded-[10px] pl-1 pr-2 hover:bg-paper" aria-label={`Account menu for ${me.name}`}>
          <Avatar name={me.name} hue={me.avatarHue} size={32} />
          <span className="hidden text-left leading-tight lg:block">
            <span className="block max-w-[140px] truncate text-[13.5px] font-medium">{me.name}</span>
            <span className="block max-w-[140px] truncate text-[12px] text-muted">{roleLabel(db, me)}</span>
          </span>
        </button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>Signed in (simulated)</MenuLabel>
        <div className="px-3 pb-2">
          <p className="text-[14.5px] font-medium">{me.name}</p>
          <p className="text-[13px] text-muted">{me.email}</p>
        </div>
        <MenuSeparator />
        <MenuItem icon={<Settings className="size-4" />} onSelect={() => router.push(`/${portal}/settings`)}>
          Settings
        </MenuItem>
        <MenuItem icon={<UserRound className="size-4" />} onSelect={() => router.push("/demo")}>
          Switch demo identity
        </MenuItem>
        <MenuItem icon={<ExternalLink className="size-4" />} onSelect={() => router.push("/")}>
          Public website
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          icon={<LogOut className="size-4" />}
          onSelect={() => {
            setPersona(null);
            router.push("/demo");
          }}
        >
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function CohortContext() {
  const db = useDb();
  const me = usePersonaId();
  const { adminCohortFilter, setAdminCohortFilter } = useUI();
  const scope = adminCohortIds(db, me);
  const value = adminCohortFilter === "all" || scope.includes(adminCohortFilter) ? adminCohortFilter : "all";
  return (
    <label className="hidden items-center gap-2 xl:flex">
      <span className="text-[13px] text-muted">Cohort</span>
      <select
        value={value}
        onChange={(e) => setAdminCohortFilter(e.target.value)}
        className="h-10 rounded-[10px] bg-paper px-3 text-[14px] ring-1 ring-line focus:outline-2 focus:outline-void"
        aria-label="Cohort context"
      >
        <option value="all">All in my scope ({scope.length})</option>
        {scope.map((id) => (
          <option key={id} value={id}>
            {db.cohorts[id]?.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Loading shell shown while persisted state hydrates (bounded; no flashes of wrong data). */
function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh bg-fog" aria-busy="true" aria-label="Loading your workspace">
      <div className="hidden w-[248px] shrink-0 flex-col gap-3 bg-paper p-5 lg:flex">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 lg:p-10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-10 w-72" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="mt-4 h-64" />
      </div>
    </div>
  );
}

function IdentityGate({ portal }: { portal: Portal }) {
  const router = useRouter();
  const suggestions = PERSONAS.filter((p) =>
    portal === "admin" ? ["amira", "priya"].includes(p.key) : portal === "staff" ? ["elena", "daniel"].includes(p.key) : portal === "workspace" ? p.key === "noah" : p.key === "maya",
  );
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-fog px-4 py-16">
      <div className="w-full max-w-lg rounded-[24px] bg-paper p-8 text-center">
        <Logo className="justify-center" />
        <h1 className="mt-8 font-display text-[34px] leading-tight tracking-[-0.03em]">Choose who you are for this demo</h1>
        <p className="mt-2 text-[15px] text-muted">There are no passwords here — sign-in is simulated with fictional identities.</p>
        <div className="mt-6 flex flex-col gap-2">
          {suggestions.map((p) => (
            <Button
              key={p.key}
              variant="outline"
              size="lg"
              className="justify-start"
              onClick={() => {
                setPersona(p.userId);
                router.refresh();
              }}
            >
              Continue as {p.label} · {p.role}
            </Button>
          ))}
          <ButtonLink href="/demo" variant="ghost" size="lg">
            See every demo identity
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

export function AccessDenied({ reason, homeHref }: { reason: string; homeHref: string }) {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-fog px-4 py-16">
      <div className="w-full max-w-lg rounded-[24px] bg-paper p-8">
        <span className="grid size-12 place-items-center rounded-full bg-fog">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-[32px] leading-tight tracking-[-0.03em]">This area isn&apos;t part of your role</h1>
        <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{reason}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <ButtonLink href={homeHref} arrow>
            Go to your home
          </ButtonLink>
          <ButtonLink href="/demo" variant="outline">
            Switch demo identity
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

export function PortalShell({ portal, children }: { portal: Portal; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const db = useDb();
  const me = useMe();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useMemo(() => (me ? navFor(db, portal, me.id) : []), [db, portal, me]);

  if (!hydrated) return <ShellSkeleton />;
  if (!me) return <IdentityGate portal={portal} />;
  const access = canAccessPortal(db, me.id, portal);
  if (!access.ok)
    return (
      <>
        <AccessDenied reason={access.reason} homeHref={homeFor(db, me.id)} />
        <DemoControl />
      </>
    );

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href={items[0]?.href ?? "/"} onClick={onNavigate} aria-label="Launchpad Fellowship — portal home">
          <Logo />
        </Link>
      </div>
      <div className="px-5 pb-3">
        <p className="eyebrow text-muted">{PORTAL_LABEL[portal]}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        <SidebarNav items={items} onNavigate={onNavigate} />
      </div>
      <div className="border-t border-line p-4">
        <Link href="/" className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-[13.5px] text-muted hover:bg-fog hover:text-void">
          <ArrowLeft className="size-4" aria-hidden /> Public website
        </Link>
      </div>
    </div>
  );

  return (
    <CrumbProvider>
      <div className="flex min-h-dvh bg-fog">
        <aside className="hidden w-[248px] shrink-0 border-r border-line bg-paper lg:block">
          <div className="sticky top-0 h-dvh">{sidebar()}</div>
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen} title="Navigation">
          <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-[8px] hover:bg-fog" aria-label="Close navigation">
            <X className="size-5" />
          </button>
          {sidebar(() => setMobileOpen(false))}
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-line/70 bg-fog/90 backdrop-blur supports-[backdrop-filter]:bg-fog/75">
            <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
              <button type="button" onClick={() => setMobileOpen(true)} className="grid size-10 place-items-center rounded-[10px] hover:bg-paper lg:hidden" aria-label="Open navigation">
                <MenuIcon className="size-5" />
              </button>
              <Link href={items[0]?.href ?? "/"} className="lg:hidden" aria-label="Portal home">
                <Logo compact />
              </Link>
              <Breadcrumbs portal={portal} items={items} />
              <div className="flex-1" />
              {portal === "admin" && <CohortContext />}
              <GlobalSearch portal={portal} />
              <NotificationsButton />
              <ProfileMenu portal={portal} />
            </div>
          </header>
          <motion.main
            id="main"
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pt-10"
          >
            {children}
          </motion.main>
        </div>
      </div>
      <DemoControl />
    </CrumbProvider>
  );
}
