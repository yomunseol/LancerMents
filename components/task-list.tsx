"use client";

import { useState, type FormEvent } from "react";
import type { Task } from "@/lib/types";

function formatDueDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function TaskList({
  tasks,
  limit,
  tierName,
  onAdd,
  onRequestUpgrade,
  busy,
}: {
  tasks: Task[];
  limit: number;
  tierName: string;
  onAdd: (title: string) => Promise<void>;
  onRequestUpgrade: () => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const unlimited = !Number.isFinite(limit);
  const atLimit = !unlimited && tasks.length >= limit;
  const visible = unlimited ? tasks : tasks.slice(0, limit);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    if (atLimit) {
      onRequestUpgrade();
      return;
    }
    await onAdd(value);
    setTitle("");
  }

  return (
    <section
      aria-label="Daily tasks"
      className="rounded-lg border border-deep-border bg-surface p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-primary-text">Daily Tasks</h2>
        <span className="text-sm text-primary-text/70">
          {tasks.length}
          {unlimited ? "" : ` / ${limit}`} tasks · {tierName}
        </span>
      </header>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="task-title" className="sr-only">
          Task title
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-md border border-deep-border bg-background px-3 py-2 text-sm text-primary-text placeholder:text-primary-text/70 focus:border-accent-mauve focus:outline-none focus:ring-1 focus:ring-accent-mauve"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent-mauve px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Task
        </button>
      </form>

      {atLimit && (
        <p className="mt-2 text-xs font-medium text-accent-mauve">
          Basic includes {limit} tasks. Upgrade to The Pipeline for unlimited.
        </p>
      )}

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((task) => (
          <li
            key={task.id}
            className="rounded-md border border-deep-border bg-background p-4"
          >
            <p className="text-sm font-medium text-primary-text">{task.title}</p>
            {task.description && (
              <p className="mt-1 text-sm text-primary-text/70">{task.description}</p>
            )}
            {task.due_date && (
              <p className="mt-2 text-xs font-medium text-accent-mauve">
                Due {formatDueDate(task.due_date)}
              </p>
            )}
          </li>
        ))}
        {visible.length === 0 && (
          <li className="rounded-md border border-dashed border-deep-border p-4 text-sm text-primary-text/70">
            No tasks yet. Add your first task above.
          </li>
        )}
      </ul>
    </section>
  );
}
