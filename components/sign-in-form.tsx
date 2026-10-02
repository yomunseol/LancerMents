"use client";

import { useState, type FormEvent } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function SignInForm({ redirectPath }: { redirectPath?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setStatus(
        "Supabase is not configured. Add your project credentials to .env.local.",
      );
      return;
    }

    setLoading(true);
    setStatus(null);

    const emailRedirectTo =
      redirectPath && typeof window !== "undefined"
        ? new URL(redirectPath, window.location.origin).toString()
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });

    setLoading(false);
    setStatus(error ? error.message : "Check your inbox for a sign-in link.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-5 rounded-lg border border-deep-border bg-surface p-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-primary-text">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-md border border-deep-border bg-background px-4 py-2 text-primary-text placeholder:text-primary-text/70 focus:border-accent-mauve focus:outline-none focus:ring-1 focus:ring-accent-mauve"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-accent-mauve px-4 py-2 font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending…" : "Sign In with Email"}
      </button>

      {!isSupabaseConfigured && (
        <p className="text-xs text-accent-mauve">
          Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.
        </p>
      )}

      {status && <p className="text-sm text-primary-text/70">{status}</p>}
    </form>
  );
}
