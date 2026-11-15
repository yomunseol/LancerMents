import type { CanonicalPlan } from "@/lib/profile";

export type PlanDef = {
  slug: CanonicalPlan;
  /** Proper noun — never translated. */
  name: string;
  monthly: number;
  annual: number;
  /** i18n key for the positioning line. */
  positionKey: string;
  /** i18n feature keys, rendered as check bullets. */
  features: string[];
  popular?: boolean;
  comingSoon?: boolean;
  /** Plain-text locked rows (proper-noun exception). */
  lockedFeatures?: string[];
};

export const PLAN_TIERS: PlanDef[] = [
  {
    slug: "engine",
    name: "Starter",
    monthly: 9,
    annual: 90,
    positionKey: "pos_starter",
    features: ["feat_task_grid", "feat_calendar", "feat_clients"],
  },
  {
    slug: "pipeline",
    name: "Pro",
    monthly: 19,
    annual: 190,
    positionKey: "pos_pro",
    features: [
      "feat_task_grid",
      "feat_calendar",
      "feat_clients",
      "feat_deals",
      "feat_invoices",
    ],
    popular: true,
  },
  {
    slug: "studio",
    name: "Expert",
    monthly: 49,
    annual: 490,
    positionKey: "pos_expert",
    features: [
      "feat_task_grid",
      "feat_calendar",
      "feat_clients",
      "feat_deals",
      "feat_invoices",
      "feat_analytics",
      "feat_spreadsheet",
    ],
  },
  {
    slug: "business",
    name: "Business",
    monthly: 99,
    annual: 990,
    positionKey: "pos_business",
    features: [
      "feat_task_grid",
      "feat_calendar",
      "feat_clients",
      "feat_deals",
      "feat_invoices",
      "feat_analytics",
      "feat_spreadsheet",
    ],
    comingSoon: true,
    lockedFeatures: ["Multi-seat", "White-label"],
  },
];
