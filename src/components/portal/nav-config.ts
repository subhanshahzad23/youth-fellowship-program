import {
  BookOpen,
  ClipboardCheck,
  FileStack,
  FileText,
  GraduationCap,
  HeartHandshake,
  History,
  Inbox,
  LayoutDashboard,
  Library,
  Megaphone,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Database, ID } from "@/lib/domain/types";
import type { Portal } from "@/lib/domain/permissions";
import { isInstructor, isMentor } from "@/lib/domain/permissions";
import { applicationsInScope, submissionsForInstructor, totalUnread } from "@/lib/domain/selectors";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** also active for these path prefixes */
  match?: string[];
}

export const PORTAL_LABEL: Record<Portal, string> = {
  applicant: "Applicant",
  workspace: "Fellow workspace",
  staff: "Staff",
  admin: "Program admin",
};

export function navFor(db: Database, portal: Portal, userId: ID): NavItem[] {
  switch (portal) {
    case "applicant":
      return [
        { href: "/applicant/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/applicant/applications", label: "Applications", icon: FileText },
        { href: "/applicant/settings", label: "Settings", icon: Settings },
      ];
    case "workspace": {
      const changes = Object.values(db.submissions).filter((s) => s.fellowId === userId && s.status === "changes_requested").length;
      return [
        { href: "/workspace/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/workspace/learning", label: "Learning", icon: BookOpen },
        { href: "/workspace/assignments", label: "Assignments", icon: ClipboardCheck, badge: changes || undefined },
        { href: "/workspace/messages", label: "Messages", icon: MessagesSquare, badge: totalUnread(db, userId) || undefined },
        { href: "/workspace/cohort", label: "My cohort", icon: Users },
        { href: "/workspace/mentorship", label: "Mentorship", icon: HeartHandshake },
        { href: "/workspace/announcements", label: "Announcements", icon: Megaphone },
        { href: "/workspace/settings", label: "Settings", icon: Settings },
      ];
    }
    case "staff": {
      const items: NavItem[] = [{ href: "/staff/dashboard", label: "Overview", icon: LayoutDashboard }];
      if (isInstructor(db, userId)) {
        const pending = submissionsForInstructor(db, userId).filter((s) => s.status === "submitted").length;
        items.push({ href: "/staff/content", label: "Content", icon: Library });
        items.push({ href: "/staff/submissions", label: "Submissions", icon: ClipboardCheck, badge: pending || undefined });
      }
      if (isMentor(db, userId)) items.push({ href: "/staff/mentees", label: "Mentees", icon: HeartHandshake });
      items.push({ href: "/staff/messages", label: "Messages", icon: MessagesSquare, badge: totalUnread(db, userId) || undefined });
      items.push({ href: "/staff/announcements", label: "Announcements", icon: Megaphone });
      items.push({ href: "/staff/settings", label: "Settings", icon: Settings });
      return items;
    }
    case "admin": {
      const mine = applicationsInScope(db, userId).filter(
        (a) =>
          ["submitted", "in_review"].includes(a.status) &&
          Object.values(db.reviewerAssignments).some((r) => r.applicationId === a.id && r.reviewerId === userId) &&
          !Object.values(db.reviews).some((rv) => rv.applicationId === a.id && rv.reviewerId === userId && rv.status === "submitted"),
      ).length;
      const scope = new Set(
        Object.values(db.cohorts)
          .map((c) => c.id)
          .filter((id) => {
            const u = db.users[userId];
            return u?.staffRoles.includes("executive_admin") || Object.values(db.memberships).some((m) => m.userId === userId && m.role === "program_admin" && m.status === "active" && m.cohortId === id);
          }),
      );
      const openReports = Object.values(db.reports).filter((r) => r.status !== "resolved" && scope.has(r.cohortId)).length;
      return [
        { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/applications", label: "Applications", icon: Inbox, badge: mine || undefined },
        { href: "/admin/forms", label: "Forms", icon: FileStack },
        { href: "/admin/cohorts", label: "Cohorts", icon: UsersRound },
        { href: "/admin/people", label: "People", icon: Users },
        { href: "/admin/curriculum", label: "Curriculum", icon: GraduationCap },
        { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
        { href: "/admin/messages", label: "Messages", icon: MessagesSquare, badge: totalUnread(db, userId) || undefined },
        { href: "/admin/safeguarding", label: "Safeguarding", icon: ShieldCheck, badge: openReports || undefined },
        { href: "/admin/audit", label: "Audit log", icon: History },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ];
    }
  }
}
