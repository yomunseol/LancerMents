"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MOCK_TASKS = [
  { id: 1, title: "Recon the pipeline", meta: "Due today" },
  { id: 2, title: "Draft Q3 targeting brief", meta: "Due today" },
  { id: 3, title: "Weekly pipeline review", meta: "Due Friday" },
];

const NAV_ITEMS = ["Dashboard", "Tasks", "Settings"];

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    client.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function handleLogout() {
    await supabase?.auth.signOut();
    router.push("/login");
  }

  function toggleTask(id: number) {
    setDone((current) =>
      current.includes(id)
        ? current.filter((taskId) => taskId !== id)
        : [...current, id],
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b border-[#E2D8E0] bg-white p-6 md:w-64 md:shrink-0 md:border-b-0 md:border-r dark:border-[#4A2E46] dark:bg-[#221C21]">
        <div className="flex items-center gap-3">
          <img
            src="/LancerMents-Dark.png"
            alt="LancerMents"
            className="h-10 w-10 rounded-xl border border-[#4A2E46] object-cover"
          />
          <span className="text-lg font-bold text-[#151115] dark:text-[#F8F4F7]">
            LancerMents
          </span>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item, index) => {
            const active = index === 0;
            if (active) {
              return (
                <Link
                  key={item}
                  href="/dashboard"
                  className="rounded-lg bg-[#F8F4F7] px-4 py-2.5 text-sm font-semibold text-[#85587D] dark:bg-[#151115] dark:text-[#D8A8D3]"
                >
                  {item}
                </Link>
              );
            }
            return (
              <span
                key={item}
                aria-disabled="true"
                className="cursor-not-allowed rounded-lg px-4 py-2.5 text-sm font-medium text-[#151115]/70 dark:text-[#F8F4F7]/70"
              >
                {item}
              </span>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded-lg border border-[#E2D8E0] px-4 py-2.5 text-sm font-semibold text-[#151115] transition-colors hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 px-4 py-10 md:px-10">
        <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
          Welcome back
        </h1>
        {email && (
          <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            {email}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-[#E2D8E0] bg-white p-6 dark:border-[#4A2E46] dark:bg-[#221C21]">
          <h2 className="text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]">
            Daily Tasks
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {MOCK_TASKS.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-[#E2D8E0] bg-[#F8F4F7] px-4 py-3 dark:border-[#4A2E46] dark:bg-[#151115]"
              >
                <input
                  id={`task-${task.id}`}
                  type="checkbox"
                  checked={done.includes(task.id)}
                  onChange={() => toggleTask(task.id)}
                  className="h-4 w-4 accent-[#85587D] dark:accent-[#D8A8D3]"
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className={`flex-1 text-sm text-[#151115] dark:text-[#F8F4F7] ${
                    done.includes(task.id) ? "line-through opacity-60" : ""
                  }`}
                >
                  {task.title}
                </label>
                <span className="text-xs text-[#151115]/70 dark:text-[#F8F4F7]/70">
                  {task.meta}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#85587D] bg-white p-6 sm:flex-row sm:items-center sm:justify-between dark:border-[#D8A8D3] dark:bg-[#221C21]">
          <div>
            <h2 className="text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]">
              Upgrade Plan
            </h2>
            <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
              Unlock unlimited tasks and CRM. All plans are free during Beta.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="w-full rounded-lg bg-[#85587D] px-6 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:opacity-90 sm:w-auto dark:bg-[#D8A8D3] dark:text-[#151115]"
          >
            Upgrade Plan
          </Link>
        </section>
      </main>
    </div>
  );
}
