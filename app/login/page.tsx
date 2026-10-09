"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/70 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#151115] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/70 dark:focus:ring-[#D8A8D3]";
const primaryButtonClass =
  "w-full rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [fb, setFb] = useState<FeedbackState>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("error");
    if (authError === "auth-code-error") {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: "We couldn't verify that sign-in link. Please log in again.",
      });
    } else if (authError === "missing-code") {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: "That link is missing its verification code. Please try again.",
      });
    }
  }, []);

  async function routeAfterAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("business_type,plan_type")
        .eq("id", user.id)
        .maybeSingle();

      const business = (data as { business_type?: string | null } | null)?.business_type;
      const plan = (data as { plan_type?: string | null } | null)?.plan_type;

      router.push(business && plan ? "/dashboard" : "/onboarding");
    } catch {
      router.push("/dashboard");
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = supabase;

    setLoading(true);
    setFb(null);

    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setFb({ kind: "error", label: t("err_save"), raw: rawReason(signInError) });
      return;
    }

    const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const { data: factors } = await client.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];

      setLoading(false);

      if (!totp) {
          await routeAfterAuth();
        return;
      }

      setFactorId(totp.id);
      setStep("mfa");
      return;
    }

    setLoading(false);
      await routeAfterAuth();
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = supabase;

    setLoading(true);
    setFb(null);

    const { data: challenge, error: challengeError } =
      await client.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setLoading(false);
      setFb({ kind: "error", label: t("err_save"), raw: rawReason(challengeError) });
      return;
    }

    const { error: verifyError } = await client.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    setLoading(false);

    if (verifyError) {
      setFb({ kind: "error", label: t("err_save"), raw: rawReason(verifyError) });
      return;
    }

      await routeAfterAuth();
  }

  return (
    <div className="mx-auto mt-20 max-w-md rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
      {step === "credentials" ? (
        <>
          <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Log in to your workspace.
          </p>

          <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-[#151115] dark:text-[#F8F4F7]">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-[#151115] dark:text-[#F8F4F7]">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={fieldClass}
              />
            </label>

            <button type="submit" disabled={loading} className={primaryButtonClass}>
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>

          {fb && (
            <div className="mt-4">
              <FeedbackBanner
                kind={fb.kind}
                label={fb.label}
                raw={fb.raw}
                onRetry={fb.onRetry}
              />
            </div>
          )}

          <p className="mt-6 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Need an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
            >
              Sign up
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            Two-factor authentication
          </h1>
          <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Enter the 6-digit code from your authenticator app.
          </p>

          <form onSubmit={handleVerify} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-[#151115] dark:text-[#F8F4F7]">
              6-digit code
              <input
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                className={fieldClass}
              />
            </label>
            <button type="submit" disabled={loading} className={primaryButtonClass}>
              {loading ? "Verifying…" : "Verify"}
            </button>
          </form>

          {fb && (
            <div className="mt-4">
              <FeedbackBanner
                kind={fb.kind}
                label={fb.label}
                raw={fb.raw}
                onRetry={fb.onRetry}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep("credentials")}
            className="mt-6 text-sm font-medium text-[#151115]/70 hover:opacity-70 dark:text-[#F8F4F7]/70"
          >
            Back to login
          </button>
        </>
      )}
    </div>
  );
}
