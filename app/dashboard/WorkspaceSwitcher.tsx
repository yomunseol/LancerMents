"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "./WorkspaceContext";

function Chevron({ open }: { open: boolean }) {
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
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace, ready } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
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

  // Entrance: scale-95/opacity-0 -> scale-100/opacity-100 (200ms).
  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!ready) {
    return (
      <div className="h-12 w-full animate-pulse rounded-lg bg-[#E2D8E0] dark:bg-[#4A2E46]" />
    );
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm font-semibold text-[#151115] transition-all duration-200 dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7]"
      >
        <span className="truncate">{activeWorkspace?.name ?? "No workspace"}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-auto rounded-xl border border-[#E2D8E0] bg-white p-1 shadow-xl transition-all duration-200 origin-top dark:border-[#4A2E46] dark:bg-[#221C21] ${
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          {workspaces.length === 0 && (
            <li className="px-4 py-2.5 text-sm opacity-60">No workspaces yet</li>
          )}
          {workspaces.map((workspace) => {
            const active = workspace.id === activeWorkspace?.id;
            return (
              <li key={workspace.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-left text-sm transition-colors duration-200 hover:bg-[#85587D]/10 dark:hover:bg-[#D8A8D3]/10 ${
                    active
                      ? "font-semibold text-[#85587D] dark:text-[#D8A8D3]"
                      : "text-[#151115] opacity-80 dark:text-[#F8F4F7]"
                  }`}
                >
                  <span className="truncate">{workspace.name}</span>
                  {active && <CheckIcon />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
