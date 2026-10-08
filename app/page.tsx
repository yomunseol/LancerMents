import Link from "next/link";
import PricingGrid from "./components/PricingGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F4F7] text-[#151115] transition-colors duration-300 dark:bg-[#151115] dark:text-[#F8F4F7]">
      <main className="mx-auto max-w-6xl px-4 md:px-8 lg:px-12">
        <section className="flex flex-col items-center gap-12 py-24 lg:flex-row">
          <div className="w-full lg:w-1/2">
            <span className="inline-block rounded-full border border-[#E2D8E0] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#85587D] dark:border-[#4A2E46] dark:text-[#D8A8D3]">
              THE AUTOPILOT WORKSPACE
            </span>
            <h1 className="mt-6 break-words text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              <span className="text-[#151115] dark:text-[#F8F4F7]">
                Stop managing tools.
              </span>{" "}
              <span className="text-[#85587D] dark:text-[#D8A8D3]">
                Start managing business.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
              Automate your invoicing, track your tasks, and manage clients in
              one place. LancerMents handles the busywork so you can focus on
              the work.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-lg bg-[#85587D] px-8 py-3 text-lg font-semibold text-white transition-colors hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              Get Started Free
            </Link>
          </div>
          <img
            src="/pexels-mart-production-7643791.jpg"
            alt="Two professionals reviewing work on a laptop in a modern office"
            className="h-[500px] w-full rounded-2xl border border-[#E2D8E0] object-cover dark:border-[#4A2E46] lg:w-1/2"
          />
        </section>

        <section className="flex flex-col items-center gap-12 py-16 lg:flex-row-reverse">
          <div className="w-full lg:w-1/2">
            <h2 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
              Automated Invoicing &amp; Payments.
            </h2>
            <p className="mt-4 text-base leading-relaxed sm:text-lg">
              Set your rates, send a secure link, and get paid. Smart retries
              and automated reminders handle the rest—no awkward follow-ups
              required.
            </p>
          </div>
          <img
            src="/pexels-yankrukov-7698796.jpg"
            alt="Team collaborating over financial charts and documents"
            className="h-[400px] w-full rounded-2xl border border-[#E2D8E0] object-cover dark:border-[#4A2E46] lg:w-1/2"
          />
        </section>

        <section className="flex flex-col items-center gap-12 py-16 lg:flex-row">
          <div className="w-full lg:w-1/2">
            <h2 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
              Visual Task Grids &amp; Client CRM.
            </h2>
            <p className="mt-4 text-base leading-relaxed sm:text-lg">
              Drag, drop, and done. See your entire client pipeline, daily
              tasks, and project deadlines in one clean, intuitive view.
            </p>
          </div>
          <img
            src="/pexels-thirdman-7652054.jpg"
            alt="Team reviewing a client pipeline together on a laptop"
            className="h-[400px] w-full rounded-2xl border border-[#E2D8E0] object-cover dark:border-[#4A2E46] lg:w-1/2"
          />
        </section>

        <PricingGrid />
      </main>

      <footer className="border-t border-[#E2D8E0] py-8 text-center text-sm text-[#151115]/70 dark:border-[#4A2E46] dark:text-[#F8F4F7]/70">
        2026 Yomunseol • Also building{" "}
        <a
          href="https://caremunicate.online"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
        >
          Caremunicate
        </a>
      </footer>
    </div>
  );
}
