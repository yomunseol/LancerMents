"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/70 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#151115] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/70 dark:focus:ring-[#D8A8D3]";
const primaryButtonClass =
  "w-full rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = supabase;
    if (!client) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    const { data, error: signUpError } = await client.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setLoading(false);
      setNotice(
        "Check your inbox to confirm your email, then sign in to finish setting up 2FA.",
      );
      return;
    }

    const { data: enrolled, error: enrollError } = await client.auth.mfa.enroll({
      factorType: "totp",
    });

    setLoading(false);

    if (enrollError) {
      setError(enrollError.message);
      return;
    }

    setFactorId(enrolled.id);
    setQrCode(enrolled.totp?.qr_code ?? "");
    setSecret(enrolled.totp?.secret ?? "");
    setStep("mfa");
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = supabase;
    if (!client) return;

    setLoading(true);
    setError(null);

    const { data: challenge, error: challengeError } =
      await client.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setLoading(false);
      setError(challengeError.message);
      return;
    }

    const { error: verifyError } = await client.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="mx-auto mt-20 max-w-md rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
      {step === "credentials" ? (
        <>
          <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Start free during Beta. No card required.
          </p>

          <form onSubmit={handleSignup} className="mt-6 flex flex-col gap-4">
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
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={fieldClass}
              />
            </label>

            <button type="submit" disabled={loading} className={primaryButtonClass}>
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>

          {notice && (
            <p className="mt-4 text-sm text-[#85587D] dark:text-[#D8A8D3]">
              {notice}
            </p>
          )}
          {error && (
            <p className="mt-4 text-sm text-[#85587D] dark:text-[#D8A8D3]">
              {error}
            </p>
          )}

          <p className="mt-6 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
            >
              Log in
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            Secure your account
          </h1>
          <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Scan this with your authenticator app, then enter the 6-digit code.
          </p>

          {qrCode && (
            <img
              src={qrCode}
              alt="Authenticator QR code"
              className="mx-auto mt-6 h-40 w-40 rounded-lg border border-[#E2D8E0] bg-white p-2 dark:border-[#4A2E46]"
            />
          )}
          {secret && (
            <p className="mt-3 break-all text-center text-xs text-[#151115]/70 dark:text-[#F8F4F7]/70">
              Secret: {secret}
            </p>
          )}

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
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-[#85587D] dark:text-[#D8A8D3]">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
