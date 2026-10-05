"use client";

import { useTranslations } from "next-intl";
import TasksBoard from "../TasksBoard";

export default function TasksPage() {
  const t = useTranslations();

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        {t("tasks")}
      </h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {t("tasks_sub")}
      </p>
      <TasksBoard />
    </>
  );
}
