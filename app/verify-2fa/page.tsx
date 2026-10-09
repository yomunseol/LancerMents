"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";

export default function Verify2faPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [method, setMethod] = useState<"email" | "totp" | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [fb, setFb] = useState<FeedbackState>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/dashboard";
      setNextPath(next);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }
        setSessionId(session.access_token);

        const { data: profile } = await supabase
          .from("profiles")
          .select("mfa_method")
          .eq("id", session.user.id)
          .maybeSingle();

        const m = ((profile as { mfa_method?: string | null } | null)?.mfa_method) ?? "none";

        if (m === "none") {
          router.replace(next);
          return;
        }

        setMethod(m === "totp" ? "totp" : "email");

        if (m === "totp") {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totp = factors?.totp?.find((factor) => factor.status === "verified");
          setFactorId(totp?.id ?? "");
        }
      } catch (loadError) {
        setFb({
          kind: "error",
          label: t("err_load"),
          raw: rawReason(loadError),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    setFb(null);
    try {
      const { error: rpcError } = await supabase.rpc("request_2fa_code", {
        p_locale: locale,
      });
      if (rpcError) throw rpcError;
      setSent(true);
      setCooldown(30);
    } catch (sendError) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(sendError),
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFb(null);
    setLoading(true);

    try {
      if (method === "email") {
        const { data, error: rpcError } = await supabase.rpc("verify_2fa_code", {
          p_code: code,
          p_session_id: sessionId,
        });
        if (rpcError) throw rpcError;
        if (data === true) {
          router.replace(nextPath);
          return;
        }
        setFb({ kind: "error", label: t("invalid_code") });
      } else if (method === "totp") {
        const { data: challenge, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code,
        });
        if (verifyError) {
          setFb({ kind: "error", label: t("invalid_code") });
          return;
        }
        router.replace(nextPath);
      } else {
        router.replace(nextPath);
      }
    } catch (submitError) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(submitError),
      });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full max-w-[280px] mx-auto rounded-xl border border-[#E2D8E0] bg-[#F8F4F7] px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] text-[#151115] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#151115] dark:text-[#F8F4F7] dark:focus:ring-[#D8A8D3]";

  return (
    <main className="mx-auto mt-20 max-w-md rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
          {t("verify_title")}
        </h1>
        <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
          {t("verify_subtitle")}
        </p>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm opacity-50">{t("loading")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center gap-4">
          {method === "email" && !sent && (
            <button
              type="button"
              onClick={sendCode}
              className="w-full max-w-[280px] rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              {t("resend")}
            </button>
          )}

          {(method === "totp" || sent) && (
            <>
              <input
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="000000"
                className={inputClass}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full max-w-[280px] rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]"
              >
                {t("continue")}
              </button>
            </>
          )}

          {method === "email" && sent && (
            <button
              type="button"
              onClick={sendCode}
              disabled={cooldown > 0}
              className="text-sm font-medium text-[#85587D] transition-all duration-200 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#D8A8D3]"
            >
              {cooldown > 0 ? `${t("resend")} (${cooldown}s)` : t("resend")}
            </button>
          )}

          {fb && (
            <FeedbackBanner
              kind={fb.kind}
              label={fb.label}
              raw={fb.raw}
              onRetry={fb.onRetry}
            />
          )}
        </form>
      )}
    </main>
  );
}
