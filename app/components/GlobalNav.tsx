"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { saveProfile } from "@/lib/profile";
import { getStoredTheme, resolveDark, setTheme, type ThemeMode } from "@/lib/theme";
import { LOCALE_LABELS, LOCALE_ORDER } from "@/lib/i18n/vocab";

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 6.5C10.5 5 8.5 4.5 6 4.5H4v13h2c2.5 0 4.5.5 6 2 1.5-1.5 3.5-2 6-2h2v-13h-2c-2.5 0-4.5.5-6 2Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2D8E0] text-[#151115] transition-all duration-200 hover:bg-[#85587D]/10 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10 dark:focus:ring-[#D8A8D3]";

export default function GlobalNav() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale();

  const [plan, setPlan] = useState<"guest" | "authed">("guest");
  const [initials, setInitials] = useState("");
  const [dark, setDark] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredTheme();
    setDark(resolveDark(stored));

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setPlan("guest");
          return;
        }
        setPlan("authed");

        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        const name =
          (data as { display_name?: string | null } | null)?.display_name ??
          user.email ??
          "";
        setInitials(
          name
            .split(/[\s@.]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "?",
        );
      } catch {
        setPlan("guest");
      }
    })();
  }, []);

  useEffect(() => {
    if (!langOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLangOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [langOpen]);

  function chooseLocale(code: string) {
    document.cookie = `lm_locale=${code}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem("lancermonts.locale", code);
    setLangOpen(false);

    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!data.user) return;
        const result = await saveProfile(data.user.id, { locale: code });
        if (!result.ok) throw new Error(result.error);
        return result;
      })
      .catch(() => undefined);

    router.refresh();
  }

  function toggleTheme() {
    const next: ThemeMode = dark ? "light" : "dark";
    setDark(!dark);
    setTheme(next);
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#E2D8E0] bg-white/80 px-6 backdrop-blur transition-colors duration-200 dark:border-[#4A2E46] dark:bg-[#151115]/80">
      <Link href="/" className="flex items-center gap-3">
        <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-[#E2D8E0] transition-transform duration-200 hover:scale-105 dark:ring-[#4A2E46]">
          <img
            src="/LancerMents-Light.png"
            alt="LancerMents"
            className="block h-full w-full object-cover dark:hidden"
          />
          <img
            src="/LancerMents-Dark.png"
            alt="LancerMents"
            className="hidden h-full w-full object-cover dark:block"
          />
        </span>
        <span className="text-xl font-extrabold tracking-tight text-[#151115] dark:text-[#F8F4F7]">
          LancerMents
        </span>
      </Link>

      {plan === "guest" && (
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#product"
            className="text-sm font-medium text-[#151115]/80 transition-colors duration-200 hover:text-[#85587D] dark:text-[#F8F4F7]/80 dark:hover:text-[#D8A8D3]"
          >
            Product
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-[#151115]/80 transition-colors duration-200 hover:text-[#85587D] dark:text-[#F8F4F7]/80 dark:hover:text-[#D8A8D3]"
          >
            Pricing
          </Link>
        </nav>
      )}

      <div className="flex items-center gap-3">
        <Link
          href="/docs"
          aria-label={t("docs")}
          className={`flex h-10 items-center gap-2 rounded-lg px-3 transition-all duration-200 hover:bg-[#85587D]/10 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:hover:bg-[#D8A8D3]/10 dark:focus:ring-[#D8A8D3] ${
            pathname.startsWith("/docs")
              ? "border border-[#85587D]/20 bg-[#85587D]/5 text-[#85587D] dark:border-[#D8A8D3]/20 dark:bg-[#D8A8D3]/5 dark:text-[#D8A8D3]"
              : "text-[#151115] dark:text-[#F8F4F7]"
          }`}
        >
          <BookOpenIcon />
          <span className="hidden md:inline">{t("docs")}</span>
        </Link>

        <div ref={langRef} className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((open) => !open)}
            aria-expanded={langOpen}
            aria-label={t("language")}
            className={iconButtonClass}
          >
            <GlobeIcon />
          </button>

          {langOpen && (
            <div className="absolute right-0 z-50 mt-2 max-h-80 w-44 origin-top overflow-auto rounded-xl border border-[#E2D8E0] bg-white p-1 shadow-xl transition-all duration-200 dark:border-[#4A2E46] dark:bg-[#221C21]">
              {LOCALE_ORDER.map((code) => {
                const active = code === activeLocale;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => chooseLocale(code)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 ${
                      active
                        ? "text-[#85587D] dark:text-[#D8A8D3]"
                        : "text-[#151115] hover:bg-[#85587D]/10 dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10"
                    }`}
                  >
                    <span className="truncate">{LOCALE_LABELS[code]}</span>
                    {active && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className={iconButtonClass}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        {plan === "guest" ? (
          <>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#151115] transition-opacity duration-200 hover:opacity-70 dark:text-[#F8F4F7]"
            >
              {t("login")}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              {t("signup")}
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="hidden rounded-lg border border-[#E2D8E0] px-4 py-2 text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg sm:inline-block dark:border-[#4A2E46] dark:text-[#F8F4F7]"
            >
              {t("dashboard")}
            </Link>
            <Link
              href="/dashboard/profile"
              aria-label={t("profile")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#85587D] text-sm font-bold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              {initials || "?"}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
