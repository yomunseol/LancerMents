"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useClients } from "@/app/components/useClients";
import { useClientTimer } from "@/app/components/useClientTimer";
import { useWorkspaceGate } from "../useWorkspaceData";

const CARD =
  "rounded-2xl border border-[#E2D8E0] bg-white shadow-xl dark:border-[#4A2E46] dark:bg-[#221C21]";
const LABEL = "text-[11px] tracking-widest opacity-60";

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}

export default function TimePage() {
  const t = useTranslations();
  const ws = useWorkspaceGate();
  const workspaceId = ws?.id ?? "";
  const clients = useClients(workspaceId);
  const timer = useClientTimer(workspaceId);

  if (!ws) {
    return (
      <div className="h-40 animate-pulse rounded-2xl border border-[#E2D8E0] bg-[#E2D8E0]/40 dark:border-[#4A2E46] dark:bg-[#4A2E46]/30" />
    );
  }

  const storedMissing =
    timer.clientId !== null && !clients.some((client) => client.id === timer.clientId);

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        {t("time.title")}
      </h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {t("time.selectClient")}
      </p>

      <section className={`mt-8 max-w-2xl ${CARD}`}>
        <div className="flex items-center justify-between border-b border-[#E2D8E0] px-5 py-4 dark:border-[#4A2E46]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#85587D] dark:bg-[#D8A8D3]" />
            <h2 className="text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
              {t("time.title")}
            </h2>
            <span className={LABEL}>{t("time.client")}</span>
          </div>
        </div>

        <div className="px-5 py-5">
          <label className={`block ${LABEL}`} htmlFor="time-client">
            {t("time.selectClient")}
          </label>
          <select
            id="time-client"
            value={timer.clientId ?? ""}
            onChange={(event) => {
              const next = clients.find((client) => client.id === event.target.value) ?? null;
              timer.selectClient(next?.id ?? null, next?.name ?? null);
            }}
            disabled={clients.length === 0 && !storedMissing}
            className="mt-2 h-10 w-full rounded-lg border border-[#E2D8E0] bg-white px-3 text-sm text-[#151115] transition-colors duration-200 focus:border-[#85587D] focus:outline-none focus:ring-2 focus:ring-[#85587D]/30 disabled:opacity-60 dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:focus:border-[#D8A8D3] dark:focus:ring-[#D8A8D3]/30"
          >
            <option value="">
              {clients.length === 0 ? t("time.noClients") : t("time.none")}
            </option>
            {storedMissing && (
              <option value={timer.clientId ?? ""}>
                {timer.clientName ?? t("time.none")}
              </option>
            )}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <span
              className="font-mono text-4xl font-semibold tabular-nums text-[#85587D] dark:text-[#D8A8D3]"
              aria-live="polite"
            >
              {timer.formatted}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={timer.toggle}
                aria-label={timer.running ? t("time.pause") : t("time.start")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#85587D] text-white transition-colors duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
              >
                {timer.running ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button
                type="button"
                onClick={timer.reset}
                className="rounded-lg border border-[#E2D8E0] px-3 py-2 text-sm font-semibold text-[#151115] transition-colors duration-200 hover:border-[#85587D] dark:border-[#4A2E46] dark:text-[#F8F4F7] dark:hover:border-[#D8A8D3]"
              >
                {t("time.reset")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Link
        href="/dashboard/tasks"
        className="mt-6 inline-block text-sm font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
      >
        {t("back")}
      </Link>
    </>
  );
}
