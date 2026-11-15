"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
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

function formatLabel(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0 opacity-70"
    >
      <rect x="4" y="6" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  );
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

export default function DatePicker({
  value,
  onChange,
  placeholder,
  onPick,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  onPick?: () => void;
}) {
  const t = useTranslations();
  const placeholderText = placeholder ?? t("select_date");
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const selected = value ? value.slice(0, 10) : null;

  const initial = selected ?? todayIso();
  const [cursor, setCursor] = useState(() => {
    const [year, month] = initial.split("-").map(Number);
    return { year, month: month - 1 };
  });

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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

  const today = todayIso();

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-[#27272a] bg-[#18181b] px-4 py-3 text-left text-sm text-zinc-100 transition-colors duration-200 hover:border-[#3f3f46] focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
      >
        <CalendarIcon />
        <span className={selected ? "" : "text-zinc-500"}>
          {selected ? formatLabel(selected) : placeholderText}
        </span>
      </button>

      {open && (
        <div className="absolute start-0 z-50 mt-2 w-72 origin-top rounded-2xl border border-[#3f3f46] bg-[#121214] p-4 shadow-2xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setCursor((current) =>
                  current.month === 0
                    ? { year: current.year - 1, month: 11 }
                    : { ...current, month: current.month - 1 },
                )
              }
              aria-label={t("prev_month")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-200 hover:bg-purple-500/10 hover:text-zinc-200"
            >
              <Chevron dir="left" />
            </button>
            <span className="text-sm font-semibold text-zinc-100">
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <button
              type="button"
              onClick={() =>
                setCursor((current) =>
                  current.month === 11
                    ? { year: current.year + 1, month: 0 }
                    : { ...current, month: current.month + 1 },
                )
              }
              aria-label={t("next_month")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-200 hover:bg-purple-500/10 hover:text-zinc-200"
            >
              <Chevron dir="right" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day, index) => (
              <span
                key={`${day}-${index}`}
                className="flex h-8 items-center justify-center text-xs text-zinc-500"
              >
                {day}
              </span>
            ))}
            {grid.map((cell, index) => {
              if (!cell) return <span key={`empty-${index}`} className="h-9 w-9" />;
              const isSelected = cell === selected;
              const isToday = cell === today;
              return (
                <button
                  key={cell}
                  type="button"
                  onClick={() => {
                    onChange(cell);
                    setOpen(false);
                    onPick?.();
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors duration-200 ${
                    isSelected
                      ? "bg-purple-500 font-semibold text-white"
                      : "text-zinc-300 hover:bg-purple-500/10"
                  } ${isToday && !isSelected ? "ring-1 ring-purple-500/50" : ""}`}
                >
                  {Number(cell.slice(8, 10))}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                onPick?.();
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-purple-500/10 hover:text-zinc-200"
            >
              {t("clear")}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(today);
                setOpen(false);
                onPick?.();
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-purple-400 transition-colors duration-200 hover:bg-purple-500/10"
            >
              {t("today")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
