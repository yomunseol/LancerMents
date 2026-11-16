"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";
import DatePicker from "@/app/components/DatePicker";
import { useClients } from "@/app/components/useClients";
import { useClientTimer } from "@/app/components/useClientTimer";
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

const CARD =
  "rounded-2xl border border-[#E2D8E0] bg-white shadow-xl dark:border-[#4A2E46] dark:bg-[#221C21]";
const LABEL = "text-[11px] tracking-widest opacity-60";
const PILL =
  "rounded-full border border-[#85587D]/40 px-2.5 py-1 text-[11px] font-semibold tracking-widest text-[#85587D] dark:border-[#D8A8D3]/40 dark:text-[#D8A8D3]";
const HIT_LABEL =
  "relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center";
const ICON_BUTTON =
  "flex h-7 w-7 items-center justify-center rounded-lg border border-[#85587D]/40 transition-colors duration-200 hover:border-[#85587D] dark:border-[#D8A8D3]/40 dark:hover:border-[#D8A8D3]";
const ICON_BUTTON_ACTIVE =
  "border-[#85587D] bg-[#85587D] text-white hover:bg-[#85587D] dark:border-[#D8A8D3] dark:bg-[#D8A8D3] dark:text-[#151115]";
const ADD_BUTTON =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:focus:ring-[#D8A8D3]";
const ADD_VISUAL =
  "flex h-7 w-7 items-center justify-center rounded-lg bg-[#85587D] text-white transition-colors duration-200 hover:brightness-95 dark:bg-[#D8A8D3] dark:text-[#151115]";
const ROW_GRID = "grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-5";

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

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
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
  clientLabel,
  pending,
  onToggle,
  onDelete,
}: {
  task: Task;
  clientLabel?: string;
  pending?: "holding" | "leaving";
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const t = useTranslations();
  const checked = task.is_completed || pending !== undefined;
  const isToday = dueDay(task.due_date) === todayIso();
  const leaving = pending === "leaving";
  const subLabel = clientLabel?.trim();

  return (
    <li
      className={`group ${ROW_GRID} rounded-xl py-6 transition-all duration-200 hover:bg-[#85587D]/5 dark:hover:bg-[#D8A8D3]/10 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <label className={HIT_LABEL}>
        <input
          id={`task-${task.id}`}
          type="checkbox"
          checked={checked}
          aria-checked={checked}
          onChange={() => onToggle(task)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onToggle(task);
            }
          }}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`${ICON_BUTTON} peer-focus-visible:ring-2 peer-focus-visible:ring-[#85587D] dark:peer-focus-visible:ring-[#D8A8D3] ${
            checked ? ICON_BUTTON_ACTIVE : ""
          }`}
        >
          {checked && (
            <svg
              className="h-3.5 w-3.5 text-white dark:text-[#151115]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12l4 4L19 6" />
            </svg>
          )}
        </span>
      </label>
      <label htmlFor={`task-${task.id}`} className="min-w-0 cursor-pointer">
        <span
          className={`block truncate text-sm font-semibold text-[#151115] dark:text-[#F8F4F7] ${
            checked ? "line-through opacity-60" : ""
          }`}
        >
          {task.title}
        </span>
        {subLabel && (
          <span
            className={`mt-0.5 block truncate text-xs opacity-60 ${
              checked ? "line-through" : ""
            }`}
          >
            {subLabel}
          </span>
        )}
      </label>
      <div className="flex items-center justify-self-end gap-2">
        {task.due_date && (
          <span className={`whitespace-nowrap ${PILL}`}>
            {isToday ? t("dashboard.today") : formatDue(task.due_date)}
          </span>
        )}
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
          className="shrink-0 text-[#151115]/50 opacity-0 transition-colors duration-200 hover:text-red-400 focus:opacity-100 group-hover:opacity-100 dark:text-[#F8F4F7]/50"
        >
          <XIcon />
        </button>
      </div>
    </li>
  );
}

export default function TasksBoard() {
  const t = useTranslations();
  const ws = useWorkspaceGate();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<Record<string, number[]>>({});
  const [pending, setPending] = useState<Record<string, "holding" | "leaving">>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState<string | null>(null);

  const workspaceId = ws?.id ?? "";
  const clients = useClients(workspaceId);
  const timer = useClientTimer(workspaceId);

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

  useEffect(() => {
    return () => {
      Object.values(timersRef.current)
        .flat()
        .forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function clearTaskTimers(id: string) {
    const timers = timersRef.current[id];
    if (timers) timers.forEach((timer) => window.clearTimeout(timer));
    delete timersRef.current[id];
  }

  function setPendingFor(id: string, value: "holding" | "leaving" | null) {
    setPending((current) => {
      const next = { ...current };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });
  }

  async function handleToggle(task: Task) {
    setFb(null);

    // A second click during the 2s hold cancels the completion.
    if (pending[task.id]) {
      clearTaskTimers(task.id);
      setPendingFor(task.id, null);
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ is_completed: false })
          .eq("id", task.id);
        if (error) throw error;
      } catch (updateError) {
        setFb({
          kind: "error",
          label: t("err_save"),
          raw: rawReason(updateError),
        });
      }
      return;
    }

    if (task.is_completed) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, is_completed: false } : item,
        ),
      );
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ is_completed: false })
          .eq("id", task.id);
        if (error) throw error;
      } catch (updateError) {
        setTasks((current) =>
          current.map((item) =>
            item.id === task.id ? { ...item, is_completed: true } : item,
          ),
        );
        setFb({
          kind: "error",
          label: t("err_save"),
          raw: rawReason(updateError),
        });
      }
      return;
    }

    setPendingFor(task.id, "holding");

    const holdTimer = window.setTimeout(() => {
      setPendingFor(task.id, "leaving");
      const leaveTimer = window.setTimeout(() => {
        setTasks((current) =>
          current.map((item) =>
            item.id === task.id ? { ...item, is_completed: true } : item,
          ),
        );
        setPendingFor(task.id, null);
        delete timersRef.current[task.id];
      }, 200);
      timersRef.current[task.id] = [leaveTimer];
    }, 2000);
    timersRef.current[task.id] = [holdTimer];

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: true })
        .eq("id", task.id);
      if (error) throw error;
    } catch (updateError) {
      clearTaskTimers(task.id);
      setPendingFor(task.id, null);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, is_completed: false } : item,
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

  const storedMissing =
    timer.clientId !== null && !clients.some((client) => client.id === timer.clientId);

  const rowFor = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      clientLabel={task.client_name ?? undefined}
      pending={pending[task.id]}
      onToggle={handleToggle}
      onDelete={handleDelete}
    />
  );

  if (loadFailed && fb) {
    return (
      <section className={`mt-8 overflow-hidden ${CARD}`}>
        <div className="border-b border-[#E2D8E0] px-6 py-5 dark:border-[#4A2E46]">
          <h2 className="text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
            {t("dashboard.daily_tasks")}
          </h2>
        </div>
        <div className="p-5">
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
    <section className={`mt-8 ${CARD}`}>
      <div className="flex items-center justify-between border-b border-[#E2D8E0] px-6 py-5 dark:border-[#4A2E46]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#85587D] dark:bg-[#D8A8D3]" />
          <h2 className="truncate text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
            {t("dashboard.daily_tasks")}
          </h2>
          <span className={`hidden sm:inline ${LABEL}`}>
            {t("dashboard.today")}
          </span>
        </div>
        <span className="shrink-0 text-xs opacity-60">
          {completed.length}/{tasks.length} {t("dashboard.done")}
        </span>
      </div>

      {fb && (
        <div className="fixed bottom-4 end-4 z-50 w-[min(22rem,calc(100vw-2rem))]">
          <FeedbackBanner
            kind={fb.kind}
            label={fb.label}
            raw={fb.raw}
            onRetry={fb.onRetry}
          />
        </div>
      )}

      {busy ? (
        <p className={`px-6 py-6 text-sm ${LABEL}`}>{t("loading")}</p>
      ) : (
        <>
          {todayTasks.length > 0 ? (
            <ul className="flex flex-col gap-1 px-6 py-3">
              {todayTasks.map(rowFor)}
            </ul>
          ) : (
            <div className="mx-6 mb-6">
              <div className="rounded-2xl border border-[#85587D]/20 p-6 dark:border-[#D8A8D3]/20">
                <p className={LABEL}>{t("notes")}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#151115]/80 dark:text-[#F8F4F7]/80">
                  {t("dashboard.empty_today")}
                </p>
              </div>
            </div>
          )}

          {scheduled.length > 0 && (
            <div>
              <div className="px-6 pb-1 pt-4">
                <p className={LABEL}>{t("scheduled")}</p>
              </div>
              <ul className="flex flex-col gap-1 px-6 pb-3">
                {scheduled.map(rowFor)}
              </ul>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowCompleted((open) => !open)}
                aria-expanded={showCompleted}
                className="flex w-full items-center justify-between border-t border-[#E2D8E0] px-6 py-3 text-[11px] tracking-widest opacity-60 transition-opacity duration-200 hover:opacity-100 dark:border-[#4A2E46]"
              >
                <span>
                  {t("dashboard.completed")} ({completed.length})
                </span>
                <ChevronIcon open={showCompleted} />
              </button>
              {showCompleted && (
                <ul className="flex flex-col gap-1 px-6 pb-3">
                  {completed.map(rowFor)}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <div
        className={`${ROW_GRID} border-t border-[#E2D8E0] px-6 py-5 dark:border-[#4A2E46]`}
      >
        <button
          type="button"
          onClick={handleAdd}
          aria-label={t("add_task_aria")}
          className={ADD_BUTTON}
        >
          <span className={ADD_VISUAL}>
            <PlusIcon />
          </span>
        </button>
        <input
          ref={titleInputRef}
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAdd();
          }}
          placeholder={t("dashboard.add_task_placeholder")}
          className="h-10 w-full min-w-0 rounded-lg border border-[#E2D8E0] bg-white px-3 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-colors duration-200 focus:border-[#85587D] focus:outline-none focus:ring-2 focus:ring-[#85587D]/30 dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:border-[#D8A8D3] dark:focus:ring-[#D8A8D3]/30"
        />
        <DatePicker
          value={newDue}
          onChange={setNewDue}
          placeholder={t("dashboard.due_date")}
          onPick={() => titleInputRef.current?.focus()}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-[#E2D8E0] px-6 py-5 transition-colors duration-200 hover:bg-[#85587D]/5 dark:border-[#4A2E46] dark:hover:bg-[#D8A8D3]/10">
        <div className="min-w-0">
          <p className={LABEL}>{t("time.client")}</p>
          <select
            value={timer.clientId ?? ""}
            onChange={(event) => {
              const next =
                clients.find((client) => client.id === event.target.value) ?? null;
              timer.selectClient(next?.id ?? null, next?.name ?? null);
            }}
            aria-label={t("time.selectClient")}
            className="mt-0.5 max-w-[12rem] cursor-pointer truncate border-none bg-transparent p-0 text-sm font-semibold text-[#151115] focus:outline-none dark:text-[#F8F4F7]"
          >
            <option value="">
              {clients.length === 0 ? t("time.noClients") : t("time.none")}
            </option>
            {storedMissing && (
              <option value={timer.clientId ?? ""}>
                {timer.clientName ?? t("time.none")}
              </option>
            )}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="font-mono text-lg font-semibold tabular-nums text-[#85587D] dark:text-[#D8A8D3]"
            aria-live="polite"
          >
            {timer.formatted}
          </span>
          <button
            type="button"
            onClick={timer.toggle}
            aria-label={timer.running ? t("time.pause") : t("time.start")}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#85587D] text-white transition-colors duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:bg-[#D8A8D3] dark:text-[#151115] dark:focus:ring-[#D8A8D3]"
          >
            {timer.running ? <PauseIcon /> : <PlayIcon />}
          </button>
          <Link
            href="/dashboard/time"
            className={`${LABEL} transition-opacity duration-200 hover:opacity-100`}
          >
            {t("time.view")}
          </Link>
        </div>
      </div>
    </section>
  );
}
