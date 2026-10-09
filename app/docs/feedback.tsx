"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";

export default function Feedback({ page }: { page: string }) {
  const t = useTranslations();
  const [done, setDone] = useState(false);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [busy, setBusy] = useState(false);

  async function send(helpful: boolean) {
    setFb(null);
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
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(sendError),
      });
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
      {fb?.kind === "error" && (
        <div className="mt-2">
          <FeedbackBanner kind={fb.kind} label={fb.label} raw={fb.raw} />
        </div>
      )}
    </section>
  );
}
