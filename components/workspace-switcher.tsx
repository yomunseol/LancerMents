"use client";

import type { Workspace } from "@/lib/types";

export default function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSelect,
  createDisabled,
  onCreate,
  busy,
}: {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  createDisabled: boolean;
  onCreate: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="workspace-switcher" className="sr-only">
        Active workspace
      </label>
      <select
        id="workspace-switcher"
        value={activeId ?? ""}
        onChange={(event) => onSelect(event.target.value)}
        disabled={workspaces.length === 0}
        className="rounded-md border border-deep-border bg-surface px-3 py-2 text-sm font-medium text-primary-text focus:border-accent-mauve focus:outline-none disabled:text-primary-text/70"
      >
        {workspaces.length === 0 && (
          <option value="" className="bg-surface text-primary-text">
            No workspaces
          </option>
        )}
        {workspaces.map((workspace) => (
          <option
            key={workspace.id}
            value={workspace.id}
            className="bg-surface text-primary-text"
          >
            {workspace.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onCreate}
        disabled={createDisabled || busy}
        title={
          createDisabled
            ? "Basic includes 1 workspace. Upgrade to The Pipeline to add more."
            : undefined
        }
        className="rounded-md border border-deep-border px-3 py-2 text-sm font-semibold text-accent-mauve transition-colors hover:border-accent-mauve disabled:cursor-not-allowed disabled:text-primary-text/70 disabled:hover:border-deep-border"
      >
        {busy ? "Creating\u2026" : "Create New"}
      </button>
    </div>
  );
}
