"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export type FeedbackState =
  | {
      kind: "error" | "success";
      label: string;
      raw?: string;
      onRetry?: () => void;
    }
  | null;

/** Map a thrown/returned error to a raw technical reason. */
export function rawReason(error: unknown): string {
  if (error == null) return "Network unreachable";
  const message = error instanceof Error ? error.message : String(error);
  if (
    /failed to fetch|networkerror|network request failed|fetch failed|load failed|networkerror|err_internet/i.test(
      message,
    )
  ) {
    return "Network unreachable";
  }
  return message || "Network unreachable";
}

function AlertCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

export default function FeedbackBanner({
  kind,
  label,
  raw,
  onRetry,
}: {
  kind: "error" | "success";
  label: string;
  raw?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations();
  const [shown, setShown] = useState(false);
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    if (kind === "success") {
      fadeTimer = setTimeout(() => setFading(true), 2500);
      hideTimer = setTimeout(() => setMounted(false), 2800);
    }
    return () => {
      cancelAnimationFrame(frame);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [kind]);

  if (!mounted) return null;

  const success = kind === "success";
  const palette = success
    ? "border-emerald-500/40 bg-emerald-500/10"
    : "border-red-500/40 bg-red-500/10";
  const text = success
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
  const opacity = fading ? "opacity-0" : shown ? "opacity-100" : "opacity-0";

  return (
    <div
      role={success ? "status" : "alert"}
      aria-live={success ? "polite" : "assertive"}
      className={`flex items-start gap-3 rounded-lg border p-3 transition-all motion-reduce:transition-none ${palette} ${opacity} ${
        shown ? "translate-y-0" : "translate-y-1"
      } ${fading ? "duration-300" : "duration-200"}`}
    >
      <span className={`shrink-0 ${text}`}>
        {success ? <CheckCircleIcon /> : <AlertCircleIcon />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${text}`}>{label}</p>
        {raw && (
          <p className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] leading-4 opacity-75">
            {raw}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold transition hover:bg-red-500/10"
        >
          {t("retry")}
        </button>
      )}
    </div>
  );
}
