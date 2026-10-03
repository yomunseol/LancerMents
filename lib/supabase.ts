import { createBrowserClient } from "@supabase/ssr";

// ---------------------------------------------------------------------------
// PASTE YOUR SUPABASE KEYS HERE TO BYPASS ENV VARS
// ---------------------------------------------------------------------------
export const SUPABASE_URL = "https://kjbgvdchtvoisogdzghu.supabase.co";
export const SUPABASE_ANON_KEY =
  "sb_publishable_JBayD_9oWDOIM9XquhT7_w_jtbrkOMZ";
// ---------------------------------------------------------------------------

export const isSupabaseConfigured: boolean =
  /^https?:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 0;

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
