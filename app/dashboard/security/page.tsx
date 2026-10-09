"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import type { SessionRow } from "@/lib/sessions";
import { isSessionRevoked, relativeTime, trackSession, touchSession } from "@/lib/sessions";
import PasswordStrengthBar, {
  getPasswordStrength,
} from "@/app/components/PasswordStrengthBar";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";

type Method = "none" | "email" | "totp";
type Stage = "idle" | "confirm" | "verify";

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[#E2D8E0] py-6 first:pt-0 last:border-b-0 last:pb-0 dark:border-[#4A2E46]">
      <h2 className="text-sm font-semibold uppercase tracking-widest opacity-60">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SecurityPage() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwFb, setPwFb] = useState<FeedbackState>(null);

  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [mode, setMode] = useState<Method>("none");
  const [selected, setSelected] = useState<Method | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [confirmNone, setConfirmNone] = useState(false);
  const [fb, setFb] = useState<FeedbackState>(null);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = useCallback<() => Promise<void>>(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error: loadError } = await supabase
        .from("session_ledger")
        .select("session_id,device,browser,os,location,ip,last_active,revoked")
        .eq("user_id", session.user.id)
        .order("last_active", { ascending: false });
      if (loadError) throw loadError;
      setSessions((data ?? []) as SessionRow[]);
    } catch (loadError) {
      setFb({
        kind: "error",
        label: t("err_load"),
        raw: rawReason(loadError),
        onRetry: loadSessions,
      });
    }
  }, []);

  const loadSecurity = useCallback<() => Promise<void>>(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      setSessionId(session.access_token);
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("mfa_method")
        .eq("id", session.user.id)
        .maybeSingle();
      const method = ((profile as { mfa_method?: string | null } | null)?.mfa_method ??
        "none") as Method;
      setMode(method);

      if (method === "totp") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.find((factor) => factor.status === "verified");
        setFactorId(totp?.id ?? "");
      }

      await trackSession(session.access_token, session.user.id);
      await loadSessions();
    } catch (loadError) {
      setFb({
        kind: "error",
        label: t("err_load"),
        raw: rawReason(loadError),
        onRetry: loadSecurity,
      });
    }
  }, [loadSessions]);

  useEffect(() => {
    void loadSecurity();
  }, [loadSecurity]);

  // Heartbeat: refresh last_active on load, every 5 minutes, and on route change.
  useEffect(() => {
    if (!sessionId) return;
    touchSession(sessionId);
    const interval = setInterval(() => touchSession(sessionId), 300000);
    return () => clearInterval(interval);
  }, [sessionId, pathname]);

  // Revoked enforcement: focus + every 60s.
  useEffect(() => {
    if (!sessionId) return;
    const check = async () => {
      if (await isSessionRevoked(sessionId)) {
        await supabase.auth.signOut();
        window.location.replace("/login?revoked=1");
      }
    };
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(() => void check(), 60000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [sessionId]);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwFb(null);

    if (newPassword !== confirmPassword) {
      setPwFb({ kind: "error", label: t("passwords_mismatch") });
      return;
    }
    if (getPasswordStrength(newPassword) < 3) {
      setPwFb({
        kind: "error",
        label: "Please choose a stronger password (at least Moderate).",
      });
      return;
    }

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
      setPwFb({ kind: "success", label: t("saved") });
    } catch (changeError) {
      setPwFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(changeError),
      });
    }
  }

  function chooseMethod(next: Method) {
    if (next === mode) return;
    setFb(null);
    setCode("");
    setQr("");
    setSecret("");
    setConfirmNone(false);
    setSelected(next);
    setStage(next === "none" ? "confirm" : "confirm");
    setPassword("");
  }

  async function handleConfirmPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFb(null);
    if (!selected) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Your session expired. Please sign in again.");

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (reauthError) throw new Error("Incorrect password.");

      setPassword("");

      if (selected === "none") {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ mfa_method: "none" })
          .eq("id", userId);
        if (updateError) throw updateError;

        if (factorId) await supabase.auth.mfa.unenroll({ factorId });
        await supabase.from("session_2fa").delete().eq("user_id", userId);

        setMode("none");
        setFactorId("");
        setStage("idle");
        setFb({ kind: "success", label: t("saved") });
        return;
      }

      if (selected === "email") {
        const { error: rpcError } = await supabase.rpc("request_2fa_code", {
          p_locale: locale,
        });
        if (rpcError) throw rpcError;
        setStage("verify");
        return;
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (enrollError) throw enrollError;
      setFactorId(enrolled.id);
      setQr(enrolled.totp?.qr_code ?? "");
      setSecret(enrolled.totp?.secret ?? "");
      setStage("verify");
    } catch (confirmError) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(confirmError),
      });
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFb(null);

    try {
      if (selected === "email") {
        const { data, error: rpcError } = await supabase.rpc("verify_2fa_code", {
          p_code: code,
          p_session_id: sessionId,
        });
        if (rpcError) throw rpcError;
        if (data !== true) {
          setFb({ kind: "error", label: t("invalid_code") });
          return;
        }
      } else {
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
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ mfa_method: selected })
        .eq("id", userId);
      if (updateError) throw updateError;

      setMode(selected === "totp" ? "totp" : "email");
      setStage("idle");
      setCode("");
      setQr("");
      setSecret("");
      setFb({ kind: "success", label: t("saved") });
    } catch (codeError) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(codeError),
      });
    }
  }

  async function revoke(id: string) {
    setFb(null);
    setRevoking(id);
    try {
      const { error: revokeError } = await supabase
        .from("session_ledger")
        .update({ revoked: true })
        .eq("session_id", id);
      if (revokeError) throw revokeError;
      setTimeout(() => {
        setSessions((current) => current.filter((row) => row.session_id !== id));
        setRevoking(null);
      }, 200);
    } catch (revokeError) {
      setRevoking(null);
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(revokeError),
      });
    }
  }

  async function signOutAll() {
    setFb(null);
    try {
      await supabase.auth.signOut({ scope: "others" });
      if (userId) {
        await supabase
          .from("session_ledger")
          .update({ revoked: true })
          .eq("user_id", userId)
          .neq("session_id", sessionId);
      }
      await loadSessions();
    } catch (signOutError) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(signOutError),
      });
    }
  }

  const METHODS: { id: Method; title: string; sub: string }[] = [
    { id: "none", title: t("method_none"), sub: "Password only. Not recommended." },
    { id: "email", title: t("method_email"), sub: "A 6-digit code emailed in your language at each login." },
    { id: "totp", title: t("method_totp"), sub: "TOTP codes from Google Authenticator / Authy." },
  ];

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">{t("security")}</h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {t("two_factor")}, {t("change_password")}, {t("sessions")}.
      </p>

      <div className="mt-8 max-w-2xl rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
        <SectionCard title={t("change_password")}>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t("password")} className={fieldClass} />
            <input type="password" required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={`${t("password")} (new)`} className={fieldClass} />
            <PasswordStrengthBar password={newPassword} />
            <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("confirm_password")} className={fieldClass} />
            {pwFb && (
              <FeedbackBanner
                kind={pwFb.kind}
                label={pwFb.label}
                raw={pwFb.raw}
                onRetry={pwFb.onRetry}
              />
            )}
            <button type="submit" className="w-full rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 sm:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]">
              {t("save")}
            </button>
          </form>
        </SectionCard>

        <SectionCard title={t("two_factor")}>
          {fb && (
            <FeedbackBanner
              kind={fb.kind}
              label={fb.label}
              raw={fb.raw}
              onRetry={fb.onRetry}
            />
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {METHODS.map((option) => {
              const active = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => chooseMethod(option.id)}
                  aria-pressed={active}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    active
                      ? "border-2 border-[#85587D] dark:border-[#D8A8D3]"
                      : "border-[#E2D8E0] dark:border-[#4A2E46]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
                      {option.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        active
                          ? "bg-green-500/15 text-green-600 dark:text-green-400"
                          : "bg-red-500/15 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {active ? "Enabled" : "Disabled"}
                    </span>
                  </span>
                  <span className="mt-2 block text-xs opacity-70">{option.sub}</span>
                </button>
              );
            })}
          </div>

          {stage === "confirm" && selected && (
            <form onSubmit={handleConfirmPassword} className="mt-4 flex flex-col gap-3">
              <p className="text-sm opacity-70">
                Confirm your password to switch to {METHODS.find((m) => m.id === selected)?.title}.
              </p>
              {selected === "none" && !confirmNone ? (
                <button type="button" onClick={() => setConfirmNone(true)} className="w-full rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 sm:w-auto dark:text-red-400">
                  {t("sure")}
                </button>
              ) : (
                <>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")} className={fieldClass} />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]">
                      {t("continue")}
                    </button>
                    <button type="button" onClick={() => { setStage("idle"); setSelected(null); setPassword(""); }} className="rounded-lg border border-[#E2D8E0] px-4 py-2 text-sm font-semibold transition-all duration-200 dark:border-[#4A2E46]">
                      {t("cancel")}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {stage === "verify" && (
            <form onSubmit={submitCode} className="mt-4 flex flex-col gap-3">
              {qr && (
                <img src={qr} alt="Authenticator QR code" className="h-36 w-36 rounded-lg border border-[#E2D8E0] bg-white p-2 dark:border-[#4A2E46]" />
              )}
              {secret && (
                <div className="flex items-center gap-2">
                  <code className="break-all text-xs opacity-70">{secret}</code>
                  <button type="button" onClick={() => void navigator.clipboard.writeText(secret)} className="rounded-lg border border-[#E2D8E0] px-3 py-1.5 text-xs font-semibold transition-all duration-200 dark:border-[#4A2E46]">
                    Copy
                  </button>
                </div>
              )}
              <input inputMode="numeric" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" className={fieldClass} />
              <button type="submit" className="w-full rounded-lg bg-[#85587D] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 sm:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]">
                {t("continue")}
              </button>
            </form>
          )}
        </SectionCard>

        <SectionCard title={t("sessions")}>
          <ul className="flex flex-col gap-3">
            {sessions.map((row) => {
              const isCurrent = row.session_id === sessionId;
              return (
                <li
                  key={row.session_id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border border-[#E2D8E0] px-4 py-3 transition-all duration-200 dark:border-[#4A2E46] ${
                    revoking === row.session_id ? "scale-95 opacity-0" : "scale-100 opacity-100"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
                      {row.device ?? "Device"}
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-[#85587D]/15 px-2 py-0.5 text-xs font-medium text-[#85587D] dark:bg-[#D8A8D3]/15 dark:text-[#D8A8D3]">
                          {t("this_device")}
                        </span>
                      )}
                    </p>
                    <p className="text-xs opacity-60">
                      {row.browser ?? "—"} • {row.location ?? "Unknown location"} • {relativeTime(row.last_active)}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => revoke(row.session_id)}
                      className="rounded-lg border border-[#E2D8E0] px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:shadow-lg dark:border-[#4A2E46]"
                    >
                      {t("revoke")}
                    </button>
                  )}
                </li>
              );
            })}
            {sessions.length === 0 && (
              <li className="text-sm opacity-60">{t("loading")}</li>
            )}
          </ul>

          <button
            type="button"
            onClick={signOutAll}
            className="mt-4 w-full rounded-lg border border-[#E2D8E0] px-4 py-2.5 text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg sm:w-auto dark:border-[#4A2E46] dark:text-[#F8F4F7]"
          >
            {t("sign_out_all")}
          </button>
        </SectionCard>
      </div>
    </>
  );
}
