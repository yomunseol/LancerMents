"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { normalizeTier, type Tier } from "@/lib/tiers";

export type Workspace = {
  id: string;
  name: string;
  owner_id: string;
};

type WorkspaceContextValue = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  switchWorkspace: (id: string) => void;
  refresh: () => Promise<void>;
  tier: Tier;
  loading: boolean;
  ready: boolean;
  error: string | null;
};

const STORAGE_KEY = "lancermonts.activeWorkspaceId";

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>("basic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setWorkspaces([]);
        setActiveId(null);
        return;
      }

      const [workspaceResult, subscriptionResult] = await Promise.all([
        supabase
          .from("workspaces")
          .select("id,name,owner_id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("subscriptions")
          .select("tier")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (workspaceResult.error) throw workspaceResult.error;

      let rows = (workspaceResult.data ?? []) as Workspace[];

      if (rows.length === 0) {
        const { data: created, error: createError } = await supabase
          .from("workspaces")
          .insert({ owner_id: user.id, name: "My Workspace" })
          .select("id,name,owner_id")
          .single();

        if (createError) throw createError;
        rows = created ? [created as Workspace] : [];
      }

      setWorkspaces(rows);
      setTier(
        normalizeTier((subscriptionResult.data as { tier?: string | null } | null)?.tier),
      );

      const stored =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem(STORAGE_KEY);
      const next = rows.find((row) => row.id === stored)?.id ?? rows[0]?.id ?? null;
      setActiveId(next);
      if (next && typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your workspaces.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const switchWorkspace = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((row) => row.id === activeId) ?? null,
    [workspaces, activeId],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace,
      switchWorkspace,
      refresh: load,
      tier,
      loading,
      ready: !loading,
      error,
    }),
    [workspaces, activeWorkspace, switchWorkspace, load, tier, loading, error],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return context;
}
