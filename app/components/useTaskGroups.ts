"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type TaskGroup = {
  id: string;
  name: string;
  position: number;
};

export function useTaskGroups(workspaceId: string) {
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
      setGroups([]);
      setLoaded(false);
      setSupported(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("task_groups")
          .select("id,name,position")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true });

        if (!active) return;
        if (error) {
          setGroups([]);
          setSupported(false);
        } else {
          setGroups((data ?? []) as TaskGroup[]);
          setSupported(true);
        }
      } catch {
        if (active) {
          setGroups([]);
          setSupported(false);
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [workspaceId]);

  const createGroup = useCallback(
    async (name: string): Promise<TaskGroup> => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Group name is required");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session expired. Please sign in again.");

      const { data, error } = await supabase
        .from("task_groups")
        .insert({ user_id: user.id, name: trimmed, position: groups.length })
        .select("id,name,position")
        .single();

      if (error) throw error;

      const group = data as TaskGroup;
      setGroups((current) => [...current, group]);
      setSupported(true);
      return group;
    },
    [groups.length],
  );

  return { groups, loaded, supported, createGroup };
}
