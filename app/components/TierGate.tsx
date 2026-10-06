"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useProfile } from "@/app/dashboard/ProfileContext";
import { planLocked, type RequiredPlan } from "@/lib/profile";

export type GatedTier = RequiredPlan;

function useRevealed(): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return shown;
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 opacity-50"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function GateCard({
  heading,
  body,
  cta,
  href,
}: {
  heading: string;
  body: string;
  cta: string;
  href: string;
}) {
  const shown = useRevealed();
  return (
    <div className="py-16">
      <div
        className={`mx-auto max-w-2xl rounded-2xl border border-[#85587D]/40 bg-gradient-to-br from-[#85587D]/10 via-transparent to-transparent p-10 transition-all duration-200 dark:border-[#D8A8D3]/40 dark:from-[#D8A8D3]/10 ${
          shown ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        }`}
      >
        <h2 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
          {heading}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 opacity-70">{body}</p>
        <Link
          href={href}
          className="mt-8 inline-block rounded-lg bg-[#85587D] px-5 py-2.5 font-semibold text-white transition hover:brightness-110 dark:bg-[#D8A8D3] dark:text-[#151115]"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function CompactGate({
  body,
  cta,
  href,
}: {
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#E2D8E0] p-3 dark:border-[#4A2E46]">
      <LockIcon />
      <span className="min-w-0 flex-1 truncate text-xs opacity-60">{body}</span>
      <Link
        href={href}
        className="shrink-0 text-xs font-semibold text-[#85587D] underline transition-colors duration-200 dark:text-[#D8A8D3]"
      >
        {cta}
      </Link>
    </div>
  );
}

function Unlocked({ children }: { children: React.ReactNode }) {
  const shown = useRevealed();
  return (
    <div
      className={`transition-all duration-200 ${
        shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

export default function TierGate({
  requiredTier,
  featureKey,
  compact = false,
  children,
}: {
  requiredTier: GatedTier;
  featureKey: string;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const { planCanonical, profile, loading, refreshProfile } = useProfile();

  // Self-fetch fallback: context resolved but holds no profile yet.
  useEffect(() => {
    if (!loading && profile === null) {
      void refreshProfile();
    }
  }, [loading, profile, refreshProfile]);

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-[#E2D8E0] bg-[#E2D8E0]/40 dark:border-[#4A2E46] dark:bg-[#4A2E46]/30" />
    );
  }

  if (!planLocked(planCanonical, requiredTier)) {
    return <Unlocked>{children}</Unlocked>;
  }

  const href = `/onboarding?edit=1&from=${encodeURIComponent(pathname)}`;

  if (compact) {
    return <CompactGate body={t("gate_body")} cta={t("change_plan")} href={href} />;
  }

  return (
    <GateCard
      heading={t(featureKey)}
      body={t("gate_body")}
      cta={t("change_plan")}
      href={href}
    />
  );
}
