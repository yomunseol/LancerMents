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
import FolderIcon from "@/app/components/FolderIcon";
import TaskGroupMenu from "@/app/components/TaskGroupMenu";
import { useClients } from "@/app/components/useClients";
import { useClientTimer } from "@/app/components/useClientTimer";
import { useTaskGroups, type TaskGroup } from "@/app/components/useTaskGroups";
import { useWorkspaceGate } from "./useWorkspaceData";

export type Task = {
  id: string;
  workspace_id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  is_completed: boolean;
  client_name?: string | null;
  group_id?: string | null;
};

const TASK_COLUMNS = "id,workspace_id,title,due_date,created_at,is_completed";
const TASK_COLUMNS_GROUP = `${TASK_COLUMNS},group_id`;

const CARD =
  "rounded-2xl border border-[#E2D8E0] bg-white shadow-xl dark:border-[#4A2E46] dark:bg-[#221C21]";
const LABEL = "text-[11px] tracking-widest opacity-60";
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

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4l10-10-4-4L4 16zM14 6l4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
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
  groups,
  onToggle,
  onDelete,
  onMove,
  onEdit,
  onDueDate,
}: {
  task: Task;
  clientLabel?: string;
  groups: TaskGroup[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (task: Task, groupId: string | null) => void;
  onEdit: (task: Task, title: string) => void;
  onDueDate: (task: Task, due: string | null) => void;
}) {
  const t = useTranslations();
  const checked = task.is_completed;
  const subLabel = clientLabel?.trim();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const editInputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    if (!editing) return;
    committedRef.current = false;
    setDraft(task.title);
    const frame = requestAnimationFrame(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [editing, task.title]);

  function beginEdit() {
    if (editing) {
      editInputRef.current?.focus();
      return;
    }
    setDraft(task.title);
    setEditing(true);
  }

  function commitEdit() {
    if (committedRef.current) return;
    committedRef.current = true;
    const next = draft.trim();
    setEditing(false);
    if (next && next !== task.title) onEdit(task, next);
    else setDraft(task.title);
  }

  function cancelEdit() {
    committedRef.current = true;
    setEditing(false);
    setDraft(task.title);
  }

  const actionButtonClass =
    "flex h-7 w-7 items-center justify-center rounded-md text-[#151115]/40 transition-colors duration-200 hover:bg-[#85587D]/10 hover:text-[#85587D] focus:outline-none focus:ring-2 focus:ring-[#85587D]/30 dark:text-[#F8F4F7]/40 dark:hover:bg-[#D8A8D3]/10 dark:hover:text-[#D8A8D3] dark:focus:ring-[#D8A8D3]/30";

  return (
    <li
      className={`group ${ROW_GRID} rounded-xl py-6 transition-colors duration-200 hover:bg-[#85587D]/5 dark:hover:bg-[#D8A8D3]/10`}
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

      {editing ? (
        <div className="min-w-0">
          <input
            ref={editInputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitEdit();
              } else if (event.key === "Escape") {
                event.preventDefault();
                cancelEdit();
              }
            }}
            onBlur={commitEdit}
            aria-label={t("tasks.edit")}
            className="block w-full bg-transparent text-sm font-semibold text-[#151115] focus:outline-none dark:text-[#F8F4F7]"
          />
          {subLabel && (
            <span className="mt-0.5 block truncate text-xs opacity-60">
              {subLabel}
            </span>
          )}
        </div>
      ) : (
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
      )}

      <div className="flex items-center justify-self-end gap-2">
        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100">
          <TaskGroupMenu
            groups={groups}
            currentGroupId={task.group_id ?? null}
            onMove={(groupId) => onMove(task, groupId)}
          />
          <button
            type="button"
            onClick={beginEdit}
            aria-label={t("tasks.edit")}
            className={actionButtonClass}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label={t("tasks.delete")}
            className={actionButtonClass}
          >
            <TrashIcon />
          </button>
        </div>
        <DatePicker
          variant="pill"
          value={task.due_date}
          onChange={(value) => onDueDate(task, value)}
          placeholder={t("dashboard.due_date")}
        />
      </div>
    </li>
  );
}

export default function TasksBoard() {
  const t = useTranslations();
  const ws = useWorkspaceGate();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const undoTimerRef = useRef<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [undoTask, setUndoTask] = useState<{ task: Task; index: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const workspaceId = ws?.id ?? "";
  const clients = useClients(workspaceId);
  const timer = useClientTimer(workspaceId);
  const { groups, loaded: groupsLoaded, createGroup } = useTaskGroups(workspaceId);

  const loadTasks = useCallback(
    async (activeWorkspaceId: string) => {
      setFb(null);
      try {
        const query = (columns: string) =>
          supabase
            .from("tasks")
            .select(columns)
            .eq("workspace_id", activeWorkspaceId)
            .order("created_at", { ascending: true });

        let result = await query(TASK_COLUMNS_GROUP);
        if (result.error && (result.error as { code?: string }).code === "42703") {
          result = await query(TASK_COLUMNS);
        }

        const { data, error: loadError } = result;
        if (loadError) throw loadError;
        setTasks((data ?? []) as unknown as Task[]);
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
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (creatingGroup) groupInputRef.current?.focus();
  }, [creatingGroup]);

  useEffect(() => {
    if (
      selectedGroupId &&
      !groups.some(
        (group) => group.id === selectedGroupId && (group.name ?? "").trim(),
      )
    ) {
      setSelectedGroupId(null);
    }
  }, [groups, selectedGroupId]);

  async function handleToggle(task: Task) {
    setFb(null);
    const next = !task.is_completed;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, is_completed: next } : item,
      ),
    );

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: next })
        .eq("id", task.id);
      if (error) throw error;
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

  async function handleEditTitle(task: Task, title: string) {
    const next = title.trim();
    if (!next || next === task.title) return;
    const previous = task.title;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, title: next } : item,
      ),
    );

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ title: next })
        .eq("id", task.id);
      if (error) throw error;
    } catch (updateError) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, title: previous } : item,
        ),
      );
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(updateError),
      });
    }
  }

  async function handleDueDate(task: Task, due: string | null) {
    const previous = task.due_date;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, due_date: due } : item,
      ),
    );

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ due_date: due })
        .eq("id", task.id);
      if (error) throw error;
    } catch (updateError) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, due_date: previous } : item,
        ),
      );
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(updateError),
      });
    }
  }

  async function createTask(
    title: string,
    due: string | null,
    groupId: string | null,
  ) {
    if (!workspaceId) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: Task = {
      id: tempId,
      workspace_id: workspaceId,
      title,
      due_date: due,
      created_at: new Date().toISOString(),
      is_completed: false,
      group_id: groupId,
    };

    setFb(null);
    setTasks((current) => [...current, optimistic]);
    if (groupId) {
      setExpandedGroups((current) => ({ ...current, [groupId]: true }));
    }

    try {
      const payload: Record<string, unknown> = {
        workspace_id: workspaceId,
        title,
        due_date: due,
      };
      if (groupId) payload.group_id = groupId;

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert(payload)
        .select(groupId ? TASK_COLUMNS_GROUP : TASK_COLUMNS)
        .single();

      if (insertError) throw insertError;

      setTasks((current) =>
        current.map((item) =>
          item.id === tempId ? (data as unknown as Task) : item,
        ),
      );
      setFb({ kind: "success", label: t("saved") });
    } catch (insertError) {
      setTasks((current) => current.filter((item) => item.id !== tempId));
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(insertError),
        onRetry: () => {
          void createTask(title, due, groupId);
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
    void createTask(title, due, selectedGroupId);
  }

  async function handleCreateGroup() {
    const name = groupName.trim();
    if (!name) return;

    try {
      const group = await createGroup(name);
      setSelectedGroupId(group.id);
      setGroupName("");
      setCreatingGroup(false);
    } catch (createError) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(createError),
      });
    }
  }

  function toggleGroup(id: string) {
    setExpandedGroups((current) => ({ ...current, [id]: !current[id] }));
  }

  async function handleMoveTask(task: Task, groupId: string | null) {
    const previous = task.group_id ?? null;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, group_id: groupId } : item,
      ),
    );
    if (groupId) {
      setExpandedGroups((current) => ({ ...current, [groupId]: true }));
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ group_id: groupId })
        .eq("id", task.id);
      if (error) throw error;
    } catch (moveError) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, group_id: previous } : item,
        ),
      );
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(moveError),
      });
    }
  }

  async function handleDelete(task: Task) {
    setFb(null);
    const index = tasks.findIndex((item) => item.id === task.id);
    const snapshot = { ...task };
    setTasks((current) => current.filter((item) => item.id !== task.id));

    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
    }
    setUndoTask({ task: snapshot, index: index >= 0 ? index : tasks.length });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoTask(null);
      undoTimerRef.current = null;
    }, 5000);

    setDeleting(true);
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    } catch (deleteError) {
      setTasks((current) => {
        if (current.some((item) => item.id === snapshot.id)) return current;
        const next = [...current];
        next.splice(
          Math.min(index >= 0 ? index : next.length, next.length),
          0,
          snapshot,
        );
        return next;
      });
      setUndoTask(null);
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(deleteError),
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleUndo() {
    const target = undoTask;
    if (!target || deleting) return;

    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoTask(null);

    const { task, index } = target;
    setTasks((current) => {
      if (current.some((item) => item.id === task.id)) return current;
      const next = [...current];
      next.splice(Math.min(index, next.length), 0, task);
      return next;
    });
    if (task.group_id) {
      setExpandedGroups((current) => ({ ...current, [task.group_id as string]: true }));
    }

    try {
      const payload: Record<string, unknown> = {
        id: task.id,
        workspace_id: task.workspace_id,
        title: task.title,
        due_date: task.due_date,
        created_at: task.created_at,
        is_completed: task.is_completed,
      };
      if (task.group_id) payload.group_id = task.group_id;
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) throw error;
    } catch (undoError) {
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(undoError),
      });
    }
  }

  const visibleTasks = tasks.filter((task) => (task.title ?? "").trim().length > 0);
  const validGroups = groups.filter((group) => (group.name ?? "").trim().length > 0);
  const groupIds = new Set(validGroups.map((group) => group.id));
  const rootTasks = visibleTasks.filter(
    (task) => !task.group_id || !groupIds.has(task.group_id),
  );
  const completedVisible = visibleTasks.filter((task) => task.is_completed).length;
  const busy = loading || !ws || !groupsLoaded;
  const ADD_GRID =
    "grid grid-cols-[2.75rem_minmax(0,1fr)_auto_auto] items-center gap-5";
  const showEmptyRoot = validGroups.length === 0 && rootTasks.length === 0;

  const storedMissing =
    timer.clientId !== null && !clients.some((client) => client.id === timer.clientId);

  const rowFor = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      clientLabel={task.client_name ?? undefined}
      groups={validGroups}
      onToggle={handleToggle}
      onDelete={handleDelete}
      onMove={handleMoveTask}
      onEdit={handleEditTitle}
      onDueDate={handleDueDate}
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
          {completedVisible}/{visibleTasks.length} {t("dashboard.done")}
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
          <ul className="flex flex-col gap-1 px-6 py-3">
            {validGroups.map((group) => {
              const groupTasks = visibleTasks.filter(
                (task) => task.group_id === group.id,
              );
              const groupDone = groupTasks.filter((task) => task.is_completed).length;
              const open = !!expandedGroups[group.id];

              return (
                <li key={group.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => toggleGroup(group.id)}
                    className={`${ROW_GRID} w-full rounded-xl py-6 text-left transition-colors duration-200 hover:bg-[#85587D]/5 dark:hover:bg-[#D8A8D3]/10`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center text-[#151115]/60 dark:text-[#F8F4F7]/60">
                      <ChevronIcon open={open} />
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <FolderIcon className="h-4 w-4 shrink-0 text-[#85587D] dark:text-[#D8A8D3]" />
                      <span className="truncate text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
                        {group.name}
                      </span>
                    </span>
                    <span className={`justify-self-end whitespace-nowrap ${LABEL}`}>
                      {groupDone}/{groupTasks.length} {t("dashboard.done")}
                    </span>
                  </button>
                  {open && groupTasks.length > 0 && (
                    <ul className="pl-16">{groupTasks.map(rowFor)}</ul>
                  )}
                </li>
              );
            })}

            {rootTasks.map(rowFor)}

            {showEmptyRoot && (
              <li className={`${ROW_GRID} py-6`}>
                <span />
                <p className={`truncate ${LABEL}`}>{t("tasks.empty")}</p>
                <span />
              </li>
            )}

            <li className="py-2">
              {creatingGroup ? (
                <input
                  ref={groupInputRef}
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleCreateGroup();
                    } else if (event.key === "Escape") {
                      setCreatingGroup(false);
                      setGroupName("");
                    }
                  }}
                  placeholder={t("groups.placeholder")}
                  className={`${LABEL} w-full border-none bg-transparent p-0 placeholder:opacity-40 focus:outline-none`}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setGroupName("");
                    setCreatingGroup(true);
                  }}
                  className={`${LABEL} transition-opacity duration-200 hover:opacity-100`}
                >
                  {t("groups.new")}
                </button>
              )}
            </li>

            <li className={`${ADD_GRID} py-6`}>
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
              <div className="flex h-10 items-center gap-1 rounded-lg border border-[#E2D8E0] bg-white px-2 dark:border-[#4A2E46] dark:bg-[#221C21]">
                <FolderIcon className="h-4 w-4 shrink-0 text-[#85587D] dark:text-[#D8A8D3]" />
                <select
                  value={selectedGroupId ?? ""}
                  onChange={(event) => setSelectedGroupId(event.target.value || null)}
                  aria-label={t("groups.select")}
                  className="h-full max-w-[9rem] cursor-pointer border-none bg-transparent pr-1 text-sm text-[#151115] focus:outline-none dark:text-[#F8F4F7]"
                >
                  <option value="">{t("groups.noGroup")}</option>
                  {validGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <DatePicker
                value={newDue}
                onChange={setNewDue}
                placeholder={t("dashboard.due_date")}
                onPick={() => titleInputRef.current?.focus()}
              />
            </li>
          </ul>

        </>
      )}

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

      {undoTask && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-[#E2D8E0] bg-white px-4 py-2 shadow-xl dark:border-[#4A2E46] dark:bg-[#221C21]"
        >
          <span className={LABEL}>{t("tasks.deleted")}</span>
          <button
            type="button"
            onClick={() => void handleUndo()}
            disabled={deleting}
            className="text-[11px] font-semibold tracking-widest text-[#85587D] hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#D8A8D3]"
          >
            {t("tasks.undo")}
          </button>
        </div>
      )}
    </section>
  );
}
