"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useProfile } from "../ProfileContext";

const BUSINESS_TYPES = [
  { id: "content-creator", label: "Content Creator" },
  { id: "freelance-artist", label: "Freelance Artist" },
  { id: "sole-entrepreneur", label: "Sole Entrepreneur" },
  { id: "team-company", label: "Team Company" },
];

const LOCALES = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
];

const PLAN_LABELS: Record<string, { name: string; price: string }> = {
  "engine-room": { name: "The Engine Room", price: "$9/mo" },
  pipeline: { name: "The Pipeline", price: "$19/mo" },
  studio: { name: "The Studio", price: "$49/mo" },
};

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:focus:ring-[#D8A8D3]";

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[#E2D8E0] py-6 first:pt-0 last:border-b-0 last:pb-0 dark:border-[#4A2E46]">
      <h2 className="text-sm font-semibold uppercase tracking-widest opacity-60">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, refresh } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [locale, setLocale] = useState("en");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    if (profile?.locale) setLocale(profile.locale);
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, [profile?.display_name, profile?.locale]);

  const save = useCallback(
    async (patch: Record<string, string>) => {
      setStatus(null);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Your session expired. Please sign in again.");
        const { error: updateError } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", user.id);
        if (updateError) throw updateError;
        await refresh();
        setStatus("Saved.");
      } catch (saveError) {
        setError(messageOf(saveError, "Could not save your profile."));
      }
    },
    [refresh],
  );

  function chooseLocale(code: string) {
    setLocale(code);
    document.cookie = `lm_locale=${code}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem("lancermonts.locale", code);
    save({ locale: code });
    router.refresh();
  }

  const initials = (displayName || email || "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const plan = profile?.plan_type ? PLAN_LABELS[profile.plan_type] : undefined;

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">Profile</h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        Your identity, plan, and preferences.
      </p>

      <div className="mt-8 max-w-2xl rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
        <SectionCard title="Identity">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#85587D] text-lg font-bold text-white dark:bg-[#D8A8D3] dark:text-[#151115]">
              {initials || "?"}
            </span>
            <div className="flex-1">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name"
                className={fieldClass}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => save({ display_name: displayName })}
            className="mt-3 rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
          >
            Save name
          </button>
          <p className="mt-4 text-xs uppercase tracking-widest opacity-60">Email</p>
          <p className="mt-1 text-sm text-[#151115] dark:text-[#F8F4F7]">{email || "—"}</p>
        </SectionCard>

        <SectionCard title="Business type">
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((type) => {
              const selected = profile?.business_type === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => save({ business_type: type.id })}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    selected
                      ? "bg-[#85587D] text-white dark:bg-[#D8A8D3] dark:text-[#151115]"
                      : "border border-[#E2D8E0] text-[#151115]/80 hover:border-[#85587D] dark:border-[#4A2E46] dark:text-[#F8F4F7]/80 dark:hover:border-[#D8A8D3]"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Plan">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#85587D] p-4 dark:border-[#D8A8D3]">
            <div>
              <p className="text-base font-semibold text-[#151115] dark:text-[#F8F4F7]">
                {plan?.name ?? "No plan selected"}
              </p>
              <p className="text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
                {plan?.price ?? "Free during Beta"}
              </p>
            </div>
            <Link
              href="/onboarding"
              className="rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              Change plan
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Language">
          <select
            value={locale}
            onChange={(event) => chooseLocale(event.target.value)}
            className={fieldClass}
          >
            {LOCALES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </SectionCard>

        {status && (
          <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">{status}</p>
        )}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    </>
  );
}
