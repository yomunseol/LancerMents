export const CATEGORY_ORDER = [
  "getting-started",
  "daily-ops",
  "money",
  "insights",
  "account",
  "help",
] as const;

export type Category = (typeof CATEGORY_ORDER)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  "getting-started": "Getting started",
  "daily-ops": "Daily ops",
  money: "Money",
  insights: "Insights",
  account: "Account",
  help: "Help",
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "getting-started": "Create your account and get through the wizard.",
  "daily-ops": "The grid, notes, and the rhythm of a working day.",
  money: "Clients, deals, and invoices end to end.",
  insights: "Analytics, spreadsheets, and the numbers behind the work.",
  account: "Security, preferences, and your profile.",
  help: "Questions we get asked most.",
};

export const HELP_MAP: Record<string, string> = {
  tasks: "daily-ops",
  notes: "daily-ops",
  calendar: "daily-ops",
  dashboard: "daily-ops",
  clients: "money",
  crm: "money",
  invoices: "money",
  analytics: "insights",
  spreadsheet: "insights",
  security: "account",
  settings: "account",
  profile: "account",
};
