"use client";

import Link from "next/link";

export default function UpgradePanel({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-[#85587D] bg-white p-8 dark:border-[#D8A8D3] dark:bg-[#221C21]">
      <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        {title}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        This part of the workspace is included in a higher plan. Everything is
        free during Beta — pick a plan to unlock it.
      </p>
      <Link
        href="/onboarding"
        className="mt-6 inline-block rounded-lg bg-[#85587D] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
      >
        Choose a plan
      </Link>
    </section>
  );
}
