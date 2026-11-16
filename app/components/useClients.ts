"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type ClientOption = {
  id: string;
  name: string;
};

export function useClients(workspaceId: string): ClientOption[] {
  const [clients, setClients] = useState<ClientOption[]>([]);

  useEffect(() => {
    if (!workspaceId) {
      setClients([]);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("clients")
          .select("id,name")
          .eq("workspace_id", workspaceId)
          .order("name", { ascending: true });
        if (active) setClients((data ?? []) as ClientOption[]);
      } catch {
        if (active) setClients([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [workspaceId]);

  return clients;
}
