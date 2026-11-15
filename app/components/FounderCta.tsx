"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthState } from "./useAuthState";

const PRIMARY =
  "inline-flex items-center justify-center rounded-lg bg-[#E0BBE4] px-5 py-2.5 text-sm font-semibold text-[#151115] transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:focus:ring-[#D8A8D3]";

const GHOST =
  "inline-flex items-center justify-center rounded-lg px-1 py-2.5 text-sm font-semibold text-[#151115]/80 underline-offset-4 transition-colors duration-200 hover:text-[#85587D] hover:underline focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:text-[#F8F4F7]/80 dark:hover:text-[#D8A8D3] dark:focus:ring-[#D8A8D3]";

export default function FounderCta() {
  const t = useTranslations();
  const plan = useAuthState();

  if (plan === "authed") {
    return (
      <div className="mt-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link href="/dashboard" className={PRIMARY}>
            {t("cta_my_workspace")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Link href="/signup" className={PRIMARY}>
          {t("cta_try_free")}
        </Link>
        <Link href="/login" className={GHOST}>
          {t("cta_login_your_account")}
        </Link>
      </div>
      <p className="mt-3 text-xs text-[#151115]/60 dark:text-[#F8F4F7]/60">
        {t("cta_no_card_beta")}
      </p>
    </div>
  );
}
