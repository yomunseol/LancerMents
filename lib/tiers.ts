export type Tier = "basic" | "plus" | "pro";

export interface TierLimits {
  maxWorkspaces: number;
  maxTasks: number;
  crm: boolean;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  basic: { maxWorkspaces: 1, maxTasks: 5, crm: false },
  plus: { maxWorkspaces: UNLIMITED, maxTasks: UNLIMITED, crm: true },
  pro: { maxWorkspaces: UNLIMITED, maxTasks: UNLIMITED, crm: true },
};

export const UPGRADE_MESSAGE =
  "Upgrade to The Pipeline ($19/mo) to unlock unlimited tasks and CRM.";

export function normalizeTier(value: string | null | undefined): Tier {
  switch ((value ?? "").trim().toLowerCase()) {
    case "plus":
      return "plus";
    case "pro":
      return "pro";
    default:
      return "basic";
  }
}

export function limitsForTier(tier: Tier): TierLimits {
  return TIER_LIMITS[tier];
}

export function tierLabel(tier: Tier): string {
  if (tier === "plus") return "Plus";
  if (tier === "pro") return "Pro";
  return "Basic";
}
