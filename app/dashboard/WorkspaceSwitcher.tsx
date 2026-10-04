"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "./WorkspaceContext";

function Chevron({ open }: { open: boolean }) {
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
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
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

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#E2D8E0] bg-white px-3 py-2 text-sm font-medium text-[#151115] transition-all duration-200 hover:border-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:hover:border-[#D8A8D3]"
      >
        <span className="truncate">
          {activeWorkspace?.name ?? "No workspace"}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-2 origin-top overflow-hidden rounded-lg border border-[#E2D8E0] bg-white py-1 shadow-2xl transition-all duration-200 dark:border-[#4A2E46] dark:bg-[#221C21]"
        >
          {workspaces.length === 0 && (
            <li className="px-3 py-2 text-sm opacity-60">No workspaces yet</li>
          )}
          {workspaces.map((workspace) => {
            const active = workspace.id === activeWorkspace?.id;
            return (
              <li key={workspace.id}>
                <button
                  type="button"
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors duration-200 ${
                    active
                      ? "text-[#85587D] dark:text-[#D8A8D3]"
                      : "text-[#151115] hover:bg-[#85587D]/10 dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10"
                  }`}
                >
                  <span className="truncate">{workspace.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
