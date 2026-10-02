import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    typeof url !== "string" ||
    !/^https?:\/\//.test(url) ||
    url === "your_supabase_url" ||
    typeof anonKey !== "string" ||
    anonKey.length === 0 ||
    anonKey === "your_supabase_anon_key"
  ) {
    return null;
  }

  return { url, anonKey };
}

const config = readSupabaseConfig();

export const isSupabaseConfigured = config !== null;

export const supabase: SupabaseClient | null = config
  ? createClient(config.url, config.anonKey)
  : null;
