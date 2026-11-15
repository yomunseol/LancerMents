"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PAYMENT_NOTE } from "@/lib/site-content";

const NAV_LABEL = "Help, policies, and contact";
const ALSO_BUILDING = "Also building";
const SUPPORT_EMAIL = "support@lancerments.online";

export default function SiteFooter() {
  const t = useTranslations();
  const linkClass =
    "text-[#151115]/70 transition-colors duration-200 hover:text-[#85587D] dark:text-[#F8F4F7]/70 dark:hover:text-[#D8A8D3]";

  return (
    <footer className="border-t border-[#E2D8E0] py-10 dark:border-[#4A2E46]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
              LancerMents
            </p>
            <p className="mt-2 text-xs leading-5 text-[#151115]/70 dark:text-[#F8F4F7]/70">
              {t("billing_after_beta")}
            </p>
          </div>

          <nav aria-label={NAV_LABEL} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/docs" className={linkClass}>
              {t("docs")}
            </Link>
            <Link href="/docs#security" className={linkClass}>
              {t("security")}
            </Link>
            <Link href="/docs#privacy" className={linkClass}>
              {t("footer_privacy")}
            </Link>
            <Link href="/docs#terms" className={linkClass}>
              {t("footer_terms")}
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
              {SUPPORT_EMAIL}
            </a>
          </nav>
        </div>

        <p className="text-xs leading-5 text-[#151115]/60 dark:text-[#F8F4F7]/60">
          {PAYMENT_NOTE}
        </p>

        <p className="text-xs text-[#151115]/60 dark:text-[#F8F4F7]/60">
          2026{" "}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
          >
            Yomunseol
          </a>{" "}
          <span aria-hidden="true">•</span> {ALSO_BUILDING}{" "}
          <a
            href="https://caremunicate.online"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
          >
            Caremunicate
          </a>
        </p>
      </div>
    </footer>
  );
}
