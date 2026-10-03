import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

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

if (!config) {
  console.error(
    "[LancerMents] Supabase is not configured. NEXT_PUBLIC_SUPABASE_URL and/or " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or still placeholders. Add them " +
      "to .env.local (and to your hosting provider's environment variables), then " +
      "rebuild. The app will keep running, but auth and data calls are disabled.",
  );
}

export const isSupabaseConfigured = config !== null;

export const supabase: SupabaseClient | null = config
  ? createBrowserClient(config.url, config.anonKey)
  : null;
