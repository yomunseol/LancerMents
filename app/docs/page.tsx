import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listDocs } from "./lib/loader";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, CATEGORY_ORDER } from "./docs-nav";

export const metadata: Metadata = {
  title: "LancerMents Docs",
  description: "Guides for the LancerMents workspace: setup, the daily grid, money, and help.",
  openGraph: {
    title: "LancerMents Docs",
    description: "Guides for the LancerMents workspace.",
  },
};

export default async function DocsIndexPage() {
  const t = await getTranslations();
  const docs = listDocs();
  const categories = CATEGORY_ORDER.filter((category) =>
    docs.some((doc) => doc.category === category),
  );

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight text-[#151115] dark:text-[#F8F4F7]">
        {t("docs_title")}
      </h1>
      <p className="mt-3 text-base leading-7 text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {t("docs_sub")}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const pages = docs.filter((doc) => doc.category === category);
          const first = pages[0];
          return (
            <Link
              key={category}
              href={`/docs/${first.slug}`}
              className="rounded-2xl border border-[#E2D8E0] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:hover:border-[#D8A8D3]"
            >
              <h2 className="text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
                {pages.length} {pages.length === 1 ? "page" : "pages"}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#151115]/70 dark:text-[#F8F4F7]/70">
                {CATEGORY_DESCRIPTIONS[category] ?? ""}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
