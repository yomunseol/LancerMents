import { planLocked, type CanonicalPlan } from "@/lib/profile";

export type NavIcon =
  | "dashboard"
  | "tasks"
  | "notes"
  | "calendar"
  | "clients"
  | "crm"
  | "invoices"
  | "analytics"
  | "spreadsheet"
  | "profile"
  | "security"
  | "settings";

export type NavTier = "pipeline" | "studio";

export type NavItem = {
  key: NavIcon;
  href: string;
  icon: NavIcon;
  tier?: NavTier;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: "dashboard" },
  { key: "tasks", href: "/dashboard/tasks", icon: "tasks" },
  { key: "notes", href: "/dashboard/notes", icon: "notes" },
  { key: "calendar", href: "/dashboard/calendar", icon: "calendar" },
  { key: "clients", href: "/dashboard/clients", icon: "clients", tier: "pipeline" },
  { key: "crm", href: "/dashboard/crm", icon: "crm", tier: "pipeline" },
  { key: "invoices", href: "/dashboard/invoices", icon: "invoices", tier: "pipeline" },
  { key: "analytics", href: "/dashboard/analytics", icon: "analytics", tier: "pipeline" },
  { key: "spreadsheet", href: "/dashboard/spreadsheet", icon: "spreadsheet", tier: "studio" },
  { key: "profile", href: "/dashboard/profile", icon: "profile" },
  { key: "security", href: "/dashboard/security", icon: "security" },
  { key: "settings", href: "/dashboard/settings", icon: "settings" },
];

export function isNavLocked(item: NavItem, plan: CanonicalPlan | null): boolean {
  if (!item.tier) return false;
  return planLocked(plan, item.tier);
}
