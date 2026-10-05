"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "../WorkspaceContext";

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

function dayOf(due: string | null): string | null {
  return due ? String(due).slice(0, 10) : null;
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

export default function CalendarPage() {
  const t = useTranslations();
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const workspaceId = activeWorkspace?.id ?? "";

  const load = useCallback(async (id: string) => {
    setError(null);
    try {
      const { data, error: loadError } = await supabase
        .from("tasks")
        .select("id,title,due_date,is_completed")
        .eq("workspace_id", id)
        .order("due_date", { ascending: true });

      if (loadError) throw loadError;
      setTasks((data ?? []) as Task[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tasks.");
    }
  }, []);

  useEffect(() => {
    if (workspaceLoading) return;
    if (!workspaceId) {
      setTasks([]);
      return;
    }
    load(workspaceId);
  }, [workspaceId, workspaceLoading, load]);

  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const start = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < start; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(toIso(cursor.year, cursor.month, day));
    }
    return cells;
  }, [cursor]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task) => {
      const day = dayOf(task.due_date);
      if (day) map.set(day, (map.get(day) ?? 0) + 1);
    });
    return map;
  }, [tasks]);

  const today = todayIso();
  const dayTasks = selected
    ? tasks.filter((task) => dayOf(task.due_date) === selected)
    : [];

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        {t("calendar")}
      </h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {t("cal_sub")}
      </p>

      <section className="mt-8 rounded-2xl border border-[#E2D8E0] bg-white p-6 dark:border-[#4A2E46] dark:bg-[#221C21]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() =>
              setCursor((current) =>
                current.month === 0
                  ? { year: current.year - 1, month: 11 }
                  : { ...current, month: current.month - 1 },
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#151115] transition-all duration-200 hover:bg-[#85587D]/10 dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10"
          >
            <Chevron dir="left" />
          </button>
          <span className="text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
            {MONTHS[cursor.month]} {cursor.year}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              setCursor((current) =>
                current.month === 11
                  ? { year: current.year + 1, month: 0 }
                  : { ...current, month: current.month + 1 },
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#151115] transition-all duration-200 hover:bg-[#85587D]/10 dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10"
          >
            <Chevron dir="right" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <span
              key={day}
              className="flex h-8 items-center justify-center text-xs uppercase tracking-widest opacity-60"
            >
              {day}
            </span>
          ))}
          {grid.map((cell, index) => {
            if (!cell) return <span key={`empty-${index}`} className="h-12" />;
            const count = counts.get(cell) ?? 0;
            const isSelected = cell === selected;
            const isToday = cell === today;
            return (
              <button
                key={cell}
                type="button"
                onClick={() => setSelected(isSelected ? null : cell)}
                className={`flex h-12 flex-col items-center justify-center rounded-lg text-sm transition-all duration-200 ${
                  isSelected
                    ? "bg-[#85587D] font-semibold text-white dark:bg-[#D8A8D3] dark:text-[#151115]"
                    : "text-[#151115] hover:bg-[#85587D]/10 dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10"
                } ${isToday && !isSelected ? "ring-1 ring-[#85587D] dark:ring-[#D8A8D3]" : ""}`}
              >
                {Number(cell.slice(8, 10))}
                {count > 0 && (
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white dark:bg-[#151115]" : "bg-[#85587D] dark:bg-[#D8A8D3]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {selected && (
        <section className="mt-6">
          <h2 className="text-xs uppercase tracking-widest opacity-60">
            {selected}
          </h2>
          {dayTasks.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {dayTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center rounded-xl border border-[#E2D8E0] bg-white px-5 py-4 transition-all duration-200 hover:border-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:hover:border-[#D8A8D3]"
                >
                  <span
                    className={`flex-1 text-base text-[#151115] dark:text-[#F8F4F7] ${
                      task.is_completed ? "line-through opacity-60" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm opacity-50">{t("no_tasks_day")}</p>
          )}
        </section>
      )}
    </>
  );
}
