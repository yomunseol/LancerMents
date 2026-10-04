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
  | "security"
  | "settings";

export type NavTier = "pipeline" | "studio";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  tier?: NavTier;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Tasks", href: "/dashboard/tasks", icon: "tasks" },
  { label: "Notes", href: "/dashboard/notes", icon: "notes" },
  { label: "Calendar", href: "/dashboard/calendar", icon: "calendar" },
  { label: "Clients", href: "/dashboard/clients", icon: "clients", tier: "pipeline" },
  { label: "CRM", href: "/dashboard/crm", icon: "crm", tier: "pipeline" },
  { label: "Invoices", href: "/dashboard/invoices", icon: "invoices", tier: "pipeline" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "analytics", tier: "pipeline" },
  { label: "Spreadsheet", href: "/dashboard/spreadsheet", icon: "spreadsheet", tier: "studio" },
  { label: "Security", href: "/dashboard/security", icon: "security" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

const TIER_RANK: Record<string, number> = { basic: 0, plus: 1, pro: 2 };
const TIER_REQUIRED: Record<NavTier, number> = { pipeline: 1, studio: 2 };

export function isNavLocked(item: NavItem, tier: string): boolean {
  if (!item.tier) return false;
  return (TIER_RANK[tier] ?? 0) < TIER_REQUIRED[item.tier];
}
