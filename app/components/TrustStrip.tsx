"use client";

import { useTranslations } from "next-intl";

const STRIP_LABEL = "Trust and security";

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export default function TrustStrip() {
  const t = useTranslations();
  const items = [
    { icon: <LockIcon />, label: t("trust_tls") },
    { icon: <CardIcon />, label: t("trust_stripe") },
    { icon: <SparkIcon />, label: t("plan_sub") },
    { icon: <UserIcon />, label: t("trust_founder") },
  ];

  return (
    <section
      aria-label={STRIP_LABEL}
      className="mt-16 grid grid-cols-1 gap-3 rounded-2xl border border-[#E2D8E0] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-[#4A2E46] dark:bg-[#221C21]"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-xl border border-[#E2D8E0] px-3 py-3 dark:border-[#4A2E46]"
        >
          <span className="mt-0.5 text-[#85587D] dark:text-[#D8A8D3]">{item.icon}</span>
          <p className="text-xs leading-5 text-[#151115]/80 dark:text-[#F8F4F7]/80">
            {item.label}
          </p>
        </div>
      ))}
    </section>
  );
}
