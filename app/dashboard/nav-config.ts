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
  { key: "security", href: "/dashboard/security", icon: "security" },
  { key: "settings", href: "/dashboard/settings", icon: "settings" },
];

const TIER_RANK: Record<string, number> = { basic: 0, plus: 1, pro: 2 };
const TIER_REQUIRED: Record<NavTier, number> = { pipeline: 1, studio: 2 };

export function isNavLocked(item: NavItem, tier: string): boolean {
  if (!item.tier) return false;
  return (TIER_RANK[tier] ?? 0) < TIER_REQUIRED[item.tier];
}
