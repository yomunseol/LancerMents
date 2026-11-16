"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import FolderIcon from "@/app/components/FolderIcon";
import type { TaskGroup } from "@/app/components/useTaskGroups";

export default function TaskGroupMenu({
  groups,
  currentGroupId,
  onMove,
}: {
  groups: TaskGroup[];
  currentGroupId: string | null;
  onMove: (groupId: string | null) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

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

  function choose(groupId: string | null) {
    setOpen(false);
    if (groupId !== currentGroupId) onMove(groupId);
  }

  const itemClass =
    "block w-full rounded-lg px-3 py-2 text-left text-[11px] tracking-widest text-[#151115]/80 transition-colors duration-200 hover:bg-[#85587D]/10 hover:text-[#85587D] dark:text-[#F8F4F7]/80 dark:hover:bg-[#D8A8D3]/10 dark:hover:text-[#D8A8D3]";

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("groups.move")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#151115]/40 transition-colors duration-200 hover:bg-[#85587D]/10 hover:text-[#85587D] focus:outline-none focus:ring-2 focus:ring-[#85587D]/30 dark:text-[#F8F4F7]/40 dark:hover:bg-[#D8A8D3]/10 dark:hover:text-[#D8A8D3] dark:focus:ring-[#D8A8D3]/30"
      >
        <FolderIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-48 rounded-xl border border-[#E2D8E0] bg-white p-1 shadow-xl dark:border-[#4A2E46] dark:bg-[#221C21]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(null)}
            className={`${itemClass} ${currentGroupId === null ? "font-semibold" : ""}`}
          >
            {t("groups.noGroup")}
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              role="menuitem"
              onClick={() => choose(group.id)}
              className={`${itemClass} ${currentGroupId === group.id ? "font-semibold" : ""}`}
            >
              {group.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
