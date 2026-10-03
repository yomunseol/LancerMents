import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";

const engineRoomFeatures = [
  "1 Workspace",
  "Grid Task List (3 daily tasks)",
  "Async Calendar",
];

const pipelineFeatures = [
  "2 Workspaces",
  "CRM Kanban",
  "Secure Client Links (max 5)",
  "Direct Invoice Output",
];

const studioFeatures = [
  "Up to 5 Workspaces",
  "White-Label Customization",
  "Multi-Workspace Switcher",
  "Secure Client Links (max 15)",
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mb-8 mt-6 flex flex-col gap-3 text-sm">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span aria-hidden="true" className="text-[#85587D] dark:text-[#D8A8D3]">
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F4F7] text-[#151115] transition-colors duration-300 dark:bg-[#151115] dark:text-[#F8F4F7]">
      <header className="sticky top-0 z-50">
        <nav className="flex min-h-[80px] items-center justify-between border-b border-[#E2D8E0] bg-white px-4 py-4 transition-colors duration-300 md:px-8 md:py-6 lg:px-12 dark:border-[#4A2E46] dark:bg-[#151115]">
          <div className="flex items-center gap-4">
            <img
              src="/LancerMents-Light.png"
              alt="LancerMents Light"
              className="block h-10 w-10 rounded-xl border border-[#E2D8E0] object-cover dark:hidden dark:border-[#D8A8D3] md:h-12 md:w-12"
            />
            <img
              src="/LancerMents-Dark.png"
              alt="LancerMents Dark"
              className="hidden h-10 w-10 rounded-xl border border-[#E2D8E0] object-cover dark:block dark:border-[#D8A8D3] md:h-12 md:w-12"
            />
            <span className="hidden text-xl font-bold text-[#151115] dark:text-[#F8F4F7] md:inline md:text-3xl">
              LancerMents
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#151115] transition-opacity hover:opacity-70 dark:text-[#F8F4F7]"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-colors dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

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

        <section className="grid grid-cols-1 gap-8 border-t border-[#E2D8E0] py-24 md:grid-cols-3 dark:border-[#4A2E46]">
          <p className="col-span-full text-center text-sm font-semibold text-[#85587D] dark:text-[#D8A8D3]">
            All plans are free during Beta.
          </p>
          <article className="flex flex-col rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
            <h3 className="text-lg font-semibold">The Engine Room</h3>
            <p className="mt-2">
              <span className="text-3xl font-bold">$9</span>
              <span className="text-sm opacity-80">/mo</span>
            </p>
            <FeatureList items={engineRoomFeatures} />
            <Link
              href="/signup"
              className="mt-auto block rounded-lg border border-[#E2D8E0] py-2 text-center text-sm font-semibold text-[#151115] transition-colors hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
            >
              Get Started Free
            </Link>
          </article>

          <article className="relative flex flex-col rounded-2xl border border-[#85587D] bg-white p-8 dark:border-[#D8A8D3] dark:bg-[#221C21]">
            <span className="absolute right-4 top-4 rounded-full bg-[#85587D] px-2 py-1 text-xs font-bold text-white dark:bg-[#D8A8D3] dark:text-[#151115]">
              POPULAR
            </span>
            <h3 className="text-lg font-semibold">The Pipeline</h3>
            <p className="mt-2">
              <span className="text-3xl font-bold">$19</span>
              <span className="text-sm opacity-80">/mo</span>
            </p>
            <FeatureList items={pipelineFeatures} />
            <Link
              href="/signup"
              className="mt-auto block rounded-lg bg-[#85587D] py-2 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              Get Started Free
            </Link>
          </article>

          <article className="flex flex-col rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
            <h3 className="text-lg font-semibold">The Studio</h3>
            <p className="mt-2">
              <span className="text-3xl font-bold">$49</span>
              <span className="text-sm opacity-80">/mo</span>
            </p>
            <FeatureList items={studioFeatures} />
            <Link
              href="/signup"
              className="mt-auto block rounded-lg border border-[#E2D8E0] py-2 text-center text-sm font-semibold text-[#151115] transition-colors hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
            >
              Get Started Free
            </Link>
          </article>
        </section>
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
