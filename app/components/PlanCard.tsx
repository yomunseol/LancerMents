"use client";

import { useTranslations } from "next-intl";
import type { PlanDef } from "@/lib/plans";

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-[#85587D] dark:text-[#D8A8D3]"
    >
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 opacity-60"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function PlanCard({
  plan,
  annual = false,
  selected = false,
  onSelect,
  current = false,
  compact = false,
}: {
  plan: PlanDef;
  annual?: boolean;
  selected?: boolean;
  onSelect?: (slug: string) => void;
  current?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations();
  const price = annual ? plan.annual : plan.monthly;
  const emphasized = plan.popular || selected;

  const classes = `relative flex w-full flex-col rounded-2xl border border-[#E2D8E0] bg-white text-left transition-all duration-200 dark:border-[#4A2E46] dark:bg-[#221C21] ${
    compact ? "p-5" : "p-6"
  } ${emphasized ? "ring-2 ring-[#85587D] dark:ring-[#D8A8D3]" : ""} ${
    plan.comingSoon ? "opacity-90" : ""
  }`;

  const content = (
    <>
      {plan.popular && (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#85587D] px-3 py-1 text-xs font-bold text-white dark:bg-[#D8A8D3] dark:text-[#151115]">
          {t("most_popular")}
        </span>
      )}
      {plan.comingSoon && (
        <span className="absolute right-4 top-4 rounded-full border border-dashed border-[#E2D8E0] px-3 py-1 text-xs opacity-70 dark:border-[#4A2E46]">
          {t("coming_soon")}
        </span>
      )}
      {current && (
        <span className="absolute left-4 top-4 rounded-full bg-[#85587D]/15 px-2 py-1 text-xs font-bold text-[#85587D] dark:bg-[#D8A8D3]/15 dark:text-[#D8A8D3]">
          {t("current_plan")}
        </span>
      )}

      <h3 className="text-lg font-bold text-[#151115] dark:text-[#F8F4F7]">
        {plan.name}
      </h3>

      <p className="mt-2 flex items-baseline gap-2">
        {annual && (
          <span className="text-sm text-[#151115]/50 line-through dark:text-[#F8F4F7]/50">
            ${plan.monthly * 12}
          </span>
        )}
        <span className="text-4xl font-extrabold text-[#151115] dark:text-[#F8F4F7]">
          ${price}
        </span>
        <span className="text-sm opacity-60">{annual ? "/yr" : "/mo"}</span>
      </p>

      <p className="mt-3 text-sm opacity-70">{t(plan.positionKey)}</p>

      <ul className="mt-5 flex flex-col gap-2 text-sm">
        {plan.features.map((key) => (
          <li
            key={key}
            className="flex items-center gap-2 text-[#151115] dark:text-[#F8F4F7]"
          >
            <CheckIcon />
            <span>{t(key)}</span>
          </li>
        ))}
        {plan.limit && (
          <li className="flex items-center gap-2 text-[#151115] dark:text-[#F8F4F7]">
            <CheckIcon />
            <span className="rounded-full border border-[#E2D8E0] px-2 py-0.5 text-xs font-semibold dark:border-[#4A2E46]">
              {plan.limit}
            </span>
          </li>
        )}
        {plan.lockedFeatures?.map((label) => (
          <li key={label} className="flex items-center gap-2 opacity-60">
            <LockIcon />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(plan.slug)}
        className={classes}
      >
        {content}
      </button>
    );
  }

  return <article className={classes}>{content}</article>;
}
