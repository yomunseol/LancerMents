"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import PasswordStrengthBar, {
  getPasswordStrength,
} from "@/app/components/PasswordStrengthBar";

type Session = {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
};

const INITIAL_SESSIONS: Session[] = [
  {
    id: "s1",
    device: "MacBook Pro",
    browser: "Chrome 130",
    location: "Seoul, KR",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "s2",
    device: "iPhone 15",
    browser: "Safari",
    location: "Seoul, KR",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: "s3",
    device: "Windows PC",
    browser: "Edge",
    location: "Busan, KR",
    lastActive: "3 days ago",
    current: false,
  },
];

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]";

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#E2D8E0] py-6 first:pt-0 last:border-b-0 last:pb-0 dark:border-[#4A2E46]">
      <h2 className="text-sm font-semibold uppercase tracking-widest opacity-60">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [tfaError, setTfaError] = useState<string | null>(null);
  const [tfaLoading, setTfaLoading] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const verified = data?.totp?.find((factor) => factor.status === "verified");
        if (verified) {
          setTwoFactorEnabled(true);
          setFactorId(verified.id);
        }
      } catch {
        /* status simply stays Disabled */
      }
    })();
  }, []);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    if (getPasswordStrength(newPassword) < 3) {
      setPwError("Please choose a stronger password (at least Moderate).");
      return;
    }

    setPwLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Your session expired. Please sign in again.");

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) throw new Error("Your current password is incorrect.");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwSuccess("Password updated.");
    } catch (error) {
      setPwError(messageOf(error, "Could not update your password."));
    } finally {
      setPwLoading(false);
    }
  }

  async function handleEnable2fa() {
    setTfaError(null);
    setTfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setFactorId(data.id);
      setQr(data.totp?.qr_code ?? "");
      setSecret(data.totp?.secret ?? "");
    } catch (error) {
      setTfaError(messageOf(error, "Could not start 2FA setup."));
    } finally {
      setTfaLoading(false);
    }
  }

  async function handleVerify2fa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTfaError(null);
    setTfaLoading(true);
    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      setTwoFactorEnabled(true);
      setQr("");
      setSecret("");
      setCode("");
    } catch (error) {
      setTfaError(messageOf(error, "That code didn't work. Try again."));
    } finally {
      setTfaLoading(false);
    }
  }

  async function handleDisable2fa() {
    setTfaError(null);
    setTfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setTwoFactorEnabled(false);
      setFactorId("");
      setConfirmDisable(false);
    } catch (error) {
      setTfaError(messageOf(error, "Could not disable 2FA."));
    } finally {
      setTfaLoading(false);
    }
  }

  function handleRevoke(id: string) {
    setRevokeId(null);
    setLeavingId(id);
    setTimeout(() => {
      setSessions((current) => current.filter((session) => session.id !== id));
      setLeavingId(null);
    }, 200);
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        Security
      </h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        Manage your password, two-factor authentication, and devices.
      </p>

      <div className="mt-8 max-w-2xl rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
        <SectionCard title="Change password">
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              className={fieldClass}
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              className={fieldClass}
            />
            <PasswordStrengthBar password={newPassword} />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              className={fieldClass}
            />

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              {pwLoading ? "Updating…" : "Update password"}
            </button>

            {pwSuccess && (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {pwSuccess}
              </p>
            )}
            {pwError && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {pwError}
              </p>
            )}
          </form>
        </SectionCard>

        <SectionCard title="Two-factor authentication">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                twoFactorEnabled
                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                  : "bg-red-500/15 text-red-600 dark:text-red-400"
              }`}
            >
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>

            {!twoFactorEnabled && !qr && (
              <button
                type="button"
                onClick={handleEnable2fa}
                disabled={tfaLoading}
                className="rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]"
              >
                {tfaLoading ? "Starting…" : "Enable 2FA"}
              </button>
            )}

            {twoFactorEnabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDisable(true)}
                  className="rounded-lg border border-[#E2D8E0] px-4 py-2 text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
                >
                  Disable 2FA
                </button>
                {confirmDisable && (
                  <button
                    type="button"
                    onClick={handleDisable2fa}
                    disabled={tfaLoading}
                    className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-600 transition-all duration-200 disabled:opacity-50 dark:text-red-400"
                  >
                    Sure?
                  </button>
                )}
              </div>
            )}
          </div>

          {!twoFactorEnabled && qr && (
            <form onSubmit={handleVerify2fa} className="mt-4 flex flex-col gap-3">
              <img
                src={qr}
                alt="Authenticator QR code"
                className="h-36 w-36 rounded-lg border border-[#E2D8E0] bg-white p-2 dark:border-[#4A2E46]"
              />
              {secret && (
                <p className="break-all text-xs opacity-60">Secret: {secret}</p>
              )}
              <input
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6-digit code"
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={tfaLoading}
                className="w-full rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
              >
                {tfaLoading ? "Verifying…" : "Verify & enable"}
              </button>
            </form>
          )}

          {tfaError && (
            <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
              {tfaError}
            </p>
          )}
        </SectionCard>

        <SectionCard title="Active sessions">
          <ul className="flex flex-col gap-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border border-[#E2D8E0] bg-white px-4 py-3 transition-all duration-200 dark:border-[#4A2E46] dark:bg-[#221C21] ${
                  leavingId === session.id ? "scale-95 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
                    {session.device}
                    {session.current && (
                      <span className="ml-2 rounded-full bg-[#85587D]/15 px-2 py-0.5 text-xs font-medium text-[#85587D] dark:bg-[#D8A8D3]/15 dark:text-[#D8A8D3]">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-xs opacity-60">
                    {session.browser} · {session.location} · {session.lastActive}
                  </p>
                </div>

                {!session.current && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRevokeId(session.id)}
                      className="rounded-lg border border-[#E2D8E0] px-3 py-1.5 text-xs font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
                    >
                      Revoke
                    </button>
                    {revokeId === session.id && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(session.id)}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all duration-200 dark:text-red-400"
                      >
                        Sure?
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
