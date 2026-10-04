"use client";

import TasksBoard from "../TasksBoard";

export default function TasksPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        Tasks
      </h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        Everything on your daily grid, in one place.
      </p>
      <TasksBoard />
    </>
  );
}
