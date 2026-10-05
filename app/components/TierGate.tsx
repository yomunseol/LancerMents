"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useProfile } from "@/app/dashboard/ProfileContext";

export type GatedTier = "pipeline" | "studio";

function allows(planType: string | null | undefined, required: GatedTier): boolean {
  const plan = (planType ?? "").toLowerCase();
  if (required === "pipeline") return plan === "pipeline" || plan === "studio";
  return plan === "studio";
}

const TEASERS: Record<GatedTier, string[]> = {
  pipeline: ["Clients & CRM kanban", "Invoices with PDF export", "Revenue analytics"],
  studio: ["Advanced multi-chart analytics", "Formula spreadsheet", "Mapping & white-label"],
};

export default function TierGate({
  requiredTier,
  children,
}: {
  requiredTier: GatedTier;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const { planCanonical, loading } = useProfile();

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-[#E2D8E0] bg-[#E2D8E0]/40 dark:border-[#4A2E46] dark:bg-[#4A2E46]/30" />
    );
  }

  if (!allows(planCanonical, requiredTier)) {
    const pageKey = pathname.split("/").filter(Boolean).pop() ?? "";
    return (
      <div className="rounded-2xl border border-[#85587D] bg-gradient-to-br from-[#85587D]/10 to-transparent p-10 text-center dark:border-[#D8A8D3] dark:from-[#D8A8D3]/10">
        <h2 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
          {t(pageKey)}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#151115]/80 dark:text-[#F8F4F7]/80">
          {t("gate_body")}
        </p>
        <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left text-sm text-[#151115]/80 dark:text-[#F8F4F7]/80">
          {TEASERS[requiredTier].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span aria-hidden="true" className="text-[#85587D] dark:text-[#D8A8D3]">
                •
              </span>
              {item}
            </li>
          ))}
        </ul>
        <Link
          href={`/onboarding?edit=1&from=${encodeURIComponent(pathname)}`}
          className="mt-8 inline-block rounded-lg bg-[#85587D] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
        >
          {t("change_plan")}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
