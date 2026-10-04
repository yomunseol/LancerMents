"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TIER_LIMITS } from "@/lib/tiers";

type Task = {
  id: string;
  workspace_id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  is_completed: boolean;
};

const NAV_ITEMS = ["Dashboard", "Tasks", "Settings"];
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

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
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
        className="ml-3 shrink-0 text-[#151115]/60 opacity-0 transition-opacity hover:text-red-400 focus:opacity-100 group-hover:opacity-100 dark:text-[#F8F4F7]/60"
      >
        <XIcon />
      </button>
    </li>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [adding, setAdding] = useState(false);

  const loadTasks = useCallback(async (activeWorkspaceId: string) => {
    try {
      const { data, error: loadError } = await supabase
        .from("tasks")
        .select(TASK_COLUMNS)
        .eq("workspace_id", activeWorkspaceId)
        .order("created_at", { ascending: true });

      if (loadError) throw loadError;
      setTasks((data ?? []) as Task[]);
    } catch (loadError) {
      setError(messageOf(loadError, "Could not load tasks."));
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const user = userData.user;
        if (!user) return;

        if (active) setEmail(user.email ?? "");

        const { data: workspaces, error: workspaceError } = await supabase
          .from("workspaces")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (workspaceError) throw workspaceError;

        const id = workspaces?.[0]?.id;
        if (!id) return;

        if (!active) return;
        setWorkspaceId(id);
        await loadTasks(id);
      } catch (loadError) {
        if (active) setError(messageOf(loadError, "Could not load your workspace."));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadTasks]);

  async function handleToggle(task: Task) {
    setError(null);
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
      setError(messageOf(updateError, "Could not update that task."));
    }
  }

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title || !workspaceId || capReached) return;

    setError(null);
    setAdding(true);

    try {
      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({ workspace_id: workspaceId, title, due_date: newDue || null })
        .select(TASK_COLUMNS)
        .single();

      if (insertError) throw insertError;
      setTasks((current) => [...current, data as Task]);
      setNewTitle("");
      setNewDue("");
    } catch (insertError) {
      setError(messageOf(insertError, "Could not add that task."));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(task: Task) {
    setError(null);
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
      setError(messageOf(deleteError, "Could not delete that task."));
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
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

  const rowFor = (task: Task) => (
    <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b border-[#E2D8E0] bg-white p-6 md:w-64 md:shrink-0 md:border-b-0 md:border-r dark:border-[#4A2E46] dark:bg-[#221C21]">
        <div className="flex items-center gap-3">
          <img
            src="/LancerMents-Dark.png"
            alt="LancerMents"
            className="h-10 w-10 rounded-xl border border-[#4A2E46] object-cover"
          />
          <span className="text-lg font-bold text-[#151115] dark:text-[#F8F4F7]">
            LancerMents
          </span>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item, index) => {
            const active = index === 0;
            if (active) {
              return (
                <Link
                  key={item}
                  href="/dashboard"
                  className="rounded-lg bg-[#F8F4F7] px-4 py-2.5 text-sm font-semibold text-[#85587D] dark:bg-[#151115] dark:text-[#D8A8D3]"
                >
                  {item}
                </Link>
              );
            }
            return (
              <span
                key={item}
                aria-disabled="true"
                className="cursor-not-allowed rounded-lg px-4 py-2.5 text-sm font-medium text-[#151115]/70 dark:text-[#F8F4F7]/70"
              >
                {item}
              </span>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded-lg border border-[#E2D8E0] px-4 py-2.5 text-sm font-semibold text-[#151115] transition-colors hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 px-4 py-10 md:px-10">
        <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
          Welcome back
        </h1>
        {email && (
          <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            {email}
          </p>
        )}

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]">
              Daily Tasks
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest opacity-60">
                Daily grid
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

          {loading ? (
            <p className="py-6 text-sm opacity-50">Loading tasks…</p>
          ) : (
            <div className="mt-6 space-y-8">
              <section>
                <h3 className="text-xs uppercase tracking-widest opacity-60">
                  Today
                </h3>
                {todayTasks.length > 0 ? (
                  <ul className="mt-3 space-y-3">{todayTasks.map(rowFor)}</ul>
                ) : (
                  <p className="py-6 text-sm opacity-50">
                    Nothing due today. The grid is clear.
                  </p>
                )}
              </section>

              {scheduled.length > 0 && (
                <section>
                  <h3 className="text-xs uppercase tracking-widest opacity-60">
                    Scheduled
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
                    className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60"
                  >
                    Completed ({completed.length})
                    <ChevronIcon open={showCompleted} />
                  </button>
                  {showCompleted && (
                    <ul className="mt-3 space-y-3">{completed.map(rowFor)}</ul>
                  )}
                </section>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              disabled={capReached || adding}
              aria-label="Add task"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E2D8E0] text-[#151115] transition-colors hover:border-[#85587D] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4A2E46] dark:text-[#F8F4F7] dark:hover:border-[#D8A8D3]"
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
              placeholder="Add a task…"
              className="min-w-0 flex-1 rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/60 focus:outline-none focus:ring-2 focus:ring-[#85587D] disabled:opacity-50 dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]"
            />
            <input
              type="date"
              value={newDue}
              onChange={(event) => setNewDue(event.target.value)}
              disabled={capReached}
              aria-label="Due date"
              className="rounded-lg border border-[#E2D8E0] bg-white px-3 py-3 text-sm text-[#151115] focus:outline-none focus:ring-2 focus:ring-[#85587D] disabled:opacity-50 dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:focus:ring-[#D8A8D3]"
            />
          </div>

          {capReached && (
            <p className="mt-3 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
              Grid full for today.{" "}
              <Link
                href="/onboarding"
                className="font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
              >
                The Pipeline unlocks more.
              </Link>
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </section>

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
            className="w-full rounded-lg bg-[#85587D] px-6 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:opacity-90 sm:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
          >
            Upgrade Plan
          </Link>
        </section>
      </main>
    </div>
  );
}
