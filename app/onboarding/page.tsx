"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BusinessType = {
  id: string;
  title: string;
  description: string;
};

type Plan = {
  id: string;
  name: string;
  price: string;
  description: string;
  popular?: boolean;
};

const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "content-creator",
    title: "Content Creator",
    description: "For solo creators managing brands and sponsors",
  },
  {
    id: "freelance-artist",
    title: "Freelance Artist",
    description: "For independent artists booking clients and commissions",
  },
  {
    id: "sole-entrepreneur",
    title: "Sole Entrepreneur",
    description: "For founders running the whole show solo",
  },
  {
    id: "team-company",
    title: "Team Company",
    description: "For small teams collaborating in one workspace",
  },
];

const PLANS: Plan[] = [
  {
    id: "engine-room",
    name: "The Engine Room",
    price: "9",
    description: "For solo operators getting organized.",
  },
  {
    id: "pipeline",
    name: "The Pipeline",
    price: "19",
    description: "For growing client work and steady revenue.",
    popular: true,
  },
  {
    id: "studio",
    name: "The Studio",
    price: "49",
    description: "For teams and studios scaling up.",
  },
];

function optionClass(selected: boolean, premium = false): string {
  if (selected) {
    return "border-2 border-[#85587D] bg-[#F8F4F7] dark:border-[#D8A8D3] dark:bg-[#2A2229]";
  }
  if (premium) {
    return "border-2 border-[#85587D] bg-white dark:border-[#D8A8D3] dark:bg-[#221C21]";
  }
  return "border border-[#E2D8E0] bg-white dark:border-[#4A2E46] dark:bg-[#221C21]";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedBusinessType, setSelectedBusinessType] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(false);

  function startFreeTrial() {
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-20 md:px-8 lg:px-12">
      <p className="mb-2 text-sm font-semibold text-[#85587D] dark:text-[#D8A8D3]">
        Step {currentStep} of 2
      </p>
      <div className="h-1 w-full rounded-full bg-[#E2D8E0] dark:bg-[#4A2E46]">
        <div
          className={`h-1 rounded-full bg-[#85587D] transition-all duration-200 dark:bg-[#D8A8D3] ${
            currentStep === 1 ? "w-1/2" : "w-full"
          }`}
        />
      </div>

      {currentStep === 1 ? (
        <section className="mt-12">
          <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            What best describes your work?
          </h1>
          <p className="mt-2 text-[#151115]/70 dark:text-[#F8F4F7]/70">
            {"We'll tailor your workspace to fit your workflow."}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {BUSINESS_TYPES.map((type) => {
              const selected = selectedBusinessType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedBusinessType(type.id)}
                  className={`w-full min-h-[100px] cursor-pointer rounded-2xl p-8 text-left transition-all duration-200 hover:shadow-lg ${optionClass(
                    selected,
                  )}`}
                >
                  <span className="block text-lg font-bold text-[#151115] dark:text-[#F8F4F7]">
                    {type.title}
                  </span>
                  <span className="mt-1 block text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
                    {type.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex justify-end">
            <button
              type="button"
              disabled={!selectedBusinessType}
              onClick={() => setCurrentStep(2)}
              className="w-full rounded-lg bg-[#85587D] px-6 py-2.5 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              Continue
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-12">
          <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            Choose your engine.
          </h1>
          <p className="mt-2 text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Start with a 14-day free trial. Cancel anytime.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((plan) => {
              const selected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative w-full min-h-[100px] cursor-pointer rounded-2xl p-8 text-left transition-all duration-200 hover:shadow-lg ${optionClass(
                    selected,
                    plan.popular,
                  )}`}
                >
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
                    <span className="text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
                      /mo
                    </span>
                  </span>
                  <span className="mt-2 block text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
                    {plan.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full rounded-lg border border-[#E2D8E0] px-6 py-2.5 text-base font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg md:w-auto dark:border-[#4A2E46] dark:text-[#F8F4F7]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={startFreeTrial}
              disabled={loading}
              className="w-full rounded-lg bg-[#85587D] px-6 py-2.5 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              {loading ? "Starting…" : "Start Free Trial"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
