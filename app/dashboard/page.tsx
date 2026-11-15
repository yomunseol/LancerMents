"use client";

import { useTranslations } from "next-intl";
import TasksBoard from "./TasksBoard";
import { useWorkspace } from "./WorkspaceContext";

export default function DashboardPage() {
  const t = useTranslations();
  const { activeWorkspace } = useWorkspace();

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        {t("welcome")}
      </h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {activeWorkspace?.name ?? t("noWorkspace")}
      </p>

      <TasksBoard />
    </>
  );
}
