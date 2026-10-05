"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { saveProfile } from "@/lib/profile";
import { useProfile } from "@/app/dashboard/ProfileContext";

type BusinessType = {
  id: string;
  title: string;
  description: string;
};

type Plan = {
  id: string;
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
};

const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "content-creator",
    title: "Content Creator",
    description: "For creators managing brands, sponsors, and drops",
  },
  {
    id: "freelance-artist",
    title: "Freelance Artist",
    description: "For artists juggling commissions and clients",
  },
  {
    id: "sole-entrepreneur",
    title: "Sole Entrepreneur",
    description: "For founders running invoicing and pipeline solo",
  },
  {
    id: "team-company",
    title: "Team Company",
    description: "For small teams coordinating workspaces and roles",
  },
];

const PLANS: Plan[] = [
  {
    id: "engine-room",
    name: "The Engine Room",
    price: "9",
    features: ["1 Workspace", "Grid Task List (3 daily)", "Async Calendar"],
  },
  {
    id: "pipeline",
    name: "The Pipeline",
    price: "19",
    features: [
      "2 Workspaces",
      "CRM Kanban",
      "Secure Client Links (max 5)",
      "Direct Invoice Output",
    ],
    popular: true,
  },
  {
    id: "studio",
    name: "The Studio",
    price: "49",
    features: [
      "Up to 5 Workspaces",
      "White-Label",
      "Multi-Workspace Switcher",
      "Secure Client Links (max 15)",
    ],
  },
];

const CARD_BASE =
  "w-full min-h-[100px] cursor-pointer rounded-2xl p-8 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5";

function businessCardClass(selected: boolean): string {
  return selected
    ? "border-2 border-[#85587D] bg-[#85587D]/5 dark:border-[#D8A8D3] dark:bg-[#D8A8D3]/5"
    : "border border-[#E2D8E0] bg-white dark:border-[#4A2E46] dark:bg-[#221C21]";
}

function planCardClass(selected: boolean, popular = false): string {
  const border = popular
    ? "border-2 border-[#85587D] dark:border-[#D8A8D3]"
    : "border border-[#E2D8E0] dark:border-[#4A2E46]";
  const ring = selected ? "ring-2 ring-[#85587D] dark:ring-[#D8A8D3]" : "";
  return `${border} bg-white dark:bg-[#221C21] ${ring}`;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations();
  const { refresh } = useProfile();
  const [checking, setChecking] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [planType, setPlanType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const edit = params.get("edit") === "1";
      const from = params.get("from");
      if (from) setReturnTo(decodeURIComponent(from));

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!active) return;
        if (!sessionData.session) {
          router.replace("/signup");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("business_type,plan_type")
          .eq("id", sessionData.session.user.id)
          .maybeSingle();

        if (!active) return;

        const business = (profile as { business_type?: string | null } | null)?.business_type;
        const plan = (profile as { plan_type?: string | null } | null)?.plan_type;

        if (business && plan) {
          if (!edit) {
            router.replace("/dashboard");
            return;
          }
          // PLAN-CHANGE MODE
          setEditMode(true);
          setPlanType(plan);
          setStep(2);
          setChecking(false);
          return;
        }

        setStep(business ? 2 : 1);
        setChecking(false);
      } catch {
        if (active) router.replace("/signup");
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  async function finishOnboarding() {
    setError(null);
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Your session expired. Please sign in again.");

      const currentLocale =
        (typeof document !== "undefined"
          ? document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1]
          : null) ??
        (typeof window !== "undefined"
          ? window.localStorage.getItem("lancermonts.locale")
          : null) ??
        "en";

      const patch = editMode
        ? { plan_type: planType }
        : { business_type: businessType, plan_type: planType, locale: currentLocale };

      const result = await saveProfile(user.id, patch);
      if (!result.ok) throw new Error(result.error);

      await refresh();
      router.push(returnTo || "/dashboard");
    } catch (saveError) {
      setLoading(false);
      setError(messageOf(saveError, "Could not save your setup. Please try again."));
    }
  }

  if (checking) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm opacity-50">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="mb-2 text-sm font-semibold text-[#85587D] dark:text-[#D8A8D3]">
        Step {step} of 2
      </p>
      <div className="h-1 w-full rounded-full bg-[#E2D8E0] dark:bg-[#4A2E46]">
        <div
          className={`h-1 rounded-full bg-[#85587D] transition-all duration-500 dark:bg-[#D8A8D3] ${
            editMode || step === 2 ? "w-full" : "w-1/2"
          }`}
        />
      </div>

      {step === 1 ? (
        <section className="mt-12">
          <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            What best describes your work?
          </h1>
          <p className="mt-2 opacity-70">
            {"We'll tailor your workspace to fit your workflow."}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {BUSINESS_TYPES.map((type) => {
              const selected = businessType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setBusinessType(type.id)}
                  className={`${CARD_BASE} ${businessCardClass(selected)}`}
                >
                  <span className="block text-lg font-bold text-[#151115] dark:text-[#F8F4F7]">
                    {type.title}
                  </span>
                  <span className="mt-1 block text-sm opacity-70">
                    {type.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex justify-end">
            <button
              type="button"
              disabled={!businessType}
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-[#85587D] px-6 py-2.5 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              Continue
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-12">
          <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            {t("plan_title")}
          </h1>
          <p className="mt-2 opacity-70">{t("plan_sub")}</p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((plan) => {
              const selected = planType === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPlanType(plan.id)}
                  className={`relative ${CARD_BASE} ${planCardClass(
                    selected,
                    plan.popular,
                  )}`}
                >
                  {editMode && planType === plan.id && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#85587D]/15 px-2 py-1 text-xs font-bold text-[#85587D] dark:bg-[#D8A8D3]/15 dark:text-[#D8A8D3]">
                      {t("current_plan")}
                    </span>
                  )}
                  {plan.popular && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#85587D] px-2 py-1 text-xs font-bold text-white dark:bg-[#D8A8D3] dark:text-[#151115]">
                      POPULAR
                    </span>
                  )}
                  <span className="block text-lg font-bold text-[#151115] dark:text-[#F8F4F7]">
                    {plan.name}
                  </span>
                  <span className="mt-2 block">
                    <span className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
                      ${plan.price}
                    </span>
                    <span className="text-sm opacity-70">/mo</span>
                  </span>
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span
                          aria-hidden="true"
                          className="text-[#85587D] dark:text-[#D8A8D3]"
                        >
                          •
                        </span>
                        <span className="opacity-70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {!editMode && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full rounded-lg border border-[#E2D8E0] px-6 py-2.5 text-base font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg md:w-auto dark:border-[#4A2E46] dark:text-[#F8F4F7]"
              >
                {t("back")}
              </button>
            )}
            <button
              type="button"
              onClick={finishOnboarding}
              disabled={loading || !planType}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#85587D] px-6 py-2.5 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              {loading ? (
                <>
                  <Spinner />
                  {t("loading")}
                </>
              ) : editMode ? (
                t("change_plan")
              ) : (
                t("start_trial")
              )}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
