"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { ErrorBanner } from "@/app/components/SaveFeedback";
import { useWorkspaceGate } from "../useWorkspaceData";

type Note = {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  pinned: boolean;
  updated_at: string;
};

const PlusIcon = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function NotesPage() {
  const t = useTranslations();
  const ws = useWorkspaceGate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async (workspaceId: string) => {
    const { data, error: loadError } = await supabase
      .from("notes")
      .select("id,workspace_id,title,content,pinned,updated_at")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });
    if (loadError) throw loadError;
    return (data ?? []) as Note[];
  }, []);

  useEffect(() => {
    let active = true;
    if (!ws?.id) return;

    setLoading(true);
    setError(null);
    load(ws.id)
      .then((rows) => {
        if (!active) return;
        setNotes(rows);
        setSelectedId((prev) => prev ?? rows[0]?.id ?? null);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ws?.id, load]);

  const selected = notes.find((note) => note.id === selectedId) ?? null;
  const pinned = notes.filter((note) => note.pinned);

  async function createNote() {
    if (!ws?.id || creating) return;
    setCreating(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("notes")
        .insert({ workspace_id: ws.id, title: "", content: "" })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const rows = await load(ws.id);
      setNotes(rows);
      setSelectedId((data as { id: string }).id);
      requestAnimationFrame(() => titleRef.current?.focus());
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : String(createError));
    } finally {
      setCreating(false);
    }
  }

  async function persist(note: Note, patch: Partial<Note>) {
    const previous = notes;
    setNotes((rows) => rows.map((row) => (row.id === note.id ? { ...row, ...patch } : row)));
    setError(null);

    const { error: writeError } = await supabase
      .from("notes")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", note.id);

    if (writeError) {
      setNotes(previous);
      setError(writeError.message);
    }
  }

  if (loading && ws?.id) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-[#E2D8E0] dark:bg-[#4A2E46]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#E2D8E0] dark:bg-[#4A2E46]" />
      </div>
    );
  }

  const newButtonClass =
    "inline-flex items-center gap-2 rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:opacity-90 disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]";

  const rail = (
    <aside className="w-full shrink-0 md:w-64">
      <button
        type="button"
        onClick={createNote}
        disabled={creating || !ws?.id}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E2D8E0] p-3 text-sm font-semibold text-[#151115] transition-colors duration-200 hover:border-[#85587D] hover:bg-[#85587D]/5 disabled:opacity-50 dark:border-[#4A2E46] dark:text-[#F8F4F7] dark:hover:border-[#D8A8D3] dark:hover:bg-[#D8A8D3]/5"
      >
        <PlusIcon />
        {t("new_note")}
      </button>

      {pinned.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#151115]/50 dark:text-[#F8F4F7]/50">
            {t("pinned")}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {pinned.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 ${
                    note.id === selectedId
                      ? "bg-[#85587D]/10 text-[#85587D] dark:bg-[#D8A8D3]/10 dark:text-[#D8A8D3]"
                      : "text-[#151115]/80 hover:bg-[#85587D]/5 dark:text-[#F8F4F7]/80"
                  }`}
                >
                  {note.title || t("untitled")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-[#151115]/50 dark:text-[#F8F4F7]/50">
        {t("notes")}
      </p>
      <ul className="mt-2 flex flex-col gap-1 md:max-h-[45vh] md:overflow-y-auto">
        {notes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => setSelectedId(note.id)}
              className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 ${
                note.id === selectedId
                  ? "bg-[#85587D]/10 text-[#85587D] dark:bg-[#D8A8D3]/10 dark:text-[#D8A8D3]"
                  : "text-[#151115]/80 hover:bg-[#85587D]/5 dark:text-[#F8F4F7]/80"
              }`}
            >
              {note.title || t("untitled")}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">{t("notes")}</h1>
        <button
          type="button"
          onClick={createNote}
          disabled={creating || !ws?.id}
          className={newButtonClass}
        >
          <PlusIcon />
          {t("new_note")}
        </button>
      </div>

      {error && <ErrorBanner label={t("err_save")} detail={error} onRetry={createNote} />}

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        {rail}

        {selected ? (
            <div className="min-w-0 flex-1 rounded-2xl border border-[#E2D8E0] bg-white p-6 dark:border-[#4A2E46] dark:bg-[#221C21]">
              <input
                ref={titleRef}
                value={selected.title}
                onChange={(event) =>
                  setNotes((rows) =>
                    rows.map((row) =>
                      row.id === selected.id ? { ...row, title: event.target.value } : row,
                    ),
                  )
                }
                onBlur={(event) => persist(selected, { title: event.target.value })}
                placeholder={t("new_note")}
                className="w-full border-0 bg-transparent text-xl font-bold text-[#151115] outline-none focus:ring-0 dark:text-[#F8F4F7]"
              />
              <textarea
                value={selected.content}
                onChange={(event) =>
                  setNotes((rows) =>
                    rows.map((row) =>
                      row.id === selected.id ? { ...row, content: event.target.value } : row,
                    ),
                  )
                }
                onBlur={(event) => persist(selected, { content: event.target.value })}
                className="mt-4 h-[50vh] w-full resize-none border-0 bg-transparent text-sm leading-7 text-[#151115]/85 outline-none dark:text-[#F8F4F7]/85"
              />
            </div>
        ) : (
          <div className="min-w-0 flex-1 rounded-2xl border border-[#E2D8E0] bg-white p-10 text-center dark:border-[#4A2E46] dark:bg-[#221C21]">
            <p className="text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">{t("empty_notes")}</p>
            <button
              type="button"
              onClick={createNote}
              disabled={creating || !ws?.id}
              className={`mt-6 ${newButtonClass}`}
            >
              <PlusIcon />
              {t("new_note")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
