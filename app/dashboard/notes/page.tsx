"use client";

import { useTranslations } from "next-intl";

export default function NotesPage() {
  const t = useTranslations();

  return (
    <section className="rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
      <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        {t("notes")}
      </h1>
      <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {t("empty_notes")}
      </p>
    </section>
  );
}
