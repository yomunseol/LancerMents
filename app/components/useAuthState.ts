"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AuthState = "guest" | "authed";

/**
 * Shared auth detection for the navbar and landing CTAs.
 * Starts as guest (matching the server render) and resolves after mount.
 */
export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>("guest");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (active) setState(user ? "authed" : "guest");
      } catch {
        if (active) setState("guest");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
