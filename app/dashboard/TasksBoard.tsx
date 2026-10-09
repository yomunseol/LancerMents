"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { TIER_LIMITS } from "@/lib/tiers";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";
import DatePicker from "@/app/components/DatePicker";
import { useWorkspaceGate } from "./useWorkspaceData";

export type Task = {
  id: string;
  workspace_id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  is_completed: boolean;
};

const TASK_LIMIT = TIER_LIMITS.basic.maxTasks;
const TASK_COLUMNS = "id,workspace_id,title,due_date,created_at,is_completed";

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function dueDay(due: string | null): string | null {
  return due ? String(due).slice(0, 10) : null;
}

function formatDue(due: string | null): string {
  const day = dueDay(due);
  if (!day) return "";
  if (day === todayIso()) return "Today";
  const parsed = new Date(`${day}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const completed = task.is_completed;
  return (
    <li className="group flex items-center rounded-xl border border-[#E2D8E0] bg-white px-5 py-4 transition-all duration-200 hover:-translate-y-px hover:border-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:hover:border-[#D8A8D3]">
      <input
        id={`task-${task.id}`}
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(task)}
        className="mr-4 h-5 w-5 shrink-0 accent-[#85587D] focus:ring-2 focus:ring-[#85587D] dark:accent-[#D8A8D3] dark:focus:ring-[#D8A8D3]"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={`flex-1 text-base leading-relaxed text-[#151115] dark:text-[#F8F4F7] ${
          completed ? "line-through opacity-60" : ""
        }`}
      >
        {task.title}
      </label>
      {task.due_date && (
        <span className="ml-3 whitespace-nowrap rounded-full border border-[#E2D8E0] px-2.5 py-1 text-xs opacity-70 dark:border-[#4A2E46]">
          {formatDue(task.due_date)}
        </span>
      )}
      <button
        type="button"
        onClick={() => onDelete(task)}
        aria-label={`Delete ${task.title}`}
        className="ml-3 shrink-0 text-[#151115]/60 opacity-0 transition-all duration-200 hover:text-red-400 focus:opacity-100 group-hover:opacity-100 dark:text-[#F8F4F7]/60"
      >
        <XIcon />
      </button>
    </li>
  );
}

export default function TasksBoard() {
  const t = useTranslations();
  const ws = useWorkspaceGate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const workspaceId = ws?.id ?? "";

  const loadTasks = useCallback(
    async (activeWorkspaceId: string) => {
      setFb(null);
      try {
        const { data, error: loadError } = await supabase
          .from("tasks")
          .select(TASK_COLUMNS)
          .eq("workspace_id", activeWorkspaceId)
          .order("created_at", { ascending: true });

        if (loadError) throw loadError;
        setTasks((data ?? []) as Task[]);
        setLoadFailed(false);
      } catch (loadError) {
        setLoadFailed(true);
        setFb({
          kind: "error",
          label: t("err_load"),
          raw: rawReason(loadError),
          onRetry: () => retryLoad(activeWorkspaceId),
        });
      }
    },
    [t],
  );

  function retryLoad(activeWorkspaceId: string) {
    setLoading(true);
    loadTasks(activeWorkspaceId).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!ws?.id) return; // WS-GATE
    setLoading(true);
    setFb(null);
    loadTasks(ws.id).finally(() => setLoading(false));
  }, [ws?.id, loadTasks]);

  async function handleToggle(task: Task) {
    setFb(null);
    const next = !task.is_completed;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, is_completed: next } : item,
      ),
    );

    try {
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ is_completed: next })
        .eq("id", task.id);

      if (updateError) throw updateError;
    } catch (updateError) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, is_completed: task.is_completed } : item,
        ),
      );
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(updateError),
      });
    }
  }

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title || !workspaceId || capReached) return;

    setFb(null);
    setAdding(true);

    try {
      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({ workspace_id: workspaceId, title, due_date: newDue })
        .select(TASK_COLUMNS)
        .single();

      if (insertError) throw insertError;
      setTasks((current) => [...current, data as Task]);
      setNewTitle("");
      setNewDue(null);
      setFb({ kind: "success", label: t("saved") });
    } catch (insertError) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(insertError),
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(task: Task) {
    setFb(null);
    const previous = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id));

    try {
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (deleteError) throw deleteError;
    } catch (deleteError) {
      setTasks(previous);
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(deleteError),
      });
    }
  }

  const today = todayIso();
  const uncompleted = tasks.filter((task) => !task.is_completed);
  const todayTasks = uncompleted.filter((task) => {
    const day = dueDay(task.due_date);
    return day === null || day <= today;
  });
  const scheduled = uncompleted
    .filter((task) => {
      const day = dueDay(task.due_date);
      return day !== null && day > today;
    })
    .sort((a, b) => (dueDay(a.due_date) ?? "").localeCompare(dueDay(b.due_date) ?? ""));
  const completed = tasks.filter((task) => task.is_completed);
  const capReached = uncompleted.length >= TASK_LIMIT;
  const busy = loading || !ws;

  const rowFor = (task: Task) => (
    <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
  );

  if (loadFailed && fb) {
    return (
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]">
            {t("daily_tasks")}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest opacity-60">
              {t("daily_grid")}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: TASK_LIMIT }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-6 rounded-full transition-colors duration-200 ${
                    index < uncompleted.length
                      ? "bg-[#85587D] dark:bg-[#D8A8D3]"
                      : "bg-[#E2D8E0] dark:bg-[#4A2E46]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <FeedbackBanner
            kind={fb.kind}
            label={fb.label}
            raw={fb.raw}
            onRetry={fb.onRetry}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]">
          {t("daily_tasks")}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest opacity-60">
            {t("daily_grid")}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: TASK_LIMIT }).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-6 rounded-full transition-colors duration-200 ${
                  index < uncompleted.length
                    ? "bg-[#85587D] dark:bg-[#D8A8D3]"
                    : "bg-[#E2D8E0] dark:bg-[#4A2E46]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {fb && (
        <div className="mt-6">
          <FeedbackBanner
            kind={fb.kind}
            label={fb.label}
            raw={fb.raw}
            onRetry={fb.onRetry}
          />
        </div>
      )}

      {busy ? (
        <p className="py-6 text-sm opacity-50">Loading tasks…</p>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h3 className="text-xs uppercase tracking-widest opacity-60">{t("today")}</h3>
            {todayTasks.length > 0 ? (
              <ul className="mt-3 space-y-3">{todayTasks.map(rowFor)}</ul>
            ) : (
              <p className="py-6 text-sm opacity-50">
                {t("empty_today")}
              </p>
            )}
          </section>

          {scheduled.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest opacity-60">
                {t("scheduled")}
              </h3>
              <ul className="mt-3 space-y-3">{scheduled.map(rowFor)}</ul>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowCompleted((open) => !open)}
                aria-expanded={showCompleted}
                className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60 transition-all duration-200"
              >
                {t("completed")} ({completed.length})
                <ChevronIcon open={showCompleted} />
              </button>
              {showCompleted && (
                <ul className="mt-3 space-y-3">{completed.map(rowFor)}</ul>
              )}
            </section>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleAdd}
          disabled={capReached || adding}
          aria-label={t("add_task_aria")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E2D8E0] text-[#151115] transition-all duration-200 hover:border-[#85587D] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4A2E46] dark:text-[#F8F4F7] dark:hover:border-[#D8A8D3]"
        >
          <PlusIcon />
        </button>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAdd();
          }}
          disabled={capReached}
          placeholder={t("add_task")}
          className="min-w-0 flex-1 rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] disabled:opacity-50 dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]"
        />
        <div className="w-full sm:w-44">
          <DatePicker value={newDue} onChange={setNewDue} placeholder={t("due_date")} />
        </div>
      </div>

      {capReached && (
        <p className="mt-3 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
          {t("limit_reached")}
        </p>
      )}
    </section>
  );
}
