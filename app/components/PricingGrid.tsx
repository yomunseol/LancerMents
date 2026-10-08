"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PLAN_TIERS } from "@/lib/plans";
import PlanCard from "./PlanCard";

export default function PricingGrid() {
  const t = useTranslations();
  const [annual, setAnnual] = useState(false);

  const option = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-[#85587D] text-white dark:bg-[#D8A8D3] dark:text-[#151115]"
        : "text-[#151115]/70 hover:text-[#85587D] dark:text-[#F8F4F7]/70 dark:hover:text-[#D8A8D3]"
    }`;

  return (
    <section id="pricing" className="border-t border-[#E2D8E0] py-24 dark:border-[#4A2E46]">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-[#E2D8E0] p-1 dark:border-[#4A2E46]">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={option(!annual)}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={option(annual)}
          >
            {t("annual_save")}
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_TIERS.map((plan) => (
          <PlanCard key={plan.slug} plan={plan} annual={annual} />
        ))}
      </div>

      <p className="mt-8 text-center text-xs opacity-60">
        {t("billing_after_beta")}
      </p>
    </section>
  );
}
