"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
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
  client_name?: string | null;
};

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
  const t = useTranslations();
  const completed = task.is_completed;
  const isToday = dueDay(task.due_date) === todayIso();

  return (
    <li className="group flex items-start gap-3 rounded-xl border border-[#27272a] bg-[#121214] px-4 py-3.5 transition-colors duration-200 hover:border-[#3f3f46]">
      <input
        id={`task-${task.id}`}
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(task)}
        className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
          completed
            ? "border-purple-500 bg-purple-500"
            : "border-zinc-600 bg-transparent hover:border-zinc-500"
        }`}
      />
      <label htmlFor={`task-${task.id}`} className="min-w-0 flex-1 cursor-pointer">
        <span
          className={`block text-base leading-relaxed ${
            completed ? "text-zinc-500 line-through" : "text-zinc-200"
          }`}
        >
          {task.title}
        </span>
        {task.client_name && (
          <span className="mt-0.5 block text-xs text-zinc-500">{task.client_name}</span>
        )}
      </label>
      {task.due_date && (
        <span className="ml-3 mt-0.5 whitespace-nowrap rounded-full border border-[#3f3f46] px-2.5 py-1 text-xs text-zinc-400">
          {isToday ? t("dashboard.today") : formatDue(task.due_date)}
        </span>
      )}
      <button
        type="button"
        onClick={() => onDelete(task)}
        aria-label={`Delete ${task.title}`}
        className="ml-3 mt-0.5 shrink-0 text-zinc-500 opacity-0 transition-colors duration-200 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
      >
        <XIcon />
      </button>
    </li>
  );
}

export default function TasksBoard() {
  const t = useTranslations();
  const ws = useWorkspaceGate();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState<string | null>(null);

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

  async function createTask(title: string, due: string | null) {
    if (!workspaceId) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: Task = {
      id: tempId,
      workspace_id: workspaceId,
      title,
      due_date: due,
      created_at: new Date().toISOString(),
      is_completed: false,
    };

    setFb(null);
    setTasks((current) => [...current, optimistic]);

    try {
      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({ workspace_id: workspaceId, title, due_date: due })
        .select(TASK_COLUMNS)
        .single();

      if (insertError) throw insertError;

      setTasks((current) =>
        current.map((item) => (item.id === tempId ? (data as Task) : item)),
      );
      setFb({ kind: "success", label: t("saved") });
    } catch (insertError) {
      setTasks((current) => current.filter((item) => item.id !== tempId));
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(insertError),
        onRetry: () => {
          void createTask(title, due);
        },
      });
    }
  }

  function handleAdd() {
    const title = newTitle.trim();
    if (!title || !workspaceId) return;

    const due = newDue;
    setNewTitle("");
    setNewDue(null);
    titleInputRef.current?.focus();
    void createTask(title, due);
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
  const busy = loading || !ws;

  const rowFor = (task: Task) => (
    <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
  );

  if (loadFailed && fb) {
    return (
      <section className="mt-8 rounded-2xl border border-[#27272a] bg-[#09090b] p-4 text-zinc-100 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">
          {t("dashboard.daily_tasks")}
        </h2>
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
    <section className="mt-8 rounded-2xl border border-[#27272a] bg-[#09090b] p-4 text-zinc-100 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">
          {t("dashboard.daily_tasks")}
        </h2>
      </div>

      {fb && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))]">
          <FeedbackBanner
            kind={fb.kind}
            label={fb.label}
            raw={fb.raw}
            onRetry={fb.onRetry}
          />
        </div>
      )}

      {busy ? (
        <p className="py-6 text-sm text-zinc-500">{t("loading")}</p>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h3 className="text-xs uppercase tracking-widest text-zinc-500">
              {t("dashboard.today")}
            </h3>
            {todayTasks.length > 0 ? (
              <ul className="mt-3 space-y-3">{todayTasks.map(rowFor)}</ul>
            ) : (
              <p className="py-6 text-sm text-zinc-500">
                {t("dashboard.empty_today")}
              </p>
            )}
          </section>

          {scheduled.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-zinc-500">
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
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 transition-colors duration-200 hover:text-zinc-300"
              >
                {t("dashboard.completed")} ({completed.length})
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
          aria-label={t("add_task_aria")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white transition-colors duration-200 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        >
          <PlusIcon />
        </button>
        <input
          ref={titleInputRef}
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAdd();
          }}
          placeholder={t("dashboard.add_task_placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-[#27272a] bg-[#18181b] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors duration-200 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
        />
        <div className="w-full sm:w-44">
          <DatePicker
            value={newDue}
            onChange={setNewDue}
            placeholder={t("dashboard.due_date")}
            onPick={() => titleInputRef.current?.focus()}
          />
        </div>
      </div>
    </section>
  );
}
