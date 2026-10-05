"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Feedback({ page }: { page: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(helpful: boolean) {
    setError(null);
    setBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error: insertError } = await supabase
        .from("docs_feedback")
        .insert({ page, helpful, user_id: session?.user.id ?? null });

      if (insertError) throw insertError;
      setDone(true);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Could not record that.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 rounded-xl border border-[#E2D8E0] bg-white p-5 dark:border-[#4A2E46] dark:bg-[#221C21]">
      {done ? (
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          Thanks — feedback recorded.
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-[#151115] dark:text-[#F8F4F7]">
            Was this helpful?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => send(true)}
              disabled={busy}
              className="rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => send(false)}
              disabled={busy}
              className="rounded-lg border border-[#E2D8E0] px-4 py-2 text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg disabled:opacity-50 dark:border-[#4A2E46] dark:text-[#F8F4F7]"
            >
              No
            </button>
          </div>
        </>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
