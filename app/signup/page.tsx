"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import PasswordStrengthBar, {
  getPasswordStrength,
} from "../components/PasswordStrengthBar";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/70 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#151115] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/70 dark:focus:ring-[#D8A8D3]";
const primaryButtonClass =
  "w-full rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]";
const otpInputClass =
  "w-full max-w-[280px] mx-auto rounded-xl border border-[#E2D8E0] bg-[#F8F4F7] px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] text-[#151115] outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#151115] dark:text-[#F8F4F7] dark:focus:ring-[#D8A8D3]";

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [fb, setFb] = useState<FeedbackState>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFb(null);

    if (password !== confirmPassword) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: "Passwords do not match.",
      });
      return;
    }

    if (getPasswordStrength(password) < 3) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: "Please choose a stronger password (at least Moderate).",
      });
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setFb({ kind: "error", label: t("err_save"), raw: rawReason(signUpError) });
      return;
    }

    setStep("otp");
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFb(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "signup",
    });

    setLoading(false);

    if (verifyError) {
      setFb({ kind: "error", label: t("err_save"), raw: rawReason(verifyError) });
      return;
    }

    router.push("/onboarding");
  }

  async function handleResend() {
    if (resendIn > 0) return;
    setFb(null);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setFb({ kind: "error", label: t("err_save"), raw: rawReason(resendError) });
      return;
    }

    setResendIn(30);
    setFb({ kind: "success", label: t("saved") });
  }

  return (
    <div className="mx-auto mt-20 max-w-md rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
      {step === "credentials" ? (
        <>
          <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            {t("signup_title")}
          </h1>
          <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            {t("signup_sub")}
          </p>

          <form onSubmit={handleSignup} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-[#151115] dark:text-[#F8F4F7]">
              {t("email")}
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
              {t("password")}
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={fieldClass}
              />
            </label>
            <PasswordStrengthBar password={password} />
            <label className="flex flex-col gap-1 text-sm font-medium text-[#151115] dark:text-[#F8F4F7]">
              {t("confirm_password")}
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                className={fieldClass}
              />
            </label>

            <button
              type="submit"
              disabled={loading || getPasswordStrength(password) < 3}
              className={primaryButtonClass}
            >
              {loading ? "Creating account…" : "Sign Up"}
            </button>

            {fb && (
              <FeedbackBanner
                kind={fb.kind}
                label={fb.label}
                raw={fb.raw}
                onRetry={fb.onRetry}
              />
            )}
          </form>

          <p className="mt-6 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
            >
              {t("login")}
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
              {t("verify_title")}
            </h1>
            <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-[#151115] dark:text-[#F8F4F7]">
                {email}
              </span>
              . Enter it below to verify.
            </p>
          </div>

          <form
            onSubmit={handleVerify}
            className="mt-6 flex flex-col items-center gap-4"
          >
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              placeholder="000000"
              className={otpInputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[280px] rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>

            {fb && (
              <FeedbackBanner
                kind={fb.kind}
                label={fb.label}
                raw={fb.raw}
                onRetry={fb.onRetry}
              />
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendIn > 0}
              className="text-sm font-medium text-[#85587D] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#D8A8D3]"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s...` : "Didn't get the code? Resend"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
