"use client";

import { useWorkspace, type Workspace } from "./WorkspaceContext";

/**
 * WS-GATE — returns the active workspace only once the context has finished its
 * initial fetch. Data pages must do:
 *
 *   const ws = useWorkspaceGate()
 *   useEffect(() => { if (!ws?.id) return; load() }, [ws?.id])   // WS-GATE
 *
 * so supabase is never called with an undefined workspace_id.
 */
export function useWorkspaceGate(): Workspace | null {
  const { activeWorkspace, ready } = useWorkspace();
  return ready ? activeWorkspace : null;
}
