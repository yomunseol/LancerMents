"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthState } from "./useAuthState";

const PRIMARY =
  "inline-flex items-center justify-center rounded-lg bg-[#E0BBE4] px-5 py-2.5 text-sm font-semibold text-[#151115] transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:focus:ring-[#D8A8D3]";

const GHOST =
  "inline-flex items-center justify-center rounded-lg border border-[#E2D8E0] px-5 py-2.5 text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:text-[#F8F4F7] dark:focus:ring-[#D8A8D3]";

export default function FounderCta() {
  const t = useTranslations();
  const plan = useAuthState();

  if (plan === "authed") {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className={PRIMARY}>
          {t("cta_my_workspace")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <Link href="/signup" className={PRIMARY}>
        {t("start_free_beta")}
      </Link>
      <Link href="/login" className={GHOST}>
        {t("login")}
      </Link>
    </div>
  );
}
