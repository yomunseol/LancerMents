"use client";

import Link from "next/link";
import TasksBoard from "./TasksBoard";
import { useWorkspace } from "./WorkspaceContext";

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspace();

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {activeWorkspace?.name ?? "No workspace selected"}
      </p>

      <TasksBoard />

      <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#85587D] bg-white p-6 sm:flex-row sm:items-center sm:justify-between dark:border-[#D8A8D3] dark:bg-[#221C21]">
        <div>
          <h2 className="text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]">
            Upgrade Plan
          </h2>
          <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Unlock unlimited tasks and CRM. All plans are free during Beta.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="w-full rounded-lg bg-[#85587D] px-6 py-2.5 text-center text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 sm:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
        >
          Upgrade Plan
        </Link>
      </section>
    </>
  );
}
