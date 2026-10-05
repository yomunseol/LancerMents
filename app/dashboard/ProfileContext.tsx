"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { canonicalPlan, type CanonicalPlan } from "@/lib/profile";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  business_type: string | null;
  plan_type: string | null;
  locale: string | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  planType: string | null;
  planCanonical: CanonicalPlan | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name,business_type,plan_type,locale")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      setProfile(
        (data as Profile | null) ?? {
          id: user.id,
          email: user.email ?? null,
          display_name: null,
          business_type: null,
          plan_type: null,
          locale: null,
        },
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refetch whenever the route changes so tier locks follow the profile.
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      planType: profile?.plan_type ?? null,
      planCanonical: canonicalPlan(profile?.plan_type ?? null),
      loading,
      error,
      refresh,
      refreshProfile: refresh,
    }),
    [profile, loading, error, refresh],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }
  return context;
}
