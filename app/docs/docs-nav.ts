export const CATEGORY_ORDER = [
  "getting-started",
  "daily-work",
  "clients-pipeline",
  "money-data",
  "help-beta",
] as const;

export type Category = (typeof CATEGORY_ORDER)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  "getting-started": "Getting started",
  "daily-work": "Daily work",
  "clients-pipeline": "Clients & Pipeline",
  "money-data": "Money & Data",
  "help-beta": "Help & Beta FAQ",
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "getting-started": "Create your account, switch workspaces, and learn the dashboard.",
  "daily-work": "Tasks, notes, and the calendar you use every day.",
  "clients-pipeline": "Keep client details and move leads through your pipeline.",
  "money-data": "Invoices, revenue checks, and the built-in spreadsheet.",
  "help-beta": "What is free in beta, plus how to reach support.",
};

export const CATEGORY_ICON_PATHS: Record<string, string> = {
  "getting-started": "M4 12l8-8 8 8M12 4v16",
  "daily-work": "M4 7l2 2 4-4M14 8h6M4 17l2 2 4-4M14 18h6",
  "clients-pipeline": "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M5 20a7 7 0 0 1 14 0",
  "money-data": "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3",
  "help-beta": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7M12 17h.01",
};

export const HELP_MAP: Record<string, string> = {
  tasks: "daily-work",
  notes: "daily-work",
  calendar: "daily-work",
  dashboard: "getting-started",
  clients: "clients-pipeline",
  crm: "clients-pipeline",
  invoices: "money-data",
  analytics: "money-data",
  spreadsheet: "money-data",
  security: "getting-started",
  settings: "getting-started",
  profile: "getting-started",
  docs: "help-beta",
};
