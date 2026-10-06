"use client";

import { useTranslations } from "next-intl";
import TierGate from "@/app/components/TierGate";
import { useWorkspaceGate } from "../useWorkspaceData";

export default function InvoicesPage() {
  const t = useTranslations();
  const ws = useWorkspaceGate();

  if (!ws?.id) return <div className="h-40 animate-pulse rounded-2xl bg-[#E2D8E0] dark:bg-[#4A2E46]" />; // WS-GATE

  return (
    <TierGate requiredTier="pipeline" featureKey="invoices">
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        {t("invoices")}
      </h1>
    </TierGate>
  );
}
